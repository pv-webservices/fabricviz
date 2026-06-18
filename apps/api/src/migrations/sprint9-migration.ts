import { Pool } from 'pg';

export async function runSprint9Migrations(db: Pool) {
  // 1. Add feature_flags to access_codes for controlled pilot rollout
  await db.query(`
    ALTER TABLE access_codes 
    ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '[]'::jsonb;
  `);

  console.log('Sprint 9 migrations applied successfully.');
}
