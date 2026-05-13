require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authController = require("./controllers/auth.controller");
const skillController = require("./controllers/skill.controller");
const swapController = require("./controllers/swap.controller");
const userController = require("./controllers/user.controller");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`REQUEST: ${req.method} ${req.url}`);
  next();
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend/pages")));
app.use("/js", express.static(path.join(__dirname, "../frontend/js")));
app.use("/css", express.static(path.join(__dirname, "../frontend/css")));

/* ========================
   AUTH ROUTES
======================== */
app.post("/api/auth/register", authController.register);
app.post("/api/auth/login", authController.login);

/* ========================
   SKILL ROUTES
======================== */
app.post("/api/skills", skillController.addSkill);
app.get("/api/skills", skillController.getSkills);
app.get("/api/skills/user/:userId", skillController.getUserSkills);
app.delete("/api/skills/:id", skillController.deleteSkill);

/* ========================
   SWAP ROUTES
======================== */
app.post("/api/swaps/request", swapController.requestSwap);
app.post("/api/swaps/accept", swapController.acceptSwap);
app.post("/api/swaps/decline", swapController.declineSwap);
app.post("/api/swaps/complete", swapController.completeSwap);
app.get("/api/swaps/user/:userId", swapController.getUserSwaps);

/* ========================
   USER ROUTES
======================== */
app.get("/api/users", userController.getAllUsers);
app.get("/api/users/:id", userController.getProfile);
app.put("/api/users/:id", userController.updateProfile);

/* ========================
   CATCH-ALL: Serve index.html
======================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});