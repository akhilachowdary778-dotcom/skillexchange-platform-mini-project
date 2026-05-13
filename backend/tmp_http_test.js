const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 5000
      },
      (res) => {
        let response = '';
        res.on('data', chunk => response += chunk);
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body: response });
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  try {
    const login = await post('/api/auth/login', { email:'alice.demo@gmail.com', password:'Password123!' });
    console.log('LOGIN', login.status, login.body);
  } catch (err) {
    console.error('LOGIN ERR', err.message);
  }

  try {
    const users = await new Promise((resolve, reject) => {
      const req = http.request({ hostname:'localhost', port:3000, path:'/api/users', method:'GET', timeout:5000 }, (res) => {
        let response = '';
        res.on('data', chunk => response += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: response }));
      });
      req.on('timeout', () => { req.destroy(new Error('timeout')); });
      req.on('error', reject);
      req.end();
    });
    console.log('USERS', users.status, users.body.slice(0, 300));
  } catch (err) {
    console.error('USERS ERR', err.message);
  }
}

run().then(() => process.exit(0)).catch(err => { console.error('FATAL', err); process.exit(1); });
