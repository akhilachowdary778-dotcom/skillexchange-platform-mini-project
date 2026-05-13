const db = require("../config/db.config");

/* ===============================
   ADD SKILL
================================ */

exports.addSkill = (req, res) => {

  const { userId, skillName, skillDescription } = req.body;

  if (!userId || !skillName) {
    return res.status(400).json({
      message: "All fields required"
    });
  }

  const sql = `
    INSERT INTO skills (user_id, skill_name, skill_description, type)
    VALUES (?, ?, ?, 'teach')
  `;

  db.query(sql, [userId, skillName, skillDescription || null], (err) => {

    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error adding skill"
      });
    }

    res.json({
      message: "Skill added successfully"
    });

  });

};



/* ===============================
   GET ALL SKILLS
================================ */

exports.getSkills = (req, res) => {

  const sql = `
    SELECT
      skills.id,
      skills.skill_name,
      skills.skill_description,
      skills.type,
      users.id AS user_id,
      users.name
    FROM skills
    JOIN users ON skills.user_id = users.id
    ORDER BY skills.id DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error fetching skills"
      });
    }

    res.json(result);

  });

};



/* ===============================
   GET USER SKILLS
================================ */

exports.getUserSkills = (req, res) => {

  const userId = req.params.userId;

  const sql = `
    SELECT id, skill_name, skill_description, type
    FROM skills
    WHERE user_id = ?
  `;

  db.query(sql, [userId], (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error fetching user skills"
      });
    }

    res.json(result);

  });

};



/* ===============================
   DELETE SKILL
================================ */

exports.deleteSkill = (req, res) => {

  const skillId = req.params.id;
  const userId = req.body.userId;

  if (!userId) {
    return res.status(400).json({
      message: "User ID required"
    });
  }

  const sql = `
    DELETE FROM skills
    WHERE id = ? AND user_id = ?
  `;

  db.query(sql, [skillId, userId], (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error deleting skill"
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Skill not found or unauthorized"
      });
    }

    res.json({
      message: "Skill deleted successfully"
    });

  });

};