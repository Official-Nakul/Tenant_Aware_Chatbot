const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Enable CORS for specific origins
const allowedOrigins = [
  "https://tenant-aware-chatbot-ebl5dzn0v-official-nakuls-projects.vercel.app",
  "http://localhost:3000", // Add localhost for development
];

app.use(
  cors({
    origin: true, // Allows any origin dynamically
    credentials: true,
  })
);

app.use(express.json());

// Replace with your Neon database connection string
const pool = new Pool({
  connectionString: process.env.NEON_CONNECTION_URI,
});

// Create API and endpoints in the database
app.post("/api/add", async (req, res) => {
  const { apiData, endpoints } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert API data
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
        apiData.purpose,
        apiData.apiKey,
        apiData.headers,
        apiData.authType,
      ]
    );
    const apiId = apiRes.rows[0].id;

    // Insert endpoints
    for (let endpoint of endpoints) {
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
          endpoint.purpose,
          endpoint.params,
          endpoint.headers,
        ]
      );
    }

    await client.query("COMMIT");
    res.status(201).send("API added successfully");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error:", e);
    res.status(500).send("Failed to add API");
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

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
