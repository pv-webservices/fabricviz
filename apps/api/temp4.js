import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('../../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const res = await pool.query(`
    SELECT pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'visualizations' AND c.conname = 'visualizations_object_type_check';
  `);
  console.log(res.rows[0].pg_get_constraintdef);
  process.exit(0);
}
run();
