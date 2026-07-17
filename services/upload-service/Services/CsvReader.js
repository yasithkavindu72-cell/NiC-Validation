const csv = require("csv-parser");
const { Readable } = require("stream");

function normalizeHeader(header) {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsvBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const rows = [];

    Readable.from([buffer])
      .pipe(
        csv({
          mapHeaders: ({ header }) =>
            normalizeHeader(header),
        })
      )
      .on("data", (row) => {
        rows.push(row);
      })
      .on("end", () => {
        resolve(rows);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

function findNicColumn(row) {
  const possibleColumnNames = [
    "nic",
    "nic_number",
    "nic_no",
    "national_identity_card",
    "national_identity_card_number",
  ];

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