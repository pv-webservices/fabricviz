import 'dotenv/config';
import { Pool } from 'pg';
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query(`SELECT id, after_url FROM visualizations WHERE after_url IS NOT NULL ORDER BY created_at DESC LIMIT 5`)
  .then(res => console.log(res.rows))
  .catch(console.error)
  .finally(() => p.end());
