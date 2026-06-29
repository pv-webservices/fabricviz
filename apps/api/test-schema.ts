import 'dotenv/config';
import { Pool } from 'pg';
const p = new Pool({ connectionString: process.env.DATABASE_URL });
p.query("UPDATE visualizations SET active = false WHERE id = 'a5110b7e-2011-4df1-bd22-66fb1d636c0b' RETURNING id")
  .then(res => console.log(res.rows))
  .catch(console.error)
  .finally(() => p.end());
