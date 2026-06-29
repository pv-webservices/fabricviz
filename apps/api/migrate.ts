import 'dotenv/config';
import { Pool } from 'pg';
const p = new Pool({ connectionString: process.env.DATABASE_URL });
const run = async () => {
  try {
    await p.query('ALTER TABLE visualizations DROP CONSTRAINT visualizations_source_type_check;');
    await p.query("ALTER TABLE visualizations ADD CONSTRAINT visualizations_source_type_check CHECK (source_type = ANY (ARRAY['template'::text, 'predefined_room'::text, 'upload'::text, 'camera'::text, 'uploaded_photo'::text]));");
    console.log("Migration successful");
  } catch(err) {
    console.error(err);
  } finally {
    p.end();
  }
};
run();
