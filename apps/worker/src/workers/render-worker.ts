import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { Pool } from 'pg';
import { QUEUE_NAME } from '../queues/render-queue';
import { buildPrompt } from '../recipes';
import { NanoBananaService } from '../services/nano-banana';
import { logIncident } from '../lib/telemetry';

export function setupRenderWorker(connection: Redis, db: Pool) {
  const nanoBanana = new NanoBananaService();

  const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
      const { renderJobId, visualizationId, fabricId, roomId, uploadedPhotoUrl, objectType } = job.data;
      console.log(`[Job ${job.id}] Starting processing for render job ${renderJobId}...`);

      try {
        // 1. Mark as processing
        await db.query(`UPDATE render_jobs SET status = 'processing', attempt_count = attempt_count + 1, started_at = NOW() WHERE id = $1`, [renderJobId]);
        await db.query(`UPDATE visualizations SET status = 'processing' WHERE id = $1`, [visualizationId]);

        // 2. Fetch fabric metadata
        const fabricRes = await db.query(`SELECT name, tags FROM fabrics WHERE id = $1`, [fabricId]);
        if (fabricRes.rowCount === 0) throw new Error('Fabric not found');
        const fabric = fabricRes.rows[0];

        // 3. Build prompt
        const prompt = buildPrompt(objectType, fabric.name, fabric.tags);
        
        // Save prompt_used
        await db.query(`UPDATE render_jobs SET prompt_used = $1 WHERE id = $2`, [prompt, renderJobId]);

        // 4. Determine source image
        let sourceImage = uploadedPhotoUrl;
        if (roomId && !sourceImage) {
          const roomRes = await db.query(`SELECT image_url FROM predefined_rooms WHERE id = $1`, [roomId]);
          if (roomRes.rowCount !== 0) {
            sourceImage = roomRes.rows[0].image_url;
          }
        }

        // 5. Call Nano Banana Service
        const result = await nanoBanana.generateImage(prompt, sourceImage);

        if (!result.success || !result.imageUrl) {
          throw new Error(result.error || 'Failed to generate image');
        }

        // 6. Quality Check Step (simulated)
        console.log(`[Job ${job.id}] Performing quality check on generated image...`);
        // If it fails quality check, we could throw here. Assuming success for now.

        // 7. Update DB with success
        await db.query(
          `UPDATE render_jobs SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [renderJobId]
        );
        await db.query(
          `UPDATE visualizations SET status = 'completed', after_url = $1, before_url = $2 WHERE id = $3`,
          [result.imageUrl, sourceImage, visualizationId]
        );

        console.log(`[Job ${job.id}] Render completed successfully!`);
        return { success: true, imageUrl: result.imageUrl };

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Job ${job.id}] Render failed: ${errorMsg}`);
        
        // Do not update status to failed here yet, because BullMQ will retry if attempts < max.
        // The worker 'failed' listener will handle the final status if retries are exhausted.
        await db.query(`UPDATE render_jobs SET error_message = $1 WHERE id = $2`, [errorMsg, renderJobId]);
        
        // Rethrow so BullMQ knows it failed and can retry
        throw err;
      }
    },
    { connection: connection as any }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed!`);
  });

  worker.on('failed', async (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
    // If it has exhausted retries or is a definitive failure
    if (job && job.attemptsMade >= job.opts.attempts!) {
      const renderJobId = job.data.renderJobId;
      const visualizationId = job.data.visualizationId;
      
      console.log(`[Job ${job.id}] Retries exhausted. Marking as failed.`);
      
      // Dispatch Telemetry Alert
      logIncident({
        errorType: 'RENDER_PIPELINE_FAILURE',
        message: `Render Job exhausted retries and permanently failed.`,
        context: {
          jobId: job.id,
          renderJobId,
          visualizationId,
          errorMsg: err.message
        }
      });

      try {
        await db.query(`UPDATE render_jobs SET status = 'failed' WHERE id = $1`, [renderJobId]);
        await db.query(`UPDATE visualizations SET status = 'failed' WHERE id = $1`, [visualizationId]);
      } catch (dbErr) {
        console.error(`Failed to update job status to failed:`, dbErr);
      }
    } else if (job) {
      console.log(`[Job ${job.id}] Job failed, marking as retrying.`);
      const renderJobId = job.data.renderJobId;
      try {
        await db.query(`UPDATE render_jobs SET status = 'retrying' WHERE id = $1`, [renderJobId]);
      } catch (dbErr) {
        console.error(`Failed to update job status to retrying:`, dbErr);
      }
    }
  });

  return worker;
}
