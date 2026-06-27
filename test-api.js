(async () => {
  const payload = {
    roomId: '83f5e55e-1888-46fb-9fc5-2c813589b917',
    sourceType: 'predefined_room',
    assignments: [
      { areaKey: 'sofa-all', fabricId: '633d71de-a6b1-4f18-a6d1-4db56740ffae' }
    ],
    model: 'fast'
  };

  try {
    const res = await fetch('http://localhost:4000/api/renders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(res.status);
    console.log(await res.text());
  } catch (err) {
    console.error(err);
  }
})();
