import { Pool } from 'pg';

export interface QrResolutionResult {
  id: string;
  name: string;
  endUse: string;
}

export async function resolveQrCode(db: Pool, code: string): Promise<QrResolutionResult | null> {
  const result = await db.query<{ id: string; name: string; end_use: string }>(
    `SELECT id, name, end_use FROM collections WHERE qr_code = $1 AND active = true`,
    [code],
  );

  if (result.rowCount === 0) return null;

  return {
    id: result.rows[0].id,
    name: result.rows[0].name,
    endUse: result.rows[0].end_use,
  };
}
