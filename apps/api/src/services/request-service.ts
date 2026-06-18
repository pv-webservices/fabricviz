import { Pool } from 'pg';
import type { CreateRequestInput, RequestQueryInput } from '../validators/request-validators';

export interface RequestRow {
  id: string;
  type: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  fabric_id: string | null;
  visualization_id: string | null;
  message: string | null;
  status: string;
  handled_by: string | null;
  admin_notes: string | null;
  access_code_id: string | null;
  created_at: Date;
}

export async function listRequests(
  db: Pool,
  filters: RequestQueryInput,
): Promise<{ items: RequestRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.type) {
    conditions.push(`type = $${idx++}`);
    params.push(filters.type);
  }
  if (filters.status) {
    conditions.push(`status = $${idx++}`);
    params.push(filters.status);
  }
  if (filters.search) {
    conditions.push(`(name ILIKE $${idx} OR company ILIKE $${idx} OR email ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM requests ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (filters.page - 1) * filters.limit;
  const rows = await db.query<RequestRow>(
    `SELECT * FROM requests ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, offset],
  );

  return { items: rows.rows, total };
}

export async function getRequestById(db: Pool, id: string): Promise<RequestRow | null> {
  const result = await db.query<RequestRow>(`SELECT * FROM requests WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function createRequest(db: Pool, data: CreateRequestInput & { accessCodeId?: string }): Promise<RequestRow> {
  const result = await db.query<RequestRow>(
    `INSERT INTO requests (type, name, company, phone, email, fabric_id, visualization_id, message, access_code_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      data.type,
      data.name ?? null,
      data.company ?? null,
      data.phone ?? null,
      data.email ?? null,
      data.fabricId ?? null,
      data.visualizationId ?? null,
      data.message ?? null,
      data.accessCodeId ?? null,
    ],
  );
  return result.rows[0];
}

export async function updateRequest(
  db: Pool,
  id: string,
  data: { status?: string; adminNotes?: string },
  adminId: string,
): Promise<RequestRow | null> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (data.status) {
    setClauses.push(`status = $${idx++}`);
    params.push(data.status);
  }
  if (data.adminNotes !== undefined) {
    setClauses.push(`admin_notes = $${idx++}`);
    params.push(data.adminNotes);
  }

  if (setClauses.length === 0) return getRequestById(db, id);

  setClauses.push(`handled_by = $${idx++}`);
  params.push(adminId);

  params.push(id);
  const result = await db.query<RequestRow>(
    `UPDATE requests SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] ?? null;
}
