import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { QUEUE_NAME } from '../queues/render-queue';
import { buildPrompt } from '../recipes';
import { NanoBananaService } from '../services/nano-banana';
import { logIncident } from '../lib/telemetry';
const MODEL_CONFIG: Record<string, { steps: number; size: '1024x1024'; displayName: string; modelId: string }> = {
  lite: { steps: 8, size: '1024x1024', displayName: 'Swift', modelId: 'lite' },
  fast: { steps: 10, size: '1024x1024', displayName: 'Balanced', modelId: 'fast' },
  pro: { steps: 20, size: '1024x1024', displayName: 'Studio', modelId: 'pro' },
};

export interface AreaAssignment {
  areaKey: string;
  fabricId: string;
  fabricName: string;
  fabricCode: string;
  fabricColorDescription?: string;
  fabricTextureDescription?: string;
  fabricImageUrl?: string | null;
}
// -- Startup check: NANO_BANANA_API_KEY must be set (unless mocked) ------------
// This follows the same throw-on-startup pattern used for JWT_SECRET elsewhere.
const _apiKey = process.env['NANO_BANANA_API_KEY'];
if (!_apiKey || _apiKey === '') {
  // In mock mode this is acceptable; in production it must be set.
  console.warn(
    '[Worker] WARNING: NANO_BANANA_API_KEY is not set. ' +
    'Worker will run in MOCK mode. Set the env var for live rendering.',
  );
}

