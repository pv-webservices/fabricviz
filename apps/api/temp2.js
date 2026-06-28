import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('../../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'visualizations';
  `);
  console.log(res.rows);
  process.exit(0);
}
run();
