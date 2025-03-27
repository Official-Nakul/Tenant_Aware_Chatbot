require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const rateLimit = require("express-rate-limit");

const app = express();

// ================
// Configuration
// ================
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "your-strong-secret-key-here";
const TOKEN_EXPIRY = "1h";

// Rate limiting for auth endpoints
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 20, // Limit each IP to 20 requests per windowMs
//   message: "Too many requests, please try again later",
// });

// ================
// Middleware
// ================
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to auth routes
// app.use("/auth", authLimiter);

// ================
// Database Setup
// ================
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_URI,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

// Test database connection
pool.query("SELECT NOW()", (err) => {
  if (err) {
    console.error("Database connection error:", err.stack);
  } else {
    console.log("Database connected successfully");
  }
});

// ================
// Utility Functions
// ================
const createToken = (user) => {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// ================
// Authentication Middleware
// ================
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Authorization token required",
    });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }

  try {
    const user = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [decoded.id]
    );

    if (!user.rows.length) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    req.user = user.rows[0];
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// ================
// Routes
// ================

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// User Registration
app.post("/auth/signup", async (req, res) => {
  const { username, email, password } = req.body;

  // Validation
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "All fields are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 6 characters",
    });
  }

  try {
    // Check for existing user
    const userExists = await pool.query(
      `SELECT 1 FROM users WHERE username = $1 OR email = $2 LIMIT 1`,
      [username, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "Username or email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, hashedPassword]
    );

    // Generate JWT token
    const token = createToken(newUser.rows[0]);

    res.status(201).json({
      success: true,
      user: newUser.rows[0],
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        error: "Username or email already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// User Login
app.post("/auth/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find user
    const user = await pool.query(
      `SELECT id, username, email, password 
       FROM users WHERE email = $1`,
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.rows[0].id,
        email: user.rows[0].email,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return user data (excluding password)
    const { password: _, ...userData } = user.rows[0];
    res.status(200).json({
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Protected Route Example
app.get("/api/protected", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Access granted to protected route",
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// ================
// Existing API Endpoints (from your original code)
// ================
app.post("/api/add", authenticate, async (req, res) => {
  const { apiData, endpoints } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Process API headers
    let headersObject = apiData.headers;
    if (Array.isArray(apiData.headers)) {
      headersObject = apiData.headers.reduce((acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      }, {});
    } else if (typeof apiData.headers === "string") {
      try {
        headersObject = JSON.parse(apiData.headers);
      } catch (e) {
        console.error("Error parsing headers:", e);
        headersObject = {};
      }
    }

    // Insert API data
    const apiRes = await client.query(
      `INSERT INTO apis (
        company_name, base_url, purpose, 
        api_key, headers, auth_type
       ) VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [
        apiData.companyName,
        apiData.baseUrl,
        apiData.purpose || "",
        apiData.apiKey,
        headersObject,
        apiData.authType || "",
      ]
    );
    const apiId = apiRes.rows[0].id;

    // Insert endpoints
    for (const endpoint of endpoints) {
      let endpointHeadersObject = endpoint.headers;
      if (Array.isArray(endpoint.headers)) {
        endpointHeadersObject = endpoint.headers.reduce((acc, header) => {
          if (header.key && header.value) {
            acc[header.key] = header.value;
          }
          return acc;
        }, {});
      }

      let paramsObject = endpoint.params || {};
      if (Array.isArray(endpoint.parameters)) {
        paramsObject = endpoint.parameters.reduce((acc, param) => {
          if (param.name) {
            acc[param.name] = {
              type: param.type || "string",
              required: param.requirement === "required",
            };
          }
          return acc;
        }, {});
      }

      await client.query(
        `INSERT INTO endpoints (
          api_id, path, method, purpose, params, headers
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          apiId,
          endpoint.path,
          endpoint.method,
          endpoint.purpose || "",
          paramsObject,
          endpointHeadersObject,
        ]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({
      success: true,
      apiId,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("API creation error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    client.release();
  }
});

app.get("/api/all", authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        apis.id,
        apis.company_name,
        apis.base_url,
        apis.purpose,
        apis.api_key,
        apis.headers,
        apis.auth_type,
        apis.created_at,
        apis.updated_at,
        json_agg(
          json_build_object(
            'id', endpoints.id,
            'path', endpoints.path,
            'method', endpoints.method,
            'purpose', endpoints.purpose,
            'params', endpoints.params,
            'headers', endpoints.headers,
            'created_at', endpoints.created_at,
            'updated_at', endpoints.updated_at
          )
        ) AS endpoints
      FROM apis
      LEFT JOIN endpoints ON apis.id = endpoints.api_id
      GROUP BY apis.id
    `);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching APIs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch APIs",
    });
  }
});

// ================
// Error Handling
// ================
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ================
// Server Initialization
// ================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
