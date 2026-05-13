const express = require("express");
const serverless = require("serverless-http");

const authController = require("../backend/controllers/auth.controller");
const skillController = require("../backend/controllers/skill.controller");
const swapController = require("../backend/controllers/swap.controller");
const userController = require("../backend/controllers/user.controller");

const app = express();
app.use(express.json());

app.post("/api/auth/register", authController.register);
app.post("/api/auth/login", authController.login);

app.post("/api/skills", skillController.addSkill);
app.get("/api/skills", skillController.getSkills);
app.get("/api/skills/user/:userId", skillController.getUserSkills);
app.delete("/api/skills/:id", skillController.deleteSkill);

app.post("/api/swaps/request", swapController.requestSwap);
app.post("/api/swaps/accept", swapController.acceptSwap);
app.post("/api/swaps/decline", swapController.declineSwap);
app.post("/api/swaps/complete", swapController.completeSwap);
app.get("/api/swaps/user/:userId", swapController.getUserSwaps);

app.get("/api/users", userController.getAllUsers);
app.get("/api/users/:id", userController.getProfile);
app.put("/api/users/:id", userController.updateProfile);

app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

module.exports = serverless(app);
