const express = require("express");
const {
  validateNic,
} = require("../Services/NicValidator");

const router = express.Router();

function getNicFromRecord(record) {
  return (
    record.nic ??
    record.NIC ??
    record.Nic ??
    ""
  );
}

// Validate one NIC
router.post("/one", (req, res) => {
  const { nic } = req.body;

  const result = validateNic(nic);

  return res.status(200).json({
    success: true,
    result,
  });
});

// Validate exactly four CSV files
router.post("/batch", (req, res) => {
  const { files } = req.body;

  if (!Array.isArray(files)) {
    return res.status(400).json({
      success: false,
      message: "Files must be provided as an array.",
    });
  }

  if (files.length !== 4) {
    return res.status(400).json({
      success: false,
      message: "Exactly four CSV files are required.",
      receivedFiles: files.length,
    });
  }

  const summary = {
    totalFiles: 4,
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    male: 0,
    female: 0,
  };

  const validatedFiles = files.map((file) => {
    const records = Array.isArray(file.records)
      ? file.records
      : [];

    const validatedRecords = records.map(
      (record, index) => {
        const nic = getNicFromRecord(record);
        const result = validateNic(nic);

        summary.totalRecords += 1;

        if (result.isValid) {
          summary.validRecords += 1;

          if (result.gender === "Male") {
            summary.male += 1;
          }

          if (result.gender === "Female") {
            summary.female += 1;
          }
        } else {
          summary.invalidRecords += 1;
        }

        return {
          rowNumber:
            record.rowNumber ?? index + 1,
          ...result,
        };
      }
    );

    return {
      fileName:
        file.fileName || "unknown.csv",
      rowCount: validatedRecords.length,
      records: validatedRecords,
    };
  });

  return res.status(200).json({
    success: true,
    message:
      "Four CSV files validated successfully.",
    summary,
    files: validatedFiles,
  });
});

module.exports = router;