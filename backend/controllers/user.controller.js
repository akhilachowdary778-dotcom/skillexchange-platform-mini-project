const db = require("../config/db.config");

/* ===============================
   GET USER PROFILE
================================ */
exports.getProfile = (req, res) => {
  const userId = req.params.id;

  const sql = `
    SELECT id, name, email, bio, skills_offered, skills_wanted, created_at
    FROM users
    WHERE id = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error fetching profile" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result[0]);
  });
};

/* ===============================
   UPDATE USER PROFILE
================================ */
exports.updateProfile = (req, res) => {
  const userId = req.params.id;
  const { name, bio, skillsOffered, skillsWanted } = req.body;

  const sql = `
    UPDATE users
    SET name = ?, bio = ?, skills_offered = ?, skills_wanted = ?
    WHERE id = ?
  `;

  db.query(sql, [name, bio, skillsOffered, skillsWanted, userId], (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error updating profile" });
    }

    res.json({ message: "Profile updated successfully" });
  });
};

/* ===============================
   GET ALL USERS (for Browse)
================================ */
exports.getAllUsers = (req, res) => {
  const sql = `
    SELECT
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
    ORDER BY users.name ASC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error fetching users" });
    }

    res.json(result);
  });
};
