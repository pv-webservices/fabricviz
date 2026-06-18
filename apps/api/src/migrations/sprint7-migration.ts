import { Pool } from 'pg';

export async function runSprint7Migrations(db: Pool) {
  // 1. Drop CHECK constraint on requests.type to allow 'credit_request'
  // In PostgreSQL, if we don't know the exact name of the constraint because it was implicitly named,
  // we can just alter the column type to TEXT without constraint, or find and drop it dynamically.
  // A safer bet without knowing the exact name is to just leave it and accept 'credit_request' if it's already TEXT, 
  // but it does have a check constraint in init.sql. We will dynamically find and drop it.
  
  await db.query(`
    DO $$ 
    DECLARE 
      constraint_name text;
    BEGIN
      SELECT conname INTO constraint_name 
      FROM pg_constraint 
      WHERE conrelid = 'requests'::regclass AND contype = 'c';
      
      IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE requests DROP CONSTRAINT ' || constraint_name;
      END IF;
    END $$;
  `);

  // 2. Add admin_notes and access_code_id to requests
  await db.query(`
    ALTER TABLE requests 
    ADD COLUMN IF NOT EXISTS admin_notes TEXT,
    ADD COLUMN IF NOT EXISTS access_code_id UUID REFERENCES access_codes(id);
  `);

  // 3. Add city to access_codes for analytics
  await db.query(`
    ALTER TABLE access_codes 
    ADD COLUMN IF NOT EXISTS city TEXT;
  `);

  // 4. Create credit_transactions for audit history
  await db.query(`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      access_code_id UUID REFERENCES access_codes(id),
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('Sprint 7 migrations applied successfully.');
}
