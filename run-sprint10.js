require('dotenv').config({ path: '.env' });
const { Pool } = require('./apps/api/node_modules/pg');
const db = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://fabricviz:password@localhost:5432/fabricviz' });

async function run() {
  try {
    await db.query(`
      ALTER TABLE visualizations
        ADD COLUMN IF NOT EXISTS area_assignments  JSONB         DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS model             VARCHAR(50)   DEFAULT 'fast',
        ADD COLUMN IF NOT EXISTS composed_prompt   TEXT,
        ADD COLUMN IF NOT EXISTS areas_count       INTEGER       DEFAULT 1
    `);
    console.log('visualizations table updated');

    await db.query(`
      ALTER TABLE render_jobs
        ADD COLUMN IF NOT EXISTS model VARCHAR(50) DEFAULT 'fast'
    `);
    console.log('render_jobs table updated');

    console.log('Sprint 10 migration complete');
  } catch (e) {
    console.error('Migration error:', e.message);
  } finally {
    await db.end();
  }
}

run();
