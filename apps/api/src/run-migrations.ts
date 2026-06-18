import { Pool } from 'pg';
import { runSprint5Migrations } from './migrations/sprint5-migration';
import { runSprint7Migrations } from './migrations/sprint7-migration';
import { runSprint9Migrations } from './migrations/sprint9-migration';

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fabricviz:password@localhost:5432/fabricviz',
});

async function main() {
  try {
    await runSprint5Migrations(db);
    await runSprint7Migrations(db);
    await runSprint9Migrations(db);
    console.log('All migrations done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
