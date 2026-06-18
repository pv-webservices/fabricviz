import { Pool } from 'pg';

export async function runSprint5Migrations(db: Pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS storage_snapshots (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      total_bytes BIGINT DEFAULT 0,
      total_files INTEGER DEFAULT 0,
      snapshot_date DATE UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE visualizations 
    ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
  `);

  console.log('Sprint 5 migrations applied successfully.');
}
