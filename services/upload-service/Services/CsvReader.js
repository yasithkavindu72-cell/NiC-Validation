const csv = require("csv-parser");
const { Readable } = require("stream");

// Converts CSV headings into consistent object keys.
// Example: "NIC Number" becomes "nic_number".
function normalizeHeader(header) {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Reads an uploaded CSV buffer and converts every record into an object.
// The promise resolves with all parsed rows, or rejects if parsing fails.
function parseCsvBuffer(buffer) {
  return new Promise((resolve, reject) => {
    // Store each successfully parsed CSV row.
    const rows = [];

    // Convert the buffer into a readable stream for csv-parser.
    Readable.from([buffer])
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            normalizeHeader(header),
        })
      )
      .on("data", (row) => {
        // Add each parsed record to the result collection.
        rows.push(row);
      })
      .on("end", () => {
        // Return all records after the complete CSV has been read.
        resolve(rows);
      })
      .on("error", (error) => {
        // Pass CSV or stream errors to the caller.
        reject(error);
      });
  });
}

// Finds the NIC field even when the CSV uses a supported alternative heading.
function findNicColumn(row) {
  // All names are normalized, so headings use lowercase letters and underscores.
  const possibleColumnNames = [
    "nic",
    "nic_number",
    "nic_no",
    "national_identity_card",
    "national_identity_card_number",
  ];

  // Return the first supported heading that exists in the row.
  // This only locates the NIC column; it does not validate the NIC value.
  return possibleColumnNames.find((columnName) =>
    Object.prototype.hasOwnProperty.call(
      row,
      columnName
    )
  );
}

module.exports = {
  parseCsvBuffer,
  findNicColumn,
};
