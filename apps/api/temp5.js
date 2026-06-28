import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('../../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  await pool.query(`
    ALTER TABLE visualizations DROP CONSTRAINT visualizations_object_type_check;
    ALTER TABLE visualizations ADD CONSTRAINT visualizations_object_type_check 
      CHECK (object_type = ANY (ARRAY['sofa', 'curtain', 'rug', 'wallpaper', 'chair']));
  `);
  console.log('Updated constraint');
  process.exit(0);
}
run();
