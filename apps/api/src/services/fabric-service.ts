import { Pool } from 'pg';
import type { CreateFabricInput, UpdateFabricInput, FabricQueryInput } from '../validators/fabric-validators';
import type { BulkImportInput } from '../validators/fabric-validators';

export interface FabricRow {
  id: string;
  collection_id: string;
  name: string;
  code: string;
  swatch_url: string | null;
  texture_url: string | null;
  color_family: string | null;
  quality: string | null;
  tags: string[] | null;
  end_use: string;
  repeat_width_mm: number | null;
  repeat_height_mm: number | null;
  fabric_width_cm: number | null;
  price_inr: number | null;
  feature_flags: Record<string, boolean>;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function listFabrics(
  db: Pool,
  filters: FabricQueryInput,
): Promise<{ items: FabricRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.collectionId) {
    conditions.push(`collection_id = $${idx++}`);
    params.push(filters.collectionId);
  }
  if (filters.endUse) {
    conditions.push(`end_use = $${idx++}`);
    params.push(filters.endUse);
  }
  if (filters.colorFamily) {
    conditions.push(`color_family = $${idx++}`);
    params.push(filters.colorFamily);
  }
  if (filters.quality) {
    conditions.push(`quality = $${idx++}`);
    params.push(filters.quality);
  }
  if (filters.active !== undefined) {
    conditions.push(`active = $${idx++}`);
    params.push(filters.active);
  }
  if (filters.search) {
    conditions.push(`(name ILIKE $${idx} OR code ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }
  if (filters.tags) {
    const tagArr = filters.tags.split(',').map((t) => t.trim());
    conditions.push(`tags && $${idx++}`);
    params.push(tagArr);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM fabrics ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (filters.page - 1) * filters.limit;
  const rows = await db.query<FabricRow>(
    `SELECT * FROM fabrics ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, offset],
  );

  return { items: rows.rows, total };
}

export async function getFabricById(
  db: Pool,
  id: string,
): Promise<FabricRow | null> {
  const result = await db.query<FabricRow>(
    `SELECT * FROM fabrics WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createFabric(
  db: Pool,
  data: CreateFabricInput,
): Promise<FabricRow> {
  const result = await db.query<FabricRow>(
    `INSERT INTO fabrics
       (collection_id, name, code, swatch_url, texture_url, color_family, quality,
        tags, end_use, repeat_width_mm, repeat_height_mm, fabric_width_cm,
        price_inr, feature_flags, active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      data.collectionId,
      data.name,
      data.code,
      data.swatchUrl ?? null,
      data.textureUrl ?? null,
      data.colorFamily ?? null,
      data.quality ?? null,
      data.tags ?? null,
      data.endUse,
      data.repeatWidthMm ?? null,
      data.repeatHeightMm ?? null,
      data.fabricWidthCm ?? null,
      data.priceInr ?? null,
      JSON.stringify(data.featureFlags ?? {}),
      data.active,
    ],
  );
  return result.rows[0];
}

export async function updateFabric(
  db: Pool,
  id: string,
  data: UpdateFabricInput,
): Promise<FabricRow | null> {
  const fieldMap: Record<string, { column: string; value: unknown }> = {
    collectionId: { column: 'collection_id', value: data.collectionId },
    name: { column: 'name', value: data.name },
    code: { column: 'code', value: data.code },
    swatchUrl: { column: 'swatch_url', value: data.swatchUrl },
    textureUrl: { column: 'texture_url', value: data.textureUrl },
    colorFamily: { column: 'color_family', value: data.colorFamily },
    quality: { column: 'quality', value: data.quality },
    tags: { column: 'tags', value: data.tags },
    endUse: { column: 'end_use', value: data.endUse },
    repeatWidthMm: { column: 'repeat_width_mm', value: data.repeatWidthMm },
    repeatHeightMm: { column: 'repeat_height_mm', value: data.repeatHeightMm },
    fabricWidthCm: { column: 'fabric_width_cm', value: data.fabricWidthCm },
    priceInr: { column: 'price_inr', value: data.priceInr },
    featureFlags: { column: 'feature_flags', value: data.featureFlags ? JSON.stringify(data.featureFlags) : undefined },
    active: { column: 'active', value: data.active },
  };

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const [key, mapping] of Object.entries(fieldMap)) {
    if (key in data && data[key as keyof UpdateFabricInput] !== undefined) {
      setClauses.push(`${mapping.column} = $${idx++}`);
      params.push(mapping.value);
    }
  }

  if (setClauses.length === 0) return getFabricById(db, id);

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const result = await db.query<FabricRow>(
    `UPDATE fabrics SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] ?? null;
}

export async function deleteFabric(
  db: Pool,
  id: string,
): Promise<boolean> {
  const result = await db.query(
    `UPDATE fabrics SET active = false, updated_at = NOW() WHERE id = $1`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function bulkCreateFabrics(
  db: Pool,
  fabrics: BulkImportInput['fabrics'],
): Promise<{ imported: number; errors: string[] }> {
  const client = await db.connect();
  const errors: string[] = [];
  let imported = 0;

  try {
    await client.query('BEGIN');

    for (let i = 0; i < fabrics.length; i++) {
      const f = fabrics[i];
      try {
        await client.query(
          `INSERT INTO fabrics
             (collection_id, name, code, swatch_url, texture_url, color_family, quality,
              tags, end_use, repeat_width_mm, repeat_height_mm, fabric_width_cm,
              price_inr, feature_flags, active)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
          [
            f.collectionId,
            f.name,
            f.code,
            f.swatchUrl ?? null,
            f.textureUrl ?? null,
            f.colorFamily ?? null,
            f.quality ?? null,
            f.tags ?? null,
            f.endUse,
            f.repeatWidthMm ?? null,
            f.repeatHeightMm ?? null,
            f.fabricWidthCm ?? null,
            f.priceInr ?? null,
            JSON.stringify(f.featureFlags ?? {}),
            f.active,
          ],
        );
        imported++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Row ${i + 1} (${f.code}): ${message}`);
      }
    }

    await client.query('COMMIT');
  } catch {
    await client.query('ROLLBACK');
    errors.push('Transaction rolled back due to an unexpected error');
  } finally {
    client.release();
  }

  return { imported, errors };
}
