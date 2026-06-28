import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('../../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  await pool.query(`
    ALTER TABLE visualizations ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
  `);
  console.log('Added customer_id to visualizations');
  process.exit(0);
}
run();
