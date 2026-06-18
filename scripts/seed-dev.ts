import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Pool } from 'pg';

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fabricviz:password@localhost:5432/fabricviz',
});

async function main() {
  console.log('Starting dev seed...');
  
  // 1. Create a predefined room
  const roomRes = await db.query(`
    INSERT INTO predefined_rooms (name, image_url, end_use, display_order)
    VALUES 
      ('Modern Living Room', 'https://fabricviz-assets.s3.amazonaws.com/rooms/living-room-1.jpg', 'sofa', 1)
    ON CONFLICT DO NOTHING
    RETURNING id;
  `);
  
  let roomId;
  if (roomRes.rows.length > 0) {
    roomId = roomRes.rows[0].id;
  } else {
    const res = await db.query(`SELECT id FROM predefined_rooms LIMIT 1`);
    roomId = res.rows[0]?.id;
  }

  // 2. Create a collection group
  const groupRes = await db.query(`
    INSERT INTO collection_groups (name) VALUES ('Premium Velvets') ON CONFLICT DO NOTHING RETURNING id;
  `);

  let groupId;
  if (groupRes.rows.length > 0) {
    groupId = groupRes.rows[0].id;
  } else {
    const res = await db.query(`SELECT id FROM collection_groups LIMIT 1`);
    groupId = res.rows[0]?.id;
  }

  // 3. Create a collection
  const collectionRes = await db.query(`
    INSERT INTO collections (name, end_use, group_id) VALUES ('Royal Velvet', 'sofa', $1) ON CONFLICT DO NOTHING RETURNING id;
  `, [groupId]);

  let collectionId;
  if (collectionRes.rows.length > 0) {
    collectionId = collectionRes.rows[0].id;
  } else {
    const res = await db.query(`SELECT id FROM collections LIMIT 1`);
    collectionId = res.rows[0]?.id;
  }

  // 4. Create a fabric
  await db.query(`
    INSERT INTO fabrics (name, code, end_use, collection_id, price_inr)
    VALUES ('Sapphire Blue', 'RV-001', 'sofa', $1, 1200)
    ON CONFLICT DO NOTHING;
  `, [collectionId]);

  // 5. Create an access code
  await db.query(`
    INSERT INTO access_codes (code, customer_name, company_name, credit_limit)
    VALUES ('ABCDE', 'John Doe', 'Design Co', 100)
    ON CONFLICT (code) DO NOTHING;
  `);

  console.log('Dev seed completed successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Dev seed failed:', err);
  process.exit(1);
});
