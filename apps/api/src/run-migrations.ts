import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { Pool } from 'pg';
import fs from 'fs';
import { runSprint5Migrations } from './migrations/sprint5-migration';
import { runSprint7Migrations } from './migrations/sprint7-migration';
import { runSprint9Migrations } from './migrations/sprint9-migration';
import { runCmsMigrations } from './migrations/cms-migration';
import { runSprint10Migrations } from './migrations/sprint10-migration';
import { runSprint11Migrations } from './migrations/sprint11-migration';
import { runSprint12Migrations } from './migrations/sprint12-migration';

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fabricviz:password@localhost:5432/fabricviz',
});

async function main() {
  try {
    // Check if base tables exist
    const res = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      );
    `);
    
    if (!res.rows[0].exists) {
      console.log('Base tables missing. Running init.sql...');
      const initSql = fs.readFileSync(path.resolve(__dirname, '../../../infra/postgres/init.sql'), 'utf-8');
      await db.query(initSql);
      console.log('init.sql applied successfully.');
    } else {
      console.log('Base tables exist. Skipping init.sql.');
    }

    await runSprint5Migrations(db);
    await runSprint7Migrations(db);
    await runSprint9Migrations(db);
    await runCmsMigrations(db);
    await runSprint10Migrations(db);
    await runSprint11Migrations(db);
    await runSprint12Migrations(db);
    console.log('All migrations done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