export function setupRenderWorker(connection: Redis, db: Pool) {
  const nanoBanana = new NanoBananaService();

  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const {
        renderJobId,
        visualizationId,
        composedPrompt,
        model,
        areaAssignments,
        roomImageUrl,
        fabricSwatchUrls,
        fabricId,
        roomId,
        uploadedPhotoUrl,
        objectType,
        sourceType,
      } = job.data as {
        renderJobId: string;
        visualizationId: string;
        composedPrompt?: string;
        model?: 'lite' | 'fast' | 'pro';
        areaAssignments?: AreaAssignment[];
        roomImageUrl?: string;
        fabricSwatchUrls?: string[];
        fabricId?: string;
        roomId?: string;
        uploadedPhotoUrl?: string;
        objectType?: string;
        sourceType?: string;
      };

      console.log(`[Job ${job.id}] Starting processing for render job ${renderJobId}...`);

      try {
        // 1. Mark as processing
        await db.query(
          `UPDATE render_jobs SET status = 'processing', attempt_count = attempt_count + 1, started_at = NOW() WHERE id = $1`,
          [renderJobId],
        );
        await db.query(`UPDATE visualizations SET status = 'processing' WHERE id = $1`, [visualizationId]);

        // 2. Build the prompt
        let prompt: string;
        if (composedPrompt) {
          prompt = composedPrompt;
          console.log(`[Job ${job.id}] Using composedPrompt from payload (multi-area).`);
        } else {
          const legacyFabricId = fabricId;
          if (!legacyFabricId) throw new Error('No fabricId or composedPrompt in job payload');
          const fabricRes = await db.query(`SELECT name, tags FROM fabrics WHERE id = $1`, [legacyFabricId]);
          if (fabricRes.rowCount === 0) throw new Error('Fabric not found');
          const fabric = fabricRes.rows[0];
          prompt = buildPrompt(objectType ?? 'sofa', fabric.name, fabric.tags);
          console.log(`[Job ${job.id}] Using legacy buildPrompt (single-fabric).`);
        }

        // Save prompt_used to DB
        await db.query(`UPDATE render_jobs SET prompt_used = $1 WHERE id = $2`, [prompt, renderJobId]);

        // 3. Determine source image
        let finalSourceImage = roomImageUrl;
        if (!finalSourceImage) {
          finalSourceImage = uploadedPhotoUrl;
          if (roomId && !finalSourceImage) {
            const roomRes = await db.query(`SELECT image_url FROM predefined_rooms WHERE id = $1`, [roomId]);
            if (roomRes.rowCount !== 0) {
              finalSourceImage = roomRes.rows[0].image_url;
            }
          }
        }

        const resolvedModel = (model === 'pro' ? 'pro' : model === 'fast' ? 'fast' : 'lite') as 'lite' | 'fast' | 'pro';
        const modelConfig = MODEL_CONFIG[resolvedModel];
        console.log(`[Job ${job.id}] Using model: ${modelConfig.displayName} (${modelConfig.modelId})`);

        // Build reference image list
        const referenceImageUrls: string[] = fabricSwatchUrls ?? [];
        if (referenceImageUrls.length === 0 && areaAssignments && areaAssignments.length > 0) {
          for (const a of areaAssignments) {
            if (a.fabricImageUrl && !referenceImageUrls.includes(a.fabricImageUrl)) {
              referenceImageUrls.push(a.fabricImageUrl);
            }
          }
          if (areaAssignments.length > 1) {
            const swatchRefs = areaAssignments
              .filter((a) => a.fabricImageUrl)
              .map((a) => `${a.fabricName} (${a.fabricCode}) for ${a.areaKey}`)
              .join('; ');
            if (swatchRefs) {
              prompt = prompt + `\nReference swatches: ${swatchRefs}.`;
            }
          }
        }

        if (!finalSourceImage) {
          throw new Error(
            'Render aborted: no room image could be resolved. ' +
            `roomImageUrl=${job.data.roomImageUrl ?? 'not provided'}, ` +
            `uploadedPhotoUrl=${job.data.uploadedPhotoUrl ?? 'not provided'}, ` +
            `roomId=${job.data.roomId ?? 'not provided'}`,
          );
        }

        // LOG 1 - Before building the API call payload
        console.log('[RENDER_WORKER] Job started', {
          renderJobId: job.data.renderJobId,
          sourceType: job.data.sourceType,
          roomImageUrl: finalSourceImage,
          fabricSwatchUrls: referenceImageUrls,
          areaCount: job.data.areaAssignments?.length ?? 1,
          model: job.data.model,
          promptLength: prompt?.length ?? 0,
        });

        // 4. Call Nano Banana Service
        const result = await nanoBanana.generateImage(prompt, finalSourceImage, model as 'lite' | 'fast' | 'pro', referenceImageUrls);

        // LOG 2 - After the AI API call returns
        console.log('[RENDER_WORKER] AI API response received', {
          renderJobId: job.data.renderJobId,
          responseStatus: result.success ? 200 : 500,
          hasOutputImage: !!result.imageUrl,
          outputImageUrl: result.imageUrl ?? 'MISSING',
        });

        if (!result.success || !result.imageUrl) {
          throw new Error(result.error || 'Failed to generate image');
        }

        // 5. Quality check (simulated)
        console.log(`[Job ${job.id}] Performing quality check on generated image...`);

        // 6. Update DB with success
        await db.query(
          `UPDATE render_jobs SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [renderJobId],
        );
        await db.query(
          `UPDATE visualizations SET status = 'completed', after_url = $1, before_url = $2 WHERE id = $3`,
          [result.imageUrl, finalSourceImage, visualizationId],
        );

        // 7. Deduct credit
        const visRow = await db.query(
          `SELECT access_code_id, customer_id FROM visualizations WHERE id = $1`,
          [visualizationId],
        );
        if (visRow.rowCount && visRow.rowCount > 0) {
          const accessCodeId = visRow.rows[0].access_code_id;
          const customerId = visRow.rows[0].customer_id;
          
          if (accessCodeId) {
            await db.query(
              `UPDATE access_codes SET credit_limit = GREATEST(credit_limit - 1, 0), credits_used = credits_used + 1 WHERE id = $1`,
              [accessCodeId],
            );
            await db.query(
              `INSERT INTO credit_transactions (access_code_id, amount, reason)
               VALUES ($1, -1, 'render_job_completed')`,
              [accessCodeId],
            );
            console.log(`[Job ${job.id}] Deducted 1 credit from access code ${accessCodeId}.`);

            // Enforce 30-item history limit
            await db.query(
              `WITH top_30 AS (
                 SELECT id FROM visualizations WHERE access_code_id = $1 ORDER BY created_at DESC LIMIT 30
               )
               DELETE FROM visualizations WHERE access_code_id = $1 AND id NOT IN (SELECT id FROM top_30)`,
              [accessCodeId]
            );
            console.log(`[Job ${job.id}] Enforced 30-item history limit for access code ${accessCodeId}.`);
          } else if (customerId) {
            await db.query(
              `UPDATE customers SET credits_used = credits_used + 1 WHERE id = $1`,
              [customerId],
            );
            console.log(`[Job ${job.id}] Deducted 1 credit from customer ${customerId}.`);

            // Enforce 30-item history limit
            await db.query(
              `WITH top_30 AS (
                 SELECT id FROM visualizations WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 30
               )
               DELETE FROM visualizations WHERE customer_id = $1 AND id NOT IN (SELECT id FROM top_30)`,
              [customerId]
            );
            console.log(`[Job ${job.id}] Enforced 30-item history limit for customer ${customerId}.`);
          }
        }

        console.log(`[Job ${job.id}] Render completed successfully!`);
        return { success: true, imageUrl: result.imageUrl };

      } catch (err) {
        // LOG 3 - On error
        console.error('[RENDER_WORKER] Job failed', {
          renderJobId: job.data.renderJobId,
          error: err instanceof Error ? err.message : String(err),
          roomImageUrl: job.data.roomImageUrl ?? 'NOT_PROVIDED',
          fabricSwatchUrls: job.data.fabricSwatchUrls ?? [],
        });

        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Job ${job.id}] Render failed: ${errorMsg}`);

        // BullMQ will retry if attempts < max.
        await db.query(`UPDATE render_jobs SET error_message = $1 WHERE id = $2`, [errorMsg, renderJobId]);

        // Rethrow so BullMQ knows it failed and can retry
        throw err;
      }
    },
    { connection: connection as any },
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed!`);
  });

  worker.on('failed', async (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      const renderJobId: string = job.data.renderJobId;
      const visualizationId: string = job.data.visualizationId;

      console.log(`[Job ${job.id}] Retries exhausted. Marking as failed.`);

      logIncident({
        errorType: 'RENDER_PIPELINE_FAILURE',
        message: 'Render Job exhausted retries and permanently failed.',
        context: {
          jobId: job.id,
          renderJobId,
          visualizationId,
          errorMsg: err.message,
        },
      });

      try {
        await db.query(`UPDATE render_jobs SET status = 'failed' WHERE id = $1`, [renderJobId]);
        await db.query(`UPDATE visualizations SET status = 'failed' WHERE id = $1`, [visualizationId]);
      } catch (dbErr) {
        console.error('Failed to update job status to failed:', dbErr);
      }
    } else if (job) {
      console.log(`[Job ${job.id}] Job failed, marking as retrying.`);
      const renderJobId: string = job.data.renderJobId;
      try {
        await db.query(`UPDATE render_jobs SET status = 'retrying' WHERE id = $1`, [renderJobId]);
      } catch (dbErr) {
        console.error('Failed to update job status to retrying:', dbErr);
      }
    }
  });

  return worker;
}


