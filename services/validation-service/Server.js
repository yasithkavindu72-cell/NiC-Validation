const express = require("express");
const cors = require("cors");
require("dotenv").config();

const ValidationRoutes = require("./Routers/Validation");

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "validation-service",
    message: "NIC Validation Service is running",
  });
});

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "healthy",
  });
});

app.use("/validate", ValidationRoutes);

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(
    `Validation Service running on http://localhost:${PORT}`
  );
});