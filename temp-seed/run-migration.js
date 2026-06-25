const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({
    connectionString: 'postgresql://fabricviz:password@localhost:5432/fabricviz'
  });
  
  try {
    await client.connect();
    const sql = fs.readFileSync('f:/Project/fabricviz/add_customers.sql', 'utf8');
    await client.query(sql);
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed', err);
  } finally {
    await client.end();
  }
}

run();
