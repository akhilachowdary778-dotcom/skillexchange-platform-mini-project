const baseUrl = 'http://localhost:3000';

async function test() {
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: 'alice.demo@gmail.com', password: 'Password123!' })
    });
    console.log('LOGIN STATUS', res.status);
    const body = await res.text();
    console.log('BODY', body);
  } catch (err) {
    console.error('ERROR', err);
  }

  try {
    const res2 = await fetch(`${baseUrl}/api/users`);
    console.log('USERS STATUS', res2.status);
    const b2 = await res2.text();
    console.log('USERS BODY', b2.slice(0, 400));
  } catch (err) {
    console.error('ERROR /api/users', err);
  }
}

test().then(() => process.exit(0)).catch(err => { console.error('FATAL', err); process.exit(1); });
