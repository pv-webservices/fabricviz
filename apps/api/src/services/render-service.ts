import { Pool } from 'pg';
import { Queue } from 'bullmq';
import { CreateRenderInput, isMultiAreaInput, AreaAssignmentInput } from '../validators/render-validators';
import { buildRenderPrompt, AreaAssignment } from '../lib/render-prompt-library';

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
  customerId?: string
): Promise<{ jobId: string; visualizationId: string; areasCount: number }> {

  // -- Multi-area flow ---------------------------------------------------------
  if (isMultiAreaInput(data)) {
    const assignments = data.areaAssignments;

    // 1. Validate all fabricIds in bulk
    const fabricIds = assignments.map((a) => a.fabricId);
    const fabricCheck = await db.query(
      `SELECT id FROM fabrics WHERE id = ANY($1::uuid[]) AND active = true`,
      [fabricIds],
    );
    if (fabricCheck.rowCount !== fabricIds.length) {
      throw new Error('One or more fabrics were not found or are inactive');
    }

    // 2. Validate roomId if provided and fetch image_url
    let resolvedRoomImageUrl = '';
    if (data.roomId) {
      const roomCheck = await db.query(
        `SELECT image_url FROM predefined_rooms WHERE id = $1 AND active = true`,
        [data.roomId],
      );
      if (roomCheck.rowCount === 0) {
        throw new Error('Predefined room not found or inactive');
      }
      resolvedRoomImageUrl = roomCheck.rows[0].image_url;
    }

    const roomImageUrl: string =
      data.sourceType === 'predefined_room'
        ? resolvedRoomImageUrl
        : (data.uploadedPhotoUrl ?? '');

    if (!roomImageUrl) {
      throw new Error('Render requires a valid room image URL. Neither a predefined room image nor an uploaded photo URL was provided.');
    }

    // 3. Check credits  exactly 1 credit required per render job
    if (accessCodeId) {
      const creditCheck = await db.query(
        `SELECT credit_limit FROM access_codes WHERE id = $1`,
        [accessCodeId],
      );
      if (creditCheck.rowCount === 0) {
        throw new Error('Access code not found');
      }
      if ((creditCheck.rows[0].credit_limit as number) < 1) {
        throw new Error('Insufficient credits');
      }
    } else if (customerId) {
      const creditCheck = await db.query(
        `SELECT credit_limit, credits_used FROM customers WHERE id = $1`,
        [customerId],
      );
      if (creditCheck.rowCount === 0) {
        throw new Error('Customer not found');
      }
      const limit = creditCheck.rows[0].credit_limit;
      const used = creditCheck.rows[0].credits_used;
      if (limit !== null && limit !== undefined && used >= limit) {
        throw new Error('Insufficient credits');
      }
    }

    // Collect all unique fabric swatch image URLs for the assignments
    const fabricSwatchUrls: string[] = assignments
      .map((a: AreaAssignmentInput) => a.fabricImageUrl)
      .filter((url): url is string => typeof url === 'string' && url.length > 0);

    let finalFabricSwatchUrls = fabricSwatchUrls;
    if (finalFabricSwatchUrls.length === 0) {
      const fabricRows = await db.query(
        `SELECT id, image_url FROM fabrics WHERE id = ANY($1::uuid[])`,
        [fabricIds],
      );
      const fabricUrlMap = new Map(fabricRows.rows.map((r: { id: string; image_url: string }) => [r.id, r.image_url]));
      finalFabricSwatchUrls = fabricIds
        .map((id) => fabricUrlMap.get(id) ?? '')
        .filter((url) => url.length > 0);
    }

    // 4. Build composed prompt
    const typedAssignments: AreaAssignment[] = assignments.map((a: AreaAssignmentInput) => ({
      areaKey: a.areaKey,
      fabricId: a.fabricId,
      fabricName: a.fabricName,
      fabricCode: a.fabricCode,
      fabricColorDescription: a.fabricColorDescription,
      fabricTextureDescription: a.fabricTextureDescription,
      fabricImageUrl: a.fabricImageUrl,
    }));
    const model = data.model ?? 'lite';
    const composedPrompt = buildRenderPrompt(
      typedAssignments,
      model,
      data.sourceType as 'predefined_room' | 'uploaded_photo',
      roomImageUrl,
      finalFabricSwatchUrls
    );

    // 5. Create visualization record with multi-area columns
    const firstFabricId = assignments[0].fabricId;
    const firstAreaKey = assignments[0].areaKey;

    // Map areaKey to valid legacy object_type to satisfy visualizations_object_type_check
    let legacyObjectType = 'sofa';
    if (firstAreaKey.includes('curtain')) legacyObjectType = 'curtain';
    else if (firstAreaKey.includes('rug') || firstAreaKey.includes('floor')) legacyObjectType = 'rug';
    else if (firstAreaKey.includes('wall')) legacyObjectType = 'wallpaper';
    else if (firstAreaKey.includes('chair')) legacyObjectType = 'chair';

    const visResult = await db.query(
      `INSERT INTO visualizations
         (access_code_id, customer_id, fabric_id, room_id, uploaded_photo_url, object_type, source_type, status,
          area_assignments, model, composed_prompt, areas_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11)
       RETURNING id`,
      [
        accessCodeId ?? null,
        customerId ?? null,
        firstFabricId,
        data.roomId ?? null,
        data.uploadedPhotoUrl ?? null,
        legacyObjectType,
        data.sourceType,
        JSON.stringify(assignments),
        model,
        composedPrompt,
        assignments.length,
      ],
    );
    const visualizationId: string = visResult.rows[0].id;

    // 6. Create render_job record
    const jobResult = await db.query(
      `INSERT INTO render_jobs (visualization_id, status, model)
       VALUES ($1, 'queued', $2)
       RETURNING id`,
      [visualizationId, model],
    );
    const renderJobId: string = jobResult.rows[0].id;

    // 7. Update visualization with render_job_id
    await db.query(
      `UPDATE visualizations SET render_job_id = $1 WHERE id = $2`,
      [renderJobId, visualizationId],
    );

    // 8. Push to BullMQ queue with full multi-area payload
    const bullJob = await renderQueue.add(
      'render',
      {
        renderJobId,
        visualizationId,
        model,
        areaAssignments: typedAssignments,
        composedPrompt,
        roomId: data.roomId,
        roomImageUrl,
        fabricSwatchUrls: finalFabricSwatchUrls,
        uploadedPhotoUrl: data.uploadedPhotoUrl,
        sourceType: data.sourceType,
        // Legacy compat fields (first area's fabric/key)
        fabricId: firstFabricId,
        objectType: firstAreaKey,
      },
      {
        jobId: renderJobId,
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    if (bullJob.id) {
      await db.query(`UPDATE render_jobs SET queue_job_id = $1 WHERE id = $2`, [bullJob.id, renderJobId]);
    }

    return { jobId: renderJobId, visualizationId, areasCount: assignments.length };
  }

  // -- Legacy single-fabric flow (backward compat) ----------------------------
  const legacyFabricId = (data as { fabricId: string }).fabricId;
  const legacyObjectType = (data as { objectType: string }).objectType;

  // 1. Verify fabric exists
  const fabricCheck = await db.query(
    `SELECT id, image_url FROM fabrics WHERE id = $1 AND active = true`,
    [legacyFabricId],
  );
  if (fabricCheck.rowCount === 0) {
    throw new Error('Fabric not found or inactive');
  }
  const legacyFabricImageUrl = fabricCheck.rows[0].image_url;

  // 2. Verify room exists (if predefined)
  let resolvedRoomImageUrlLegacy = '';
  if (data.roomId) {
    const roomCheck = await db.query(
      `SELECT image_url FROM predefined_rooms WHERE id = $1 AND active = true`,
      [data.roomId],
    );
    if (roomCheck.rowCount === 0) {
      throw new Error('Predefined room not found or inactive');
    }
    resolvedRoomImageUrlLegacy = roomCheck.rows[0].image_url;
  }

  const roomImageUrlLegacy: string =
    data.sourceType === 'predefined_room'
      ? resolvedRoomImageUrlLegacy
      : (data.uploadedPhotoUrl ?? '');

  if (!roomImageUrlLegacy) {
    throw new Error('Render requires a valid room image URL. Neither a predefined room image nor an uploaded photo URL was provided.');
  }

  const legacyFabricSwatchUrls = legacyFabricImageUrl ? [legacyFabricImageUrl] : [];

  // 3. Create visualization record
  const visResult = await db.query(
    `INSERT INTO visualizations (access_code_id, customer_id, fabric_id, room_id, uploaded_photo_url, object_type, source_type, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING id`,
    [
      accessCodeId ?? null,
      customerId ?? null,
      legacyFabricId,
      data.roomId ?? null,
      data.uploadedPhotoUrl ?? null,
      legacyObjectType,
      data.sourceType,
    ],
  );
  const visualizationId: string = visResult.rows[0].id;

  // 4. Create render_job record
  const jobResult = await db.query(
    `INSERT INTO render_jobs (visualization_id, status)
     VALUES ($1, 'queued') RETURNING id`,
    [visualizationId],
  );
  const renderJobId: string = jobResult.rows[0].id;

  // 5. Update visualization with render_job_id
  await db.query(
    `UPDATE visualizations SET render_job_id = $1 WHERE id = $2`,
    [renderJobId, visualizationId],
  );

  // 6. Push to BullMQ queue
  const bullJob = await renderQueue.add(
    'render',
    {
      renderJobId,
      visualizationId,
      fabricId: legacyFabricId,
      roomId: data.roomId,
      roomImageUrl: roomImageUrlLegacy,
      fabricSwatchUrls: legacyFabricSwatchUrls,
      uploadedPhotoUrl: data.uploadedPhotoUrl,
      objectType: legacyObjectType,
    },
    {
      jobId: renderJobId,
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    },
  );

  if (bullJob.id) {
    await db.query(`UPDATE render_jobs SET queue_job_id = $1 WHERE id = $2`, [bullJob.id, renderJobId]);
  }

  return { jobId: renderJobId, visualizationId, areasCount: 1 };
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
    [jobId],
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

