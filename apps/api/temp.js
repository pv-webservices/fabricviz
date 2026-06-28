import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('../../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  await pool.query(`
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS credit_limit INTEGER DEFAULT 20;
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;
  `);
  console.log('Columns added successfully');
  process.exit(0);
}
run();
