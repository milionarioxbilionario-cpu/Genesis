// Quick script to login (using tmp credentials in test env) and create a device key via cookie-based session
const fetch = require('node-fetch');

(async () => {
  try {
    // Use existing tmp login route if available: POST /api/auth/login with email/password
    const login = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@example.com', password: 'password' })
    });

    const cookies = login.headers.raw()['set-cookie'];
    if (!cookies) return console.error('no cookies set by login');

    const res = await fetch('http://localhost:4000/api/device-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookies.join(';') },
      body: JSON.stringify({ device_name: 'tmp-device-1' })
    });

    console.log('STATUS', res.status, await res.json());
  } catch (e) { console.error('err', e); }
})();
