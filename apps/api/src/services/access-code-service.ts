import { Pool } from 'pg';
import crypto from 'crypto';
import type { CreateAccessCodeInput, UpdateAccessCodeInput, AccessCodeQueryInput } from '../validators/access-code-validators';

export interface AccessCodeRow {
  id: string;
  code: string;
  customer_name: string | null;
  company_name: string | null;
  phone: string | null;
  active: boolean;
  render_count: number;
  credit_limit: number;
  credits_used: number;
  created_by: string | null;
  created_at: Date;
  last_used_at: Date | null;
  feature_flags: string[] | null;
}

export function generateRandomCode(): string {
  // Generate 5 random uppercase alphanumeric chars (excluding confusing ones like O/0, I/1)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const randomBytes = crypto.randomBytes(5);
  for (let i = 0; i < 5; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

export async function listAccessCodes(
  db: Pool,
  filters: AccessCodeQueryInput,
): Promise<{ items: AccessCodeRow[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.active !== undefined) {
    conditions.push(`active = $${idx++}`);
    params.push(filters.active);
  }
  if (filters.search) {
    conditions.push(`(customer_name ILIKE $${idx} OR company_name ILIKE $${idx} OR code ILIKE $${idx})`);
    params.push(`%${filters.search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM access_codes ${where}`,
    params,
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (filters.page - 1) * filters.limit;
  const rows = await db.query<AccessCodeRow>(
    `SELECT * FROM access_codes ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, filters.limit, offset],
  );

  return { items: rows.rows, total };
}

export async function getAccessCodeById(db: Pool, id: string): Promise<AccessCodeRow | null> {
  const result = await db.query<AccessCodeRow>(
    `SELECT * FROM access_codes WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createAccessCode(
  db: Pool,
  data: CreateAccessCodeInput,
  createdByUserId: string,
): Promise<AccessCodeRow> {
  const code = data.code && data.code.length === 5 ? data.code.toUpperCase() : generateRandomCode();
  const result = await db.query<AccessCodeRow>(
    `INSERT INTO access_codes (code, customer_name, company_name, phone, credit_limit, active, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      code,
      data.customerName ?? null,
      data.companyName ?? null,
      data.phone ?? null,
      data.creditLimit ?? 100,
      data.active ?? true,
      createdByUserId,
    ],
  );
  return result.rows[0];
}

export async function updateAccessCode(
  db: Pool,
  id: string,
  data: UpdateAccessCodeInput,
): Promise<AccessCodeRow | null> {
  const fieldMap: Record<string, { column: string; value: unknown }> = {
    code: { column: 'code', value: data.code?.toUpperCase() },
    customerName: { column: 'customer_name', value: data.customerName },
    companyName: { column: 'company_name', value: data.companyName },
    phone: { column: 'phone', value: data.phone },
    creditLimit: { column: 'credit_limit', value: data.creditLimit },
    active: { column: 'active', value: data.active },
  };

  const setClauses: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  for (const [key, mapping] of Object.entries(fieldMap)) {
    if (key in data && data[key as keyof UpdateAccessCodeInput] !== undefined) {
      setClauses.push(`${mapping.column} = $${idx++}`);
      params.push(mapping.value);
    }
  }

  if (setClauses.length === 0) return getAccessCodeById(db, id);

  params.push(id);
  const result = await db.query<AccessCodeRow>(
    `UPDATE access_codes SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    params,
  );
  return result.rows[0] ?? null;
}

export async function deleteAccessCode(db: Pool, id: string): Promise<boolean> {
  const result = await db.query(`UPDATE access_codes SET active = false WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function incrementRenderCount(db: Pool, id: string): Promise<void> {
  await db.query(
    `UPDATE access_codes SET render_count = render_count + 1, credits_used = credits_used + 1, last_used_at = NOW() WHERE id = $1`,
    [id],
  );
}
