const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());

NEON_CONNECTION_URI = process.env.NEON_CONNECTION_URI;
// Replace with your Neon database connection string
const pool = new Pool({
  connectionString: NEON_CONNECTION_URI,
});

// Create API and endpoints in the database
app.post("/api/add", async (req, res) => {
  const { apiData, endpoints } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert API data
    const apiRes = await client.query(
      "INSERT INTO apis(company_name, base_url, purpose, api_key) VALUES($1, $2, $3, $4) RETURNING id",
      [apiData.companyName, apiData.baseUrl, apiData.purpose, apiData.apiKey]
    );
    const apiId = apiRes.rows[0].id;

    // Insert endpoints
    for (let endpoint of endpoints) {
      await client.query(
        "INSERT INTO endpoints(api_id, path, method, purpose, params) VALUES($1, $2, $3, $4, $5)",
        [
          apiId,
          endpoint.path,
          endpoint.method,
          endpoint.purpose,
          endpoint.params,
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
        json_agg(
          json_build_object(
            'id', endpoints.id,
            'path', endpoints.path,
            'method', endpoints.method,
            'purpose', endpoints.purpose,
            'params', endpoints.params
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
