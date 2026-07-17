const multer = require("multer");
const path = require("path");

// Keep uploaded files temporarily in memory.
// The files will later be sent to the Validation Service.
const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    files: 4,
    fileSize: 5 * 1024 * 1024, // Maximum 5 MB per file
  },

  fileFilter: (req, file, callback) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (extension !== ".csv") {
      return callback(
        new Error(
          `Only CSV files are allowed: ${file.originalname}`
        )
      );
    }

    callback(null, true);
  },
});

module.exports = upload;