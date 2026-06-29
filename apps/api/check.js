const { Pool } = require('pg');
const p = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/fabricviz' });
p.query("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'visualizations_source_type_check'")
  .then(res => console.log(res.rows))
  .catch(console.error)
  .finally(() => p.end());
