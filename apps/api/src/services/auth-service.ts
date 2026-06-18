import { Pool } from 'pg';
import crypto from 'node:crypto';
import { verifyPassword } from '../lib/password';

// ────────────────────────────────────────────────────────────
//  Types used only inside this service
// ────────────────────────────────────────────────────────────

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
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  name: string | null;
  active: boolean;
}

export interface SessionRow {
  id: string;
  access_code_id: string;
  token_hash: string;
  device_fingerprint: string | null;
  expires_at: Date;
  created_at: Date;
}

// ────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ────────────────────────────────────────────────────────────
//  Access-code verification
// ────────────────────────────────────────────────────────────

export async function findAccessCodeByCode(
  db: Pool,
  code: string,
): Promise<AccessCodeRow | null> {
  const result = await db.query<AccessCodeRow>(
    `SELECT id, code, customer_name, company_name, phone, active,
            render_count, credit_limit, credits_used
     FROM access_codes
     WHERE code = $1`,
    [code.toUpperCase()],
  );
  return result.rows[0] ?? null;
}

export async function updateAccessCodeLastUsed(
  db: Pool,
  accessCodeId: string,
): Promise<void> {
  await db.query(
    `UPDATE access_codes SET last_used_at = NOW() WHERE id = $1`,
    [accessCodeId],
  );
}

// ────────────────────────────────────────────────────────────
//  Admin login
// ────────────────────────────────────────────────────────────

export async function findUserByEmail(
  db: Pool,
  email: string,
): Promise<UserRow | null> {
  const result = await db.query<UserRow>(
    `SELECT id, email, password_hash, role, name, active
     FROM users
     WHERE email = $1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function verifyAdminCredentials(
  db: Pool,
  email: string,
  password: string,
): Promise<UserRow | null> {
  const user = await findUserByEmail(db, email);
  if (!user) return null;
  if (!user.active) return null;

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return null;

  return user;
}

// ────────────────────────────────────────────────────────────
//  Customer session persistence
// ────────────────────────────────────────────────────────────

export async function createCustomerSession(
  db: Pool,
  accessCodeId: string,
  token: string,
  deviceFingerprint: string | undefined,
  expiresAt: Date,
): Promise<SessionRow> {
  const tokenHash = hashToken(token);
  const result = await db.query<SessionRow>(
    `INSERT INTO customer_sessions (access_code_id, token_hash, device_fingerprint, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [accessCodeId, tokenHash, deviceFingerprint ?? null, expiresAt],
  );
  return result.rows[0];
}

export async function findSessionByTokenHash(
  db: Pool,
  token: string,
): Promise<SessionRow | null> {
  const tokenHash = hashToken(token);
  const result = await db.query<SessionRow>(
    `SELECT * FROM customer_sessions
     WHERE token_hash = $1 AND expires_at > NOW()`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function deleteSession(
  db: Pool,
  sessionId: string,
): Promise<void> {
  await db.query(
    `DELETE FROM customer_sessions WHERE id = $1`,
    [sessionId],
  );
}

export async function deleteSessionsByAccessCode(
  db: Pool,
  accessCodeId: string,
): Promise<void> {
  await db.query(
    `DELETE FROM customer_sessions WHERE access_code_id = $1`,
    [accessCodeId],
  );
}

// ────────────────────────────────────────────────────────────
//  Remember-device: look up existing valid session
// ────────────────────────────────────────────────────────────

export async function findActiveSessionByDevice(
  db: Pool,
  accessCodeId: string,
  deviceFingerprint: string,
): Promise<SessionRow | null> {
  const result = await db.query<SessionRow>(
    `SELECT * FROM customer_sessions
     WHERE access_code_id = $1
       AND device_fingerprint = $2
       AND expires_at > NOW()
     ORDER BY created_at DESC
     LIMIT 1`,
    [accessCodeId, deviceFingerprint],
  );
  return result.rows[0] ?? null;
}
