const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const UploadRoutes = require(
  "./Routers/Upload"
);

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
  res.status(200).json({
    success: true,
    service: "upload-service",
    message: "Upload Service is running",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "upload-service",
    status: "healthy",
  });
});

app.use("/uploads", UploadRoutes);

// Central error handler
app.use((error, req, res, next) => {
  console.error("Upload error:", error.message);

  if (error instanceof multer.MulterError) {
    let message = error.message;

    if (error.code === "LIMIT_FILE_SIZE") {
      message =
        "Each CSV file must be 5 MB or smaller.";
    }

    if (
      error.code === "LIMIT_FILE_COUNT" ||
      error.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      message =
        "You must upload exactly four CSV files.";
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }

  return res.status(400).json({
    success: false,
    message:
      error.message ||
      "CSV upload failed.",
  });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(
    `Upload Service running on http://localhost:${PORT}`
  );
});