const db = require('./config/db.config');

db.query('SELECT * FROM users WHERE email = ?', ['alice.demo@gmail.com'], (err, rows) => {
  if (err) {
    console.error('ERR', err);
    process.exit(1);
  }
  console.log('ROWS', rows.length);
  console.log(rows[0]);
  process.exit(0);
});
