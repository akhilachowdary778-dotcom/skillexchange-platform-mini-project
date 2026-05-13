const path = require("path");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "..", "database.sqlite");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("SQLite database connection failed:", err);
  } else {
    console.log("Connected to SQLite database at", dbPath);
  }
});

// Enable foreign key enforcement and create tables if they don't exist
db.serialize(() => {
  db.run("PRAGMA foreign_keys = ON;");

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      bio TEXT DEFAULT NULL,
      skills_offered TEXT DEFAULT NULL,
      skills_wanted TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      skill_name TEXT NOT NULL,
      skill_description TEXT DEFAULT NULL,
      type TEXT DEFAULT 'teach',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS swap_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      skill_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      meeting_link TEXT DEFAULT NULL,
      meeting_time TEXT DEFAULT NULL,
      sender_completed INTEGER DEFAULT 0,
      receiver_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    )
  `);

  const demoUsers = [
    {
      name: "Alice Demo",
      email: "alice.demo@gmail.com",
      password: "Password123!",
      bio: "Designer who loves teaching UI and learning JavaScript.",
      skills_offered: "Figma, UI Design, Photoshop",
      skills_wanted: "JavaScript, React"
    },
    {
      name: "Bob Demo",
      email: "bob.demo@gmail.com",
      password: "Password123!",
      bio: "Marketing specialist offering branding tips.",
      skills_offered: "Brand Strategy, Content Writing",
      skills_wanted: "Excel, Python"
    },
    {
      name: "Carol Demo",
      email: "carol.demo@gmail.com",
      password: "Password123!",
      bio: "Developer looking to exchange coding knowledge.",
      skills_offered: "HTML, CSS, Git",
      skills_wanted: "SQL, Node.js"
    }
  ];

  function seedUsers(index = 0) {
    if (index >= demoUsers.length) {
      seedSkills();
      return;
    }

    const demo = demoUsers[index];
    db.get("SELECT id FROM users WHERE email = ?", [demo.email], (err, row) => {
      if (err) {
        console.error("Error checking demo user:", err);
        return seedUsers(index + 1);
      }

      if (row) {
        return seedUsers(index + 1);
      }

      bcrypt.hash(demo.password, 10, (hashErr, hashedPassword) => {
        if (hashErr) {
          console.error("Error hashing demo password:", hashErr);
          return seedUsers(index + 1);
        }

        db.run(
          `INSERT INTO users (name, email, password, bio, skills_offered, skills_wanted) VALUES (?, ?, ?, ?, ?, ?)`,
          [demo.name, demo.email, hashedPassword, demo.bio, demo.skills_offered, demo.skills_wanted],
          (insertErr) => {
            if (insertErr) {
              console.error("Error seeding demo user:", insertErr);
            }
            seedUsers(index + 1);
          }
        );
      });
    });
  }

  function seedSkills() {
    const demoSkills = [
      { email: "alice.demo@gmail.com", skill_name: "Figma Basics", skill_description: "Learn how to build polished UI mockups." },
      { email: "alice.demo@gmail.com", skill_name: "UI Color Theory", skill_description: "Understand design color harmony." },
      { email: "bob.demo@gmail.com", skill_name: "Content Strategy", skill_description: "Plan content that converts." },
      { email: "bob.demo@gmail.com", skill_name: "Social Media Growth", skill_description: "Grow your reach organically." },
      { email: "carol.demo@gmail.com", skill_name: "HTML/CSS Foundations", skill_description: "Build responsive layouts from scratch." },
      { email: "carol.demo@gmail.com", skill_name: "Git Workflow", skill_description: "Master branching and collaboration." }
    ];

    demoSkills.forEach((skill) => {
      db.get("SELECT id FROM users WHERE email = ?", [skill.email], (err, userRow) => {
        if (err || !userRow) return;

        db.get(
          "SELECT id FROM skills WHERE user_id = ? AND skill_name = ?",
          [userRow.id, skill.skill_name],
          (skillErr, skillRow) => {
            if (skillErr || skillRow) return;
            db.run(
              `INSERT INTO skills (user_id, skill_name, skill_description, type) VALUES (?, ?, ?, 'teach')`,
              [userRow.id, skill.skill_name, skill.skill_description],
              (insertErr) => {
                if (insertErr) console.error("Error seeding demo skill:", insertErr);
              }
            );
          }
        );
      });
    });
  }

  seedUsers();
});

function query(sql, params, callback) {
  if (typeof params === "function") {
    callback = params;
    params = [];
  }

  const trimmed = sql.trim().split(/\s+/)[0].toUpperCase();
  if (trimmed === "SELECT" || trimmed === "PRAGMA") {
    db.all(sql, params, callback);
  } else {
    db.run(sql, params, function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null, { affectedRows: this.changes, insertId: this.lastID });
      }
    });
  }
}

module.exports = {
  query,
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};