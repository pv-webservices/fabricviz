import { Pool } from 'pg';

export async function runSprint11Migrations(db: Pool) {
  console.log('Running Sprint 11 migrations (Customers page rebuild)...');

  // Add new columns to customers table if they don't exist
  await db.query(`
    ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  `);
  console.log('- Added session_count, last_active_at, tags, and deleted_at to customers table');

  // Try to create pg_trgm extension for similarity matching
  try {
    await db.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    console.log('- Ensured pg_trgm extension is available');
  } catch (err: any) {
    console.warn('- WARNING: Could not create pg_trgm extension. Similarity matching will fall back to exact matching. Error:', err.message);
  }

  console.log('Sprint 11 migrations applied successfully.');
}
