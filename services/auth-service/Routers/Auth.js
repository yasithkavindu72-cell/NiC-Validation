const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/ProjectDB");

const router = express.Router();
const SALT_ROUNDS = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ==============================
   REGISTER
============================== */

router.post("/register", (req, res) => {
  const username = req.body.username?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Username, email and password are required",
    });
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address",
    });
  }

  if (username.length < 3) {
    return res.status(400).json({
      success: false,
      message: "Username must contain at least 3 characters",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must contain at least 8 characters",
    });
  }

  const checkSql = `
    SELECT id
    FROM users
    WHERE username = ? OR email = ?
    LIMIT 1
  `;

  db.query(
    checkSql,
    [username, email],
    async (checkError, existingUsers) => {
      if (checkError) {
        console.error("Check user error:", checkError);

        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      if (existingUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Username or email already exists",
        });
      }

      try {
        const passwordHash = await bcrypt.hash(
          password,
          SALT_ROUNDS
        );

        const insertSql = `
          INSERT INTO users
          (username, email, password_hash)
          VALUES (?, ?, ?)
        `;

        db.query(
          insertSql,
          [username, email, passwordHash],
          (insertError, result) => {
            if (insertError) {
              console.error(
                "Insert user error:",
                insertError
              );

              if (insertError.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                  success: false,
                  message:
                    "Username or email already exists",
                });
              }

              return res.status(500).json({
                success: false,
                message: "Registration failed",
              });
            }

            return res.status(201).json({
              success: true,
              message: "Registration Successful",
              user: {
                id: result.insertId,
                username,
                email,
                role: "user",
              },
            });
          }
        );
      } catch (hashError) {
        console.error(
          "Password hashing error:",
          hashError
        );

        return res.status(500).json({
          success: false,
          message: "Unable to secure password",
        });
      }
    }
  );
});

/* ==============================
   LOGIN
============================== */

router.post("/login", (req, res) => {
  const username = req.body.username?.trim();
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  const sql = `
    SELECT
      id,
      username,
      email,
      password_hash,
      role,
      is_active
    FROM users
    WHERE username = ?
    LIMIT 1
  `;

  db.query(sql, [username], async (error, users) => {
    if (error) {
      console.error("Login database error:", error);

      return res.status(500).json({
        success: false,
        message: "Database error",
      });
    }

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "Your account is disabled",
      });
    }

    try {
      const passwordMatches = await bcrypt.compare(
        password,
        user.password_hash
      );

      if (!passwordMatches) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        process.env.JWT_SECRET,
        {
          expiresIn:
            process.env.JWT_EXPIRES_IN || "2h",
        }
      );

      return res.status(200).json({
        success: true,
        message: "Login Successful",
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (compareError) {
      console.error(
        "Password comparison error:",
        compareError
      );

      return res.status(500).json({
        success: false,
        message: "Login failed",
      });
    }
  });
});

module.exports = router;  
