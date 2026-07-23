const db = require("../Config/ProjectDB");

async function initializeUploadSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS upload_batches (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      total_files INT UNSIGNED NOT NULL,
      total_records INT UNSIGNED NOT NULL,
      valid_records INT UNSIGNED NOT NULL DEFAULT 0,
      invalid_records INT UNSIGNED NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      original_name VARCHAR(255) NOT NULL,
      total_records INT NOT NULL DEFAULT 0,
      uploaded_by INT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_uploaded_files_user (uploaded_by),
      CONSTRAINT fk_uploaded_files_user
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
        ON DELETE SET NULL
    ) ENGINE=InnoDB
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS nic_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nic_number VARCHAR(20) NOT NULL,
      date_of_birth DATE NULL,
      age INT NULL,
      gender ENUM('Male', 'Female', 'Unknown') NOT NULL DEFAULT 'Unknown',
      status ENUM('Valid', 'Invalid') NOT NULL,
      error_message VARCHAR(255) NULL,
      file_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_nic_records_file (file_id),
      INDEX idx_nic_records_status (status),
      INDEX idx_nic_records_created (created_at),
      CONSTRAINT fk_nic_records_file
        FOREIGN KEY (file_id) REFERENCES uploaded_files(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
}

async function saveValidatedUpload({ validatedFiles, summary }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [batchResult] = await connection.execute(
      `INSERT INTO upload_batches
        (total_files, total_records, valid_records, invalid_records)
       VALUES (?, ?, ?, ?)`,
      [
        validatedFiles.length,
        summary.totalRecords,
        summary.validRecords,
        summary.invalidRecords,
      ]
    );

    for (let fileIndex = 0; fileIndex < validatedFiles.length; fileIndex += 1) {
      const validatedFile = validatedFiles[fileIndex];
      const [fileResult] = await connection.execute(
        `INSERT INTO uploaded_files
          (original_name, total_records, uploaded_by)
         VALUES (?, ?, ?)`,
        [
          validatedFile.fileName,
          validatedFile.rowCount,
          null,
        ]
      );

      if (validatedFile.records.length > 0) {
        const recordValues = validatedFile.records.map((record) => [
          record.nic,
          record.dateOfBirth,
          record.age,
          record.gender || "Unknown",
          record.isValid ? "Valid" : "Invalid",
          record.errorMessage,
          fileResult.insertId,
        ]);

        await connection.query(
          `INSERT INTO nic_records
            (nic_number, date_of_birth, age, gender,
             status, error_message, file_id)
           VALUES ?`,
          [recordValues]
        );
      }
    }

    await connection.commit();
    return batchResult.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function findExistingFileNames(fileNames) {
  if (!Array.isArray(fileNames) || fileNames.length === 0) {
    return [];
  }

  const placeholders = fileNames.map(() => "?").join(", ");
  const [rows] = await db.query(
    `SELECT DISTINCT original_name
     FROM uploaded_files
     WHERE original_name IN (${placeholders})`,
    fileNames
  );

  return rows.map((row) => row.original_name);
}

module.exports = {
  initializeUploadSchema,
  findExistingFileNames,
  saveValidatedUpload,
};
