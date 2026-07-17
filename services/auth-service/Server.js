const express = require("express");
const cors = require("cors");
require("dotenv").config();

const AuthRoutes = require("./Routers/Auth");
const verifyToken = require("./Middleware/AuthMiddleware");

const app = express();

const allowedFrontendUrl =
  process.env.FRONTEND_URL || "http://localhost:5173";

const corsOrigin = (origin, callback) => {
  if (
    !origin ||
    origin === allowedFrontendUrl ||
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  ) {
    callback(null, true);
    return;
  }

  callback(new Error("Not allowed by CORS"));
};

app.use(
  cors({
    origin: corsOrigin,
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
