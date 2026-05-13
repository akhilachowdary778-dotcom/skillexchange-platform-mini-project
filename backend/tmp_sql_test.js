const db = require('./config/db.config');
const sql = `SELECT
  users.id,
  users.name,
  users.email,
  users.bio,
  users.skills_offered,
  users.skills_wanted,
  GROUP_CONCAT(skills.skill_name, ', ') AS skill_list
FROM users
LEFT JOIN skills ON skills.user_id = users.id
GROUP BY users.id, users.name, users.email, users.bio, users.skills_offered, users.skills_wanted
ORDER BY users.name ASC`;

db.all(sql)
  .then(rows => {
    console.log('ROWS', rows.length);
    rows.forEach(r => console.log(r));
    process.exit(0);
  })
  .catch(err => {
    console.error('ERR', err);
    process.exit(1);
  });
