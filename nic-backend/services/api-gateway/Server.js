const express = require("express");
const cors = require("cors");
const {
  createProxyMiddleware,
} = require("http-proxy-middleware");

require("dotenv").config();

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

// Test the API Gateway
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    service: "api-gateway",
    message: "NIC Validation API Gateway is running",
  });
});

// Forward all /auth requests to Auth Service
app.use(
  createProxyMiddleware({
    pathFilter: "/auth",
    target:
      process.env.AUTH_SERVICE_URL ||
      "http://localhost:5001",
    changeOrigin: true,
    logger: console,
  })
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `API Gateway running on http://localhost:${PORT}`
  );
});


// Forward /uploads requests to Upload Service
app.use(
  createProxyMiddleware({
    pathFilter: "/uploads",
    target:
      process.env.UPLOAD_SERVICE_URL ||
      "http://localhost:5002",
    changeOrigin: true,
    logger: console,
  })
);