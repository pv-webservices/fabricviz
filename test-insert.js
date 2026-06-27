require('dotenv').config({path:'.env'});
const {Pool} = require('./apps/api/node_modules/pg');
const db = new Pool({connectionString: process.env.DATABASE_URL});
(async () => {
  try {
    const fRes = await db.query('SELECT id FROM fabrics LIMIT 1');
    const fabricId = fRes.rows[0].id;
    const rRes = await db.query('SELECT id FROM predefined_rooms LIMIT 1');
    const roomId = rRes.rows[0].id;
    
    await db.query("INSERT INTO visualizations (access_code_id, fabric_id, room_id, uploaded_photo_url, object_type, source_type, status, area_assignments, model, composed_prompt, areas_count) VALUES (null, $1, $2, null, 'sofa', 'predefined_room', 'pending', '[]', 'fast', 'test', 1) RETURNING id", [fabricId, roomId]);
    console.log("Success");
  } catch (err) {
    console.error(err);
  } finally {
    db.end();
  }
})();
