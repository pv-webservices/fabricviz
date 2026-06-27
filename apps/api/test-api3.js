require('dotenv').config({path:'../../.env'});
const {Pool} = require('pg');
const jwt = require('jsonwebtoken');

const db = new Pool({connectionString: process.env.DATABASE_URL});

(async () => {
  try {
    const cRes = await db.query('SELECT id FROM customers LIMIT 1');
    const customerId = cRes.rows[0].id;

    const payload = {
      type: 'customer_user',
      customerId: customerId,
    };
    
    const secret = process.env.JWT_SECRET || 'supersecret';
    const token = jwt.sign(payload, secret);

    const fRes = await db.query('SELECT id FROM fabrics LIMIT 1');
    const fabricId = fRes.rows[0].id;
    const rRes = await db.query('SELECT id FROM predefined_rooms LIMIT 1');
    const roomId = rRes.rows[0].id;
    
    const requestPayload = {
      roomId: roomId,
      sourceType: 'predefined_room',
      assignments: [
        { areaKey: 'sofa-all', fabricId: fabricId }
      ],
      model: 'fast'
    };

    const res = await fetch(`http://localhost:4000/api/renders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(requestPayload)
    });
    console.log("Status:", res.status);
    console.log("Body:", await res.text());
  } catch (err) {
    console.error(err);
  } finally {
    db.end();
  }
})();
