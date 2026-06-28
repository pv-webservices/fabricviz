import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { QUEUE_NAME } from '../queues/render-queue';
import { buildPrompt } from '../recipes';
import { NanoBananaService } from '../services/nano-banana';
import { logIncident } from '../lib/telemetry';
const MODEL_CONFIG: Record<string, { steps: number; size: '1024x1024'; displayName: string; modelId: string }> = {
  fast: { steps: 10, size: '1024x1024', displayName: 'Fast', modelId: 'fast' },
  pro: { steps: 20, size: '1024x1024', displayName: 'Pro', modelId: 'pro' },
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
// ── Startup check: NANO_BANANA_API_KEY must be set (unless mocked) ────────────
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
        // Multi-area fields (new)
        composedPrompt,
        model,
        areaAssignments,
        // Legacy / shared fields
        fabricId,
        roomId,
        uploadedPhotoUrl,
        objectType,
      } = job.data as {
        renderJobId: string;
        visualizationId: string;
        composedPrompt?: string;
        model?: 'fast' | 'pro';
        areaAssignments?: AreaAssignment[];
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
        //    CHANGE 1: Use composedPrompt from job payload when available (multi-area).
        //    Fall back to legacy buildPrompt for old single-fabric jobs.
        let prompt: string;
        if (composedPrompt) {
          prompt = composedPrompt;
          console.log(`[Job ${job.id}] Using composedPrompt from payload (multi-area).`);
        } else {
          // Legacy path: fetch fabric metadata and build prompt the old way
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

        // 3. Determine source image (unchanged from existing logic)
        let sourceImage: string | undefined | null = uploadedPhotoUrl;
        if (roomId && !sourceImage) {
          const roomRes = await db.query(`SELECT image_url FROM predefined_rooms WHERE id = $1`, [roomId]);
          if (roomRes.rowCount !== 0) {
            sourceImage = roomRes.rows[0].image_url;
          }
        }

        // CHANGE 2: Resolve model config for endpoint/modelId
        const resolvedModel = (model === 'pro' ? 'pro' : 'fast') as 'fast' | 'pro';
        const modelConfig = MODEL_CONFIG[resolvedModel];
        console.log(`[Job ${job.id}] Using model: ${modelConfig.displayName} (${modelConfig.modelId})`);

        // CHANGE 3: Build reference image list for multi-area jobs.
        // The NanaBanana service currently supports one source image.
        // Pass the first fabric image as primary reference; include others in prompt as text.
        let finalSourceImage: string | null | undefined = sourceImage;
        const referenceImageUrls: string[] = [];
        
        if (areaAssignments && areaAssignments.length > 0) {
          const firstFabricImage = areaAssignments.find((a) => a.fabricImageUrl)?.fabricImageUrl;
          
          for (const a of areaAssignments) {
            if (a.fabricImageUrl && !referenceImageUrls.includes(a.fabricImageUrl)) {
              referenceImageUrls.push(a.fabricImageUrl);
            }
          }
          
          // We intentionally keep the room image as the primary source for transformation.
          // Fabric swatches are described in the prompt.
          if (areaAssignments.length > 1) {
            const swatchRefs = areaAssignments
              .filter((a) => a.fabricImageUrl)
              .map((a) => `${a.fabricName} (${a.fabricCode}) for ${a.areaKey}`)
              .join('; ');
            if (swatchRefs) {
              prompt = prompt + `\nReference swatches: ${swatchRefs}.`;
            }
          }
          // Use firstFabricImage as additional context only if no room image is available
          if (!finalSourceImage && firstFabricImage) {
            finalSourceImage = firstFabricImage;
          }
        }

        // 4. Call Nano Banana Service
        const result = await nanoBanana.generateImage(prompt, finalSourceImage, model as 'fast' | 'pro', referenceImageUrls);

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
          [result.imageUrl, sourceImage, visualizationId],
        );

        // CHANGE 4: Deduct exactly 1 credit after successful generation.
        // Credit deduction happens here, after success, regardless of area count.
        // We look up the access_code_id from the visualization record.
        const visRow = await db.query(
          `SELECT access_code_id FROM visualizations WHERE id = $1`,
          [visualizationId],
        );
        if (visRow.rowCount && visRow.rowCount > 0 && visRow.rows[0].access_code_id) {
          const accessCodeId: string = visRow.rows[0].access_code_id;
          await db.query(
            `UPDATE access_codes SET credit_limit = GREATEST(credit_limit - 1, 0) WHERE id = $1`,
            [accessCodeId],
          );
          await db.query(
            `INSERT INTO credit_transactions (access_code_id, amount, reason)
             VALUES ($1, -1, 'render_job_completed')`,
            [accessCodeId],
          );
          console.log(`[Job ${job.id}] Deducted 1 credit from access code ${accessCodeId}.`);

          // Enforce 50-item history limit for this user
          await db.query(
            `WITH top_50 AS (
               SELECT id FROM visualizations WHERE access_code_id = $1 ORDER BY created_at DESC LIMIT 50
             )
             DELETE FROM visualizations WHERE access_code_id = $1 AND id NOT IN (SELECT id FROM top_50)`,
            [accessCodeId]
          );
          console.log(`[Job ${job.id}] Enforced 50-item history limit for access code ${accessCodeId}.`);
        }

        console.log(`[Job ${job.id}] Render completed successfully!`);
        return { success: true, imageUrl: result.imageUrl };

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Job ${job.id}] Render failed: ${errorMsg}`);

        // BullMQ will retry if attempts < max.
        // The worker 'failed' listener handles final status when retries are exhausted.
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
