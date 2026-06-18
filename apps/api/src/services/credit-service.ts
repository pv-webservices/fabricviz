import { Pool } from 'pg';
import { writeAuditLog } from '../lib/audit';

export async function getCreditHistory(db: Pool, accessCodeId: string) {
  const result = await db.query(
    `SELECT * FROM credit_transactions WHERE access_code_id = $1 ORDER BY created_at DESC`,
    [accessCodeId]
  );
  return result.rows;
}

export async function grantCredits(
  db: Pool,
  accessCodeId: string,
  amount: number,
  reason: string,
  adminId: string
) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // 1. Record transaction
    const txRes = await client.query(
      `INSERT INTO credit_transactions (access_code_id, amount, reason, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [accessCodeId, amount, reason, adminId]
    );

    // 2. Adjust credit limit on access code
    const updateRes = await client.query(
      `UPDATE access_codes 
       SET credit_limit = credit_limit + $1 
       WHERE id = $2 
       RETURNING credit_limit`,
      [amount, accessCodeId]
    );

    const newLimit = updateRes.rows[0].credit_limit;

    // 3. Write Audit Log
    await writeAuditLog(client, {
      userId: adminId,
      action: 'credits_granted',
      entityType: 'access_code',
      entityId: accessCodeId,
      newValue: { grantedAmount: amount, newLimit, reason },
    });

    await client.query('COMMIT');
    return txRes.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
