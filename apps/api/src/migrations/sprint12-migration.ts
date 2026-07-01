import { Pool } from 'pg';

export async function runSprint12Migrations(db: Pool) {
  console.log('Running Sprint 12 migrations (Customer Enhancements: Access Codes & Credits)...');

  // 1. Add access_code, notes, etc. to customers
  await db.query(`
    ALTER TABLE customers
      ADD COLUMN IF NOT EXISTS access_code VARCHAR(10) UNIQUE,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS session_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  `);

  // 2. AI Credits table
  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_credits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
      total_credits INTEGER NOT NULL DEFAULT 30,
      used_credits INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 3. Credit history log
  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_credit_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      note TEXT,
      granted_by VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 4. Customer activity summary
  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_activity_summary (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
      areas_selected INTEGER DEFAULT 0,
      fabrics_selected INTEGER DEFAULT 0,
      visualizations_generated INTEGER DEFAULT 0,
      images_uploaded INTEGER DEFAULT 0,
      images_downloaded INTEGER DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 5. Visualization history
  await db.query(`
    CREATE TABLE IF NOT EXISTS customer_visualizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
      fabric_name VARCHAR(255),
      fabric_category VARCHAR(100),
      thumbnail_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Backfill access codes for existing customers
  await db.query(`
    UPDATE customers
    SET access_code = LPAD(FLOOR(RANDOM() * 99999 + 10000)::TEXT, 5, '0')
    WHERE access_code IS NULL;
  `);

  // Seed credits for existing customers
  await db.query(`
    INSERT INTO customer_credits (customer_id, total_credits, used_credits)
    SELECT id, 30, 0 FROM customers
    ON CONFLICT DO NOTHING;
  `);

  // Seed activity summary for existing customers
  await db.query(`
    INSERT INTO customer_activity_summary (customer_id)
    SELECT id FROM customers
    ON CONFLICT (customer_id) DO NOTHING;
  `);

  console.log('Sprint 12 migrations applied successfully.');
}
