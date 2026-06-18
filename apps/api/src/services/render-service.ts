import { Pool } from 'pg';
import { Queue } from 'bullmq';
import { CreateRenderInput } from '../validators/render-validators';

export interface RenderStatusResult {
  jobId: string;
  visualizationId: string;
  jobStatus: string;
  visualizationStatus: string;
  attemptCount: number;
  errorMessage: string | null;
  beforeUrl: string | null;
  afterUrl: string | null;
  pdfUrl: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

export async function createRenderJob(
  db: Pool,
  renderQueue: Queue,
  data: CreateRenderInput,
  accessCodeId?: string,
): Promise<{ jobId: string; visualizationId: string }> {
  // 1. Verify fabric exists
  const fabricCheck = await db.query(`SELECT id FROM fabrics WHERE id = $1 AND active = true`, [data.fabricId]);
  if (fabricCheck.rowCount === 0) {
    throw new Error('Fabric not found or inactive');
  }

  // 2. Verify room exists (if predefined)
  if (data.roomId) {
    const roomCheck = await db.query(`SELECT image_url FROM predefined_rooms WHERE id = $1 AND active = true`, [data.roomId]);
    if (roomCheck.rowCount === 0) {
      throw new Error('Predefined room not found or inactive');
    }
  }

  // 3. Create visualization record
  const visResult = await db.query(
    `INSERT INTO visualizations (access_code_id, fabric_id, room_id, uploaded_photo_url, object_type, source_type, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
    [
      accessCodeId ?? null,
      data.fabricId,
      data.roomId ?? null,
      data.uploadedPhotoUrl ?? null,
      data.objectType,
      data.sourceType,
    ]
  );
  const visualizationId = visResult.rows[0].id;

  // 4. Create render_job record
  const jobResult = await db.query(
    `INSERT INTO render_jobs (visualization_id, status)
     VALUES ($1, 'queued') RETURNING id`,
    [visualizationId]
  );
  const renderJobId = jobResult.rows[0].id;

  // 5. Update visualization with render_job_id
  await db.query(
    `UPDATE visualizations SET render_job_id = $1 WHERE id = $2`,
    [renderJobId, visualizationId]
  );

  // 6. Push to BullMQ queue
  const bullJob = await renderQueue.add(
    'render',
    {
      renderJobId,
      visualizationId,
      fabricId: data.fabricId,
      roomId: data.roomId,
      uploadedPhotoUrl: data.uploadedPhotoUrl,
      objectType: data.objectType,
    },
    {
      jobId: renderJobId, // ensure idempotency
      attempts: 2,        // allow 1 retry
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    }
  );

  // 7. Update render_job with the queue_job_id
  if (bullJob.id) {
    await db.query(`UPDATE render_jobs SET queue_job_id = $1 WHERE id = $2`, [bullJob.id, renderJobId]);
  }

  return { jobId: renderJobId, visualizationId };
}

export async function getRenderStatus(db: Pool, jobId: string): Promise<RenderStatusResult | null> {
  const result = await db.query(
    `SELECT 
       rj.id AS job_id,
       v.id AS visualization_id,
       rj.status AS job_status,
       v.status AS visualization_status,
       rj.attempt_count,
       rj.error_message,
       v.before_url,
       v.after_url,
       v.pdf_url,
       rj.started_at,
       rj.completed_at
     FROM render_jobs rj
     JOIN visualizations v ON rj.visualization_id = v.id
     WHERE rj.id = $1`,
    [jobId]
  );

  if (result.rowCount === 0) return null;

  const row = result.rows[0];
  return {
    jobId: row.job_id,
    visualizationId: row.visualization_id,
    jobStatus: row.job_status,
    visualizationStatus: row.visualization_status,
    attemptCount: row.attempt_count,
    errorMessage: row.error_message,
    beforeUrl: row.before_url,
    afterUrl: row.after_url,
    pdfUrl: row.pdf_url,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}
