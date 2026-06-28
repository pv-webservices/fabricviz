import { Pool } from 'pg';

export interface HistoryFilter {
  accessCodeId?: string;
  customerId?: string;
  status?: string;
  objectType?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export async function getHistory(db: Pool, filters: HistoryFilter) {
  const conditions: string[] = ['v.active = true'];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.accessCodeId) {
    conditions.push(`v.access_code_id = $${idx++}`);
    params.push(filters.accessCodeId);
  } else if (filters.customerId) {
    conditions.push(`v.customer_id = $${idx++}`);
    params.push(filters.customerId);
  }
  if (filters.status) {
    conditions.push(`v.status = $${idx++}`);
    params.push(filters.status);
  }
  if (filters.objectType) {
    conditions.push(`v.object_type = $${idx++}`);
    params.push(filters.objectType);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const offset = (page - 1) * limit;

  let orderClause = 'ORDER BY v.created_at DESC';
  if (filters.sortBy === 'date_asc') orderClause = 'ORDER BY v.created_at ASC';

  const countQuery = `SELECT COUNT(*) FROM visualizations v ${where}`;
  const countResult = await db.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const query = `
    SELECT 
      v.id, v.object_type, v.source_type, v.status, v.before_url, v.after_url, v.pdf_url, v.created_at,
      f.name as fabric_name, COALESCE(f.swatch_url, f.texture_url) as fabric_thumbnail,
      r.name as room_name
    FROM visualizations v
    LEFT JOIN fabrics f ON v.fabric_id = f.id
    LEFT JOIN predefined_rooms r ON v.room_id = r.id
    ${where}
    ${orderClause}
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const result = await db.query(query, [...params, limit, offset]);

  return {
    items: result.rows,
    total,
    page,
    limit,
  };
}

export async function getHistoryItem(db: Pool, id: string, accessCodeId?: string, customerId?: string) {
  const conditions = ['v.id = $1', 'v.active = true'];
  const params: unknown[] = [id];
  let idx = 2;

  if (accessCodeId) {
    conditions.push(`v.access_code_id = $${idx++}`);
    params.push(accessCodeId);
  } else if (customerId) {
    conditions.push(`v.customer_id = $${idx++}`);
    params.push(customerId);
  }

  const query = `
    SELECT 
      v.*,
      f.name as fabric_name,
      COALESCE(f.swatch_url, f.texture_url) as fabric_thumbnail,
      f.color_family,
      f.end_use as fabric_end_use,
      c.name as collection_name,
      r.name as room_name
    FROM visualizations v
    LEFT JOIN fabrics f ON v.fabric_id = f.id
    LEFT JOIN collections c ON f.collection_id = c.id
    LEFT JOIN predefined_rooms r ON v.room_id = r.id
    WHERE ${conditions.join(' AND ')}
  `;

  const result = await db.query(query, params);
  return result.rows[0] ?? null;
}

export async function deleteHistoryItem(db: Pool, id: string): Promise<boolean> {
  const result = await db.query(
    `UPDATE visualizations SET active = false WHERE id = $1 RETURNING id`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}
