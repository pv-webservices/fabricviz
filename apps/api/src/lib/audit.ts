import { Pool, PoolClient } from 'pg';

export interface AuditEntry {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Write an audit log entry to the database.
 */
export async function writeAuditLog(db: Pool | PoolClient, entry: AuditEntry): Promise<void> {
  await db.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      entry.userId ?? null,
      entry.action,
      entry.entityType ?? null,
      entry.entityId ?? null,
      entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      entry.newValue ? JSON.stringify(entry.newValue) : null,
      entry.ipAddress ?? null,
    ],
  );
}
