const db = require("../config/db.config");

/* =========================
   SEND SWAP REQUEST
========================= */

exports.requestSwap = (req, res) => {

  const { senderId, receiverId, skillId } = req.body;

  if (!senderId || !receiverId || !skillId) {
    return res.status(400).json({
      message: "All fields required"
    });
  }

  // Prevent self-swap
  if (senderId === receiverId) {
    return res.status(400).json({
      message: "You cannot send a swap request to yourself"
    });
  }

  const sql = `
    INSERT INTO swap_requests (sender_id, receiver_id, skill_id)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [senderId, receiverId, skillId], (err) => {

    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error sending swap request"
      });
    }

    res.json({
      message: "Swap request sent successfully"
    });

  });

};



/* =========================
   ACCEPT SWAP REQUEST
========================= */

exports.acceptSwap = (req, res) => {

  const { requestId, meetingLink } = req.body;

  if (!requestId) {
    return res.status(400).json({
      message: "Request ID required"
    });
  }

  if (!meetingLink) {
    return res.status(400).json({
      message: "Google Meet link is required"
    });
  }

  const sql = `
    UPDATE swap_requests
    SET status = 'accepted', meeting_link = ?
    WHERE id = ?
  `;

  db.query(sql, [meetingLink, requestId], (err) => {

    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error accepting request"
      });
    }

    // Fetch both users' emails and skill name to send via Formspree
    const infoSql = `
      SELECT
        sender.email AS sender_email,
        sender.name  AS sender_name,
        receiver.email AS receiver_email,
        receiver.name  AS receiver_name,
        skills.skill_name
      FROM swap_requests
      JOIN users AS sender   ON swap_requests.sender_id   = sender.id
      JOIN users AS receiver ON swap_requests.receiver_id  = receiver.id
      JOIN skills             ON swap_requests.skill_id     = skills.id
      WHERE swap_requests.id = ?
    `;

    db.query(infoSql, [requestId], (err2, rows) => {
      if (err2 || !rows || rows.length === 0) {
        // Still return success for the accept itself
        return res.json({
          message: "Swap accepted (email notification skipped)",
          meetingLink
        });
      }

      const info = rows[0];

      // Send email to BOTH users via Nodemailer (fire-and-forget)
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const emailBody = `
Skill Swap Accepted! 🎉

Skill: ${info.skill_name}
Sender: ${info.sender_name} (${info.sender_email})
Receiver: ${info.receiver_name} (${info.receiver_email})

📹 Google Meet Link: ${meetingLink}

Join the meeting at the link above to begin your skill swap session!
      `.trim();

      const mailOptionsSender = {
        from: process.env.EMAIL_USER,
        to: info.sender_email,
        subject: `SkillSwapHub: Your swap for "${info.skill_name}" has been accepted!`,
        text: emailBody
      };

      const mailOptionsReceiver = {
        from: process.env.EMAIL_USER,
        to: info.receiver_email,
        subject: `SkillSwapHub: Swap for "${info.skill_name}" accepted — join the meeting!`,
        text: emailBody
      };

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        transporter.sendMail(mailOptionsSender).catch(e => console.log("Nodemailer email (sender) error:", e));
        transporter.sendMail(mailOptionsReceiver).catch(e => console.log("Nodemailer email (receiver) error:", e));
      } else {
        console.log("Email credentials not provided in .env, skipping email sending.");
      }

      res.json({
        message: "Swap accepted & meeting link emails sent!",
        meetingLink
      });
    });

  });

};



/* =========================
   DECLINE SWAP REQUEST
========================= */

exports.declineSwap = (req, res) => {

  const { requestId } = req.body;

  if (!requestId) {
    return res.status(400).json({
      message: "Request ID required"
    });
  }

  const sql = `
    UPDATE swap_requests
    SET status = 'rejected'
    WHERE id = ?
  `;

  db.query(sql, [requestId], (err) => {

    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error declining request"
      });
    }

    res.json({
      message: "Swap request declined"
    });

  });

};



/* =========================
   COMPLETE SWAP (Mark as Learnt)
========================= */

exports.completeSwap = (req, res) => {

  const { requestId, userId } = req.body;

  if (!requestId || !userId) {
    return res.status(400).json({
      message: "Request ID and User ID are required"
    });
  }

  // 1. Fetch the swap request to get the skill info
  const fetchSql = `
    SELECT swap_requests.*, skills.skill_name, skills.skill_description
    FROM swap_requests
    JOIN skills ON swap_requests.skill_id = skills.id
    WHERE swap_requests.id = ? AND swap_requests.status = 'accepted'
  `;

  db.query(fetchSql, [requestId], (err, rows) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Error fetching swap request" });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "Swap request not found or already completed" });
    }

    const swap = rows[0];

    const isSender = String(swap.sender_id) === String(userId);
    const isReceiver = String(swap.receiver_id) === String(userId);

    // Either sender or receiver can mark the swap as completed
    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: "Not authorized to complete this swap" });
    }

    if (isSender && swap.sender_completed) {
      return res.status(400).json({ message: "You already marked this as completed" });
    }
    if (isReceiver && swap.receiver_completed) {
      return res.status(400).json({ message: "You already marked this as completed" });
    }

    const columnToUpdate = isSender ? 'sender_completed' : 'receiver_completed';
    const bothCompletedNow = (isSender && swap.receiver_completed) || (isReceiver && swap.sender_completed);

    // 2. Mark this user's side as completed. If both are done, also update overall status.
    let updateSql = `UPDATE swap_requests SET ${columnToUpdate} = TRUE`;
    if (bothCompletedNow) {
      updateSql += `, status = 'completed'`;
    }
    updateSql += ` WHERE id = ?`;

    db.query(updateSql, [requestId], (err2) => {
      if (err2) {
        console.log(err2);
        return res.status(500).json({ message: "Error completing swap" });
      }

      // 3. Add the skill from the opposite member
      if (isSender) {
        // Sender gets the explicitly requested skill
        const addSkillSql = `
          INSERT INTO skills (user_id, skill_name, skill_description, type)
          VALUES (?, ?, ?, 'teach')
        `;

        db.query(addSkillSql, [userId, swap.skill_name, swap.skill_description || "Learned via SkillSwapHub"], (err3) => {
          if (err3) {
            console.log(err3);
            return res.json({ message: "Swap completed, but could not auto-add skill." });
          }
          res.json({ message: `Congratulations! "${swap.skill_name}" has been added to your skills!` });
        });
      } else {
        // Receiver gets one of the sender's skills
        const getSenderSkillSql = `SELECT skill_name, skill_description FROM skills WHERE user_id = ? AND type = 'teach' LIMIT 1`;
        db.query(getSenderSkillSql, [swap.sender_id], (err3, skillRows) => {
          if (err3 || skillRows.length === 0) {
            return res.json({ message: "Swap completed! (No specific skill found from the sender to add)" });
          }
          const senderSkill = skillRows[0];
          const addSkillSql = `
            INSERT INTO skills (user_id, skill_name, skill_description, type)
            VALUES (?, ?, ?, 'teach')
          `;
          db.query(addSkillSql, [userId, senderSkill.skill_name, senderSkill.skill_description || "Learned via SkillSwapHub"], (err4) => {
            if (err4) {
              console.log(err4);
              return res.json({ message: "Swap completed! (Could not auto-add skill)" });
            }
            res.json({ message: `Congratulations! "${senderSkill.skill_name}" from your peer has been added to your skills!` });
          });
        });
      }
    });
  });

};



/* =========================
   GET USER SWAPS
========================= */

exports.getUserSwaps = (req, res) => {

  const userId = req.params.userId;

  const sql = `
    SELECT swap_requests.id,
           sender.name AS sender_name,
           receiver.name AS receiver_name,
           skills.skill_name,
           swap_requests.status,
           swap_requests.meeting_link,
           swap_requests.meeting_time,
           swap_requests.sender_id,
           swap_requests.receiver_id,
           swap_requests.sender_completed,
           swap_requests.receiver_completed,
           swap_requests.created_at
    FROM swap_requests
    JOIN users AS sender ON swap_requests.sender_id = sender.id
    JOIN users AS receiver ON swap_requests.receiver_id = receiver.id
    JOIN skills ON swap_requests.skill_id = skills.id
    WHERE swap_requests.receiver_id = ? OR swap_requests.sender_id = ?
    ORDER BY swap_requests.created_at DESC
  `;

  db.query(sql, [userId, userId], (err, result) => {

    if (err) {
      console.log(err);
      return res.status(500).json({
        message: "Error fetching swaps"
      });
    }

    res.json(result);

  });

};