import { Pool } from 'pg';

/**
 * sprint10-migration.ts
 * Extends visualizations and render_jobs tables for multi-area render support.
 * All operations are append-only (ADD COLUMN IF NOT EXISTS). No columns dropped.
 */
export async function runSprint10Migrations(db: Pool) {
  console.log('Running Sprint 10 migrations (Multi-area render support)...');

  // Migration A — Extend visualizations for multi-area support
  await db.query(`
    ALTER TABLE visualizations
      ADD COLUMN IF NOT EXISTS area_assignments  JSONB         DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS model             VARCHAR(50)   DEFAULT 'fast',
      ADD COLUMN IF NOT EXISTS composed_prompt   TEXT,
      ADD COLUMN IF NOT EXISTS areas_count       INTEGER       DEFAULT 1;
  `);

  // Migration B — Extend render_jobs with model column
  await db.query(`
    ALTER TABLE render_jobs
      ADD COLUMN IF NOT EXISTS model VARCHAR(50) DEFAULT 'fast';
  `);

  // Migration C — Credits: confirm 1-credit-per-job semantics.
  // The credit_limit column on access_codes is decremented exactly once per
  // successful render job by the worker. No multi-credit deduction exists in the
  // legacy code, so no schema change is needed. This comment documents the intent.

  console.log('Sprint 10 migrations applied successfully.');
}
