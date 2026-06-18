import { Pool } from 'pg';
import { runSprint5Migrations } from './migrations/sprint5-migration';

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://fabricviz:password@localhost:5432/fabricviz',
});

runSprint5Migrations(db)
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
