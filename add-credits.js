require('dotenv').config({ path: '.env' });
const { Pool } = require('./apps/api/node_modules/pg');
const db = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://fabricviz:password@localhost:5432/fabricviz' });
db.query("UPDATE customers SET credits_remaining = 100").then(() => console.log('Credits added to customers')).finally(() => db.end());
