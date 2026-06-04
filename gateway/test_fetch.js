import http from 'http';

const loginData = JSON.stringify({
  email: 'rohith@autonomousqa.io',
  password: 'password123'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const { token } = JSON.parse(body);
    console.log('Token obtained.');

    const req2 = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/tests?limit=100',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }, (res2) => {
      let body2 = '';
      res2.on('data', (chunk) => body2 += chunk);
      res2.on('end', () => {
        const data = JSON.parse(body2);
        console.log('--- RUNS FROM GATEWAY API ---');
        for (const run of data.testRuns) {
          console.log(`ID: ${run.id} | URL: ${run.url}`);
        }
      });
    });
    req2.end();
  });
});

req.write(loginData);
req.end();
