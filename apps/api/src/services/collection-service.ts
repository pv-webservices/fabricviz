import { Pool } from 'pg';
import type { CreateCollectionInput, UpdateCollectionInput, CollectionQueryInput } from '../validators/collection-validators';

export interface CollectionRow {
  id: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  group_id: string | null;
  end_use: string;
  qr_code: string | null;
  qr_url: string | null;
  active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export async function listCollections(
  db: Pool,
  filters: CollectionQueryInput,
): Promise<{ items: CollectionRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.endUse) {
    conditions.push(`end_use = $${idx++}`);
    params.push(filters.endUse);
  }
  if (filters.active !== undefined) {
    conditions.push(`active = $${idx++}`);
    params.push(filters.active);
  }
  if (filters.search) {
    conditions.push(`name ILIKE $${idx++}`);
    params.push(`%${filters.search}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM collections ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (filters.page - 1) * filters.limit;
  const rows = await db.query<CollectionRow>(
    `SELECT * FROM collections ${where} ORDER BY display_order ASC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, offset],
  );

  return { items: rows.rows, total };
}

export async function getCollectionById(
  db: Pool,
  id: string,
): Promise<CollectionRow | null> {
  const result = await db.query<CollectionRow>(
    `SELECT * FROM collections WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createCollection(
  db: Pool,
  data: CreateCollectionInput,
): Promise<CollectionRow> {
  const result = await db.query<CollectionRow>(
    `INSERT INTO collections (name, description, thumbnail_url, group_id, end_use, qr_code, qr_url, active, display_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.name,
      data.description ?? null,
      data.thumbnailUrl ?? null,
      data.groupId ?? null,
      data.endUse,
      data.qrCode ?? null,
      data.qrUrl ?? null,
      data.active,
      data.displayOrder,
    ],
  );
  return result.rows[0];
}

export async function updateCollection(
  db: Pool,
  id: string,
  data: UpdateCollectionInput,
): Promise<CollectionRow | null> {
  const fieldMap: Record<string, { column: string; value: unknown }> = {
    name: { column: 'name', value: data.name },
    description: { column: 'description', value: data.description },
    thumbnailUrl: { column: 'thumbnail_url', value: data.thumbnailUrl },
    groupId: { column: 'group_id', value: data.groupId },
    endUse: { column: 'end_use', value: data.endUse },
    qrCode: { column: 'qr_code', value: data.qrCode },
    qrUrl: { column: 'qr_url', value: data.qrUrl },
    active: { column: 'active', value: data.active },
    displayOrder: { column: 'display_order', value: data.displayOrder },
  };

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const [key, mapping] of Object.entries(fieldMap)) {
    if (key in data && data[key as keyof UpdateCollectionInput] !== undefined) {
      setClauses.push(`${mapping.column} = $${idx++}`);
      params.push(mapping.value);
    }
  }

  if (setClauses.length === 0) return getCollectionById(db, id);

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const result = await db.query<CollectionRow>(
    `UPDATE collections SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] ?? null;
}

export async function deleteCollection(
  db: Pool,
  id: string,
): Promise<boolean> {
  const result = await db.query(
    `UPDATE collections SET active = false, updated_at = NOW() WHERE id = $1`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function getCollectionFabricCount(
  db: Pool,
  collectionId: string,
): Promise<number> {
  const result = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM fabrics WHERE collection_id = $1 AND active = true`,
    [collectionId],
  );
  return parseInt(result.rows[0].count, 10);
}
