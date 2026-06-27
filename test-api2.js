(async () => {
  const API_URL = 'http://localhost:4000';
  
  // Login as customer
  const loginRes = await fetch(`${API_URL}/api/auth/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'password123' }) // Need a real test customer?
  });
  
  if (loginRes.status === 401 || loginRes.status === 404) {
     console.log('Login failed', loginRes.status);
     return;
  }
  const loginJson = await loginRes.json();
  const token = loginJson.data.token;
  
  const payload = {
    roomId: '83f5e55e-1888-46fb-9fc5-2c813589b917', // need valid roomId?
    sourceType: 'predefined_room',
    assignments: [
      { areaKey: 'sofa-all', fabricId: '633d71de-a6b1-4f18-a6d1-4db56740ffae' } // need valid fabricId?
    ],
    model: 'fast'
  };

  try {
    const res = await fetch(`${API_URL}/api/renders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(payload)
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (err) {
    console.error(err);
  }
})();
