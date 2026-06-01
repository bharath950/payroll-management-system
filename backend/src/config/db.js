const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

async function query(text, params) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

async function ensureDatabaseConnection() {
  await pool.query("select 1");
}

module.exports = {
  query,
  getClient,
  ensureDatabaseConnection
};

