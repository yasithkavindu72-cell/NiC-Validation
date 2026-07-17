const express = require("express");
const cors = require("cors");
require("dotenv").config();

const AuthRoutes = require("./Routers/Auth");
const verifyToken = require("./Middleware/AuthMiddleware");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "auth-service",
    message: "Authentication Service is running",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "auth-service",
    status: "healthy",
  });
});

app.get("/profile", verifyToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

app.use("/auth", AuthRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Auth Service running on http://localhost:${PORT}`);
});