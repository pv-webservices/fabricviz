import { Pool } from 'pg';
import { writeAuditLog } from '../lib/audit';

export async function getSettings(db: Pool) {
  const result = await db.query(`SELECT key, value FROM app_settings`);
  const settings = result.rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {} as Record<string, string>);
  
  return settings;
}

export async function updateSettings(db: Pool, settings: Record<string, string>, adminId: string) {
  const keys = Object.keys(settings);
  if (keys.length === 0) return;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    for (const key of keys) {
      const value = settings[key];
      
      const oldRes = await client.query(`SELECT value FROM app_settings WHERE key = $1`, [key]);
      const oldValue = oldRes.rows[0]?.value;

      await client.query(
        `INSERT INTO app_settings (key, value, updated_by, updated_at) 
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_by = $3, updated_at = NOW()`,
        [key, value, adminId]
      );

      if (oldValue !== value) {
        await writeAuditLog(client, {
          userId: adminId,
          action: 'setting_updated',
          entityType: 'app_setting',
          entityId: key, // We use key as ID here for logging
          oldValue: { value: oldValue },
          newValue: { value: value },
        });
      }
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
