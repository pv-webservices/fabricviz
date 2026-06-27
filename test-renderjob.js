require('dotenv').config({path:'.env'});
const {Pool} = require('./apps/api/node_modules/pg');
const db = new Pool({connectionString: process.env.DATABASE_URL});
(async () => {
  try {
    const vRes = await db.query('SELECT id FROM visualizations LIMIT 1');
    const visId = vRes.rows[0].id;
    await db.query("INSERT INTO render_jobs (visualization_id, status, model) VALUES ($1, 'queued', 'fast') RETURNING id", [visId]);
    console.log("Success");
  } catch (err) {
    console.error(err);
  } finally {
    db.end();
  }
})();
