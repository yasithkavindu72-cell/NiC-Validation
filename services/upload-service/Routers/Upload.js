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
      // Exactly four files are required.
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

      // Read all four CSV files.
      const parsedFiles = await Promise.all(
        req.files.map(async (file) => {
          const rows = await parseCsvBuffer(
            file.buffer
          );

          if (!Array.isArray(rows) || rows.length === 0) {
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
              // CSV row 1 contains the column headings.
              rowNumber: index + 2,

              // Empty or incorrect NIC values will be
              // marked invalid by the Validation Service.
              nic: String(
                row[nicColumn] ?? ""
              ).trim(),
            })
          );

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

      const validationServiceUrl =
        process.env.VALIDATION_SERVICE_URL ||
        "http://localhost:5003";

      let validationResponse;

      try {
        validationResponse = await fetch(
          `${validationServiceUrl}/validate/batch`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              files: parsedFiles,
            }),
          }
        );
      } catch (error) {
        throw new Error(
          `Cannot connect to Validation Service: ${error.message}`
        );
      }

      const responseText =
        await validationResponse.text();

      let validationData;

      try {
        validationData = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Validation Service returned an invalid JSON response."
        );
      }

      if (!validationResponse.ok) {
        throw new Error(
          validationData.message ||
            "NIC Validation Service failed."
        );
      }

      return res.status(200).json({
        success: true,
        message:
          "Four CSV files uploaded and validated successfully.",
        totalFiles: parsedFiles.length,
        totalRecords,
        validation: validationData.summary,
        files: validationData.files,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;