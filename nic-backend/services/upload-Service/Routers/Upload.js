const express = require("express");

const upload = require(
  "../Middleware/UploadMiddleware"
);

const {
  parseCsvBuffer,
  findNicColumn,
} = require("../Services/CsvReader");

const router = express.Router();

router.post(
  "/",
  upload.array("files", 4),
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length !== 4) {
        return res.status(400).json({
          success: false,
          message:
            "You must upload exactly four CSV files.",
          receivedFiles: req.files
            ? req.files.length
            : 0,
        });
      }

      // Process all four CSV files together.
      const parsedFiles = await Promise.all(
        req.files.map(async (file) => {
          const rows = await parseCsvBuffer(
            file.buffer
          );

          if (rows.length === 0) {
            throw new Error(
              `${file.originalname} is empty.`
            );
          }

          const nicColumn = findNicColumn(rows[0]);

          if (!nicColumn) {
            throw new Error(
              `${file.originalname} does not contain an NIC column.`
            );
          }

          const records = rows.map(
            (row, index) => ({
              rowNumber: index + 2,
              nic: String(
                row[nicColumn] || ""
              ).trim(),
            })
          );

          const hasEmptyNic = records.some(
            (record) => !record.nic
          );

          if (hasEmptyNic) {
            throw new Error(
              `${file.originalname} contains an empty NIC value.`
            );
          }

          return {
            fileName: file.originalname,
            rowCount: records.length,
            records,
          };
        })
      );

      const totalRecords = parsedFiles.reduce(
        (total, file) =>
          total + file.rowCount,
        0
      );

      return res.status(200).json({
        success: true,
        message:
          "Four CSV files uploaded successfully.",
        totalFiles: parsedFiles.length,
        totalRecords,
        files: parsedFiles,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;