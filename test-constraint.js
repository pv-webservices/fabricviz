require('dotenv').config({path:'.env'});
const {Pool} = require('./apps/api/node_modules/pg');
const db = new Pool({connectionString: process.env.DATABASE_URL});
db.query("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'visualizations_source_type_check'")
  .then(res => console.log(res.rows))
  .catch(console.error)
  .finally(()=>db.end());
