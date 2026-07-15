const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../Config/ProjectDB");

const router = express.Router();

/* ==============================
   VERIFY JWT TOKEN
============================== */

function verifyToken(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (
    !authorizationHeader ||
    !authorizationHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const token = authorizationHeader.split(" ")[1];

  try {
    const decodedUser = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decodedUser;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

/* ==============================
   DATABASE QUERY HELPER
============================== */

function runQuery(sql, values = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(results);
    });
  });
}

/* ==============================
   DASHBOARD OVERVIEW
============================== */

router.get("/overview", verifyToken, async (req, res) => {
  try {
    const statsSql = `
      SELECT
        COUNT(*) AS total_records,
        COALESCE(
          SUM(CASE WHEN status = 'Valid' THEN 1 ELSE 0 END),
          0
        ) AS valid_nics,
        COALESCE(
          SUM(CASE WHEN status = 'Invalid' THEN 1 ELSE 0 END),
          0
        ) AS invalid_nics
      FROM nic_records
    `;

    const filesSql = `
      SELECT COUNT(*) AS uploaded_files
      FROM uploaded_files
    `;

    const genderSql = `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN gender = 'Male'
              AND status = 'Valid'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS male,

        COALESCE(
          SUM(
            CASE
              WHEN gender = 'Female'
              AND status = 'Valid'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS female
      FROM nic_records
    `;

    const recentSql = `
      SELECT
        id,
        nic_number,
        date_of_birth,
        age,
        gender,
        status,
        error_message,
        created_at
      FROM nic_records
      ORDER BY created_at DESC
      LIMIT 8
    `;

    const [
      statsResult,
      filesResult,
      genderResult,
      recentRecords,
    ] = await Promise.all([
      runQuery(statsSql),
      runQuery(filesSql),
      runQuery(genderSql),
      runQuery(recentSql),
    ]);

    return res.status(200).json({
      success: true,

      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
      },

      stats: {
        totalRecords: Number(
          statsResult[0].total_records
        ),
        validNics: Number(
          statsResult[0].valid_nics
        ),
        invalidNics: Number(
          statsResult[0].invalid_nics
        ),
        uploadedFiles: Number(
          filesResult[0].uploaded_files
        ),
      },

      gender: {
        male: Number(genderResult[0].male),
        female: Number(genderResult[0].female),
      },

      recentRecords,
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard data",
    });
  }
});

module.exports = router;