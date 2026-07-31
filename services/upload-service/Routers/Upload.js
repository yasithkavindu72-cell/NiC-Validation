const express = require("express");

// Multer middleware checks file type/size and stores uploads in memory.
const upload = require(
  "../Middleware/UploadMiddleware"
);

const {
  parseCsvBuffer,
  findNicColumn,
} = require("../Services/CsvReader");
const {
  findExistingFileNames,
  findExistingNicNumbers,
  saveValidatedUpload,
} = require("../Services/UploadRepository");
const {
  saveFilesToServer,
  removeStoredBatch,
} = require("../Services/FileStorage");

// Create the route collection mounted at /uploads by Server.js.
const router = express.Router();

// POST /uploads accepts and processes one batch of four CSV files.
router.post(
  "/",
  // Read a maximum of four files from the multipart field named "files".
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

      const uploadedFileNames = req.files.map(
        (file) => file.originalname
      );

      // Compare lowercase names to find duplicates in the current request.
      const uniqueFileNames = new Set(
        uploadedFileNames.map((fileName) => fileName.toLowerCase())
      );

      if (uniqueFileNames.size !== uploadedFileNames.length) {
        return res.status(409).json({
          success: false,
          message: "You have uploaded duplicate files.",
        });
      }

      // Check whether any filename was already saved in an earlier upload.
      const existingFileNames = await findExistingFileNames(
        uploadedFileNames
      );

      if (existingFileNames.length > 0) {
        return res.status(409).json({
          success: false,
          message: "You have uploaded duplicate files.",
          duplicateFiles: existingFileNames,
        });
      }

      // Read and prepare all four CSV files at the same time.
      const parsedFiles = await Promise.all(
        req.files.map(async (file) => {
          const rows = await parseCsvBuffer(
            file.buffer
          );

          // Reject files that contain no data rows.
          if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error(
              `${file.originalname} is empty.`
            );
          }

          // Find the NIC column even if the source uses an accepted variation.
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

      // Calculate the total number of CSV data rows in this batch.
      const totalRecords = parsedFiles.reduce(
        (total, file) =>
          total + file.rowCount,
        0
      );

      // Normalize all non-empty NIC values before duplicate checking.
      const nicNumbers = parsedFiles
        .flatMap((file) => file.records)
        .map((record) => record.nic.trim().toUpperCase())
        .filter(Boolean);
      const seenNicNumbers = new Set();
      const duplicateNicNumbers = new Set();

      // Find NIC values repeated across the four files in this request.
      nicNumbers.forEach((nicNumber) => {
        if (seenNicNumbers.has(nicNumber)) {
          duplicateNicNumbers.add(nicNumber);
        }

        seenNicNumbers.add(nicNumber);
      });

      // Find NIC values that already exist in the database.
      const existingNicNumbers = await findExistingNicNumbers(
        [...seenNicNumbers]
      );

      existingNicNumbers.forEach((nicNumber) => {
        duplicateNicNumbers.add(String(nicNumber).toUpperCase());
      });

      // Reject the entire batch if any duplicate NIC number was found.
      if (duplicateNicNumbers.size > 0) {
        return res.status(409).json({
          success: false,
          message: "Duplicate NIC numbers are not allowed.",
          duplicateNicNumbers: [...duplicateNicNumbers],
        });
      }

      const validationServiceUrl =
        process.env.VALIDATION_SERVICE_URL ||
        "http://localhost:5003";

      let validationResponse;

      // Send the parsed records to the separate NIC Validation Service.
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

      // Convert the Validation Service response into a JavaScript object.
      try {
        validationData = JSON.parse(responseText);
      } catch {
        throw new Error(
          "Validation Service returned an invalid JSON response."
        );
      }

      // Treat non-2xx responses from the Validation Service as upload errors.
      if (!validationResponse.ok) {
        throw new Error(
          validationData.message ||
            "NIC Validation Service failed."
        );
      }

      // Save the original CSV files on the server only after validation passes.
      const storedUpload = await saveFilesToServer(req.files);
      let batchId;

      // Save validated records and their summary in the database.
      try {
        batchId = await saveValidatedUpload({
          validatedFiles: validationData.files,
          summary: validationData.summary,
        });
      } catch (error) {
        // Roll back saved files if the database operation fails.
        await removeStoredBatch(storedUpload.batchDirectory);
        throw error;
      }

      // Return everything the frontend needs for Records and Reports pages.
      return res.status(200).json({
        success: true,
        message:
          "Four CSV files uploaded and validated successfully.",
        totalFiles: parsedFiles.length,
        totalRecords,
        batchId,
        savedToDatabase: true,
        savedToServer: true,
        storageBatch: storedUpload.storageBatch,
        storedFiles: storedUpload.storedFiles,
        validation: validationData.summary,
        files: validationData.files,
      });
    } catch (error) {
      // Pass unexpected errors to the central Express error handler.
      next(error);
    }
  }
);

module.exports = router;
