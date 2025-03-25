const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Enable CORS for specific origins
const allowedOrigins = ["*"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());

// Replace with your Neon database connection string
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_URI,
});

/*
Database Schema:
---------------
CREATE TABLE apis (
    id SERIAL PRIMARY KEY,
    company_name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    purpose TEXT,
    api_key TEXT NOT NULL,
    headers JSON, 
    auth_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

CREATE TABLE endpoints (
    id SERIAL PRIMARY KEY,
    api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    method TEXT NOT NULL,
    purpose TEXT,
    params JSON,
    headers JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/

// Create API and endpoints in the database
app.post("/api/add", async (req, res) => {
  const { apiData, endpoints } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Process API headers from array to object if needed
    let headersObject = apiData.headers;
    if (Array.isArray(apiData.headers)) {
      headersObject = apiData.headers.reduce((acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      }, {});
    } else if (typeof apiData.headers === "string") {
      // Try to parse if it's a JSON string
      try {
        headersObject = JSON.parse(apiData.headers);
      } catch (e) {
        console.error("Error parsing headers JSON string:", e);
        headersObject = {};
      }
    }

    // Insert API data, ensuring all fields match the database schema
    const apiRes = await client.query(
      `
      INSERT INTO apis (
        company_name, 
        base_url, 
        purpose, 
        api_key, 
        headers, 
        auth_type
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id
      `,
      [
        apiData.companyName,
        apiData.baseUrl,
        apiData.purpose || "", // Default to empty string if null
        apiData.apiKey,
        headersObject,
        apiData.authType || "", // Default to empty string if null
      ]
    );
    const apiId = apiRes.rows[0].id;

    // Insert endpoints
    for (let endpoint of endpoints) {
      // Process endpoint headers from array to object if needed
      let endpointHeadersObject = endpoint.headers;
      if (Array.isArray(endpoint.headers)) {
        endpointHeadersObject = endpoint.headers.reduce((acc, header) => {
          if (header.key && header.value) {
            acc[header.key] = header.value;
          }
          return acc;
        }, {});
      }

      // Process parameters for storage
      let paramsObject = endpoint.params || {};

      // If we have parameters array from the new UI, convert to appropriate format
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
        `
        INSERT INTO endpoints (
          api_id, 
          path, 
          method, 
          purpose, 
          params, 
          headers
        ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          apiId,
          endpoint.path,
          endpoint.method,
          endpoint.purpose || "", // Default to empty string if null
          paramsObject,
          endpointHeadersObject,
        ]
      );
    }

    await client.query("COMMIT");
    res.status(201).send({ success: true, apiId: apiId });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error:", e);
    res.status(500).send({ success: false, error: e.message });
  } finally {
    client.release();
  }
});

// Get all APIs
app.get("/api/all", async (req, res) => {
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

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching APIs:", error);
    res.status(500).send("Failed to fetch APIs");
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", message: "Backend server is running" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
