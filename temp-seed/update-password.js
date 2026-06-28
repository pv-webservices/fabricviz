const { Pool } = require('f:/Project/fabricviz/apps/api/node_modules/pg');
const pool = new Pool({ connectionString: 'postgresql://fabricviz:password@localhost:5432/fabricviz' });
pool.query("UPDATE customers SET password_hash = $1 WHERE email = $2", ['$2a$12$flJ6WcdI0cOMN7ZDXVhksOM2l1XHdqiIW4r8yCMFGkTQGIYRMAbNK', 'test@gmail.com'])
  .then(r => { console.log('Updated:', r.rowCount); pool.end(); })
  .catch(e => { console.error(e); pool.end(); });
