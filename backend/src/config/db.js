const { Pool } = require("pg");

const dbState = {
  connected: false,
  lastCheckedAt: null,
  lastError: null,
  startupHint: null
};

function resolveSslConfig() {
  if (process.env.PGSSLMODE === "disable" || process.env.DB_SSL === "false") {
    return false;
  }

  if (process.env.NODE_ENV === "production" || process.env.DB_SSL === "true") {
    return { rejectUnauthorized: false };
  }

  return false;
}

function hasPlaceholder(value) {
  return typeof value === "string" && /(\[YOUR-[^\]]+\]|change-this|replace-with|your-strong-password|your-long-random-secret)/i.test(value);
}

function buildPoolConfig() {
  const connectionString = process.env.DATABASE_URL?.trim();

  if (connectionString) {
    if (hasPlaceholder(connectionString)) {
      throw new Error(
        "DATABASE_URL still contains placeholder text. Replace it with your real Supabase or PostgreSQL connection string."
      );
    }

    return {
      connectionString,
      ssl: resolveSslConfig(),
      max: Number(process.env.DB_POOL_MAX || 10),
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 15000)
    };
  }

  const host = process.env.DB_HOST?.trim();
  const port = Number(process.env.DB_PORT || 5432);
  const database = process.env.DB_NAME?.trim() || "postgres";
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";

  if (host && user) {
    if (hasPlaceholder(password) || hasPlaceholder(user)) {
      throw new Error(
        "DB_USER or DB_PASSWORD still contains placeholder text. Replace them with your real database credentials."
      );
    }

    return {
      host,
      port,
      database,
      user,
      password,
      ssl: resolveSslConfig(),
      max: Number(process.env.DB_POOL_MAX || 10),
      idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT_MS || 30000),
      connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 15000)
    };
  }

  throw new Error(
    "Database configuration is missing. Set DATABASE_URL or provide DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD."
  );
}

const pool = new Pool(buildPoolConfig());

function explainConnectionError(error) {
  if (!error) {
    return "Unknown database startup error.";
  }

  if (error.code === "ENOTFOUND") {
    return "Database host was not found. Check the Supabase/Render hostname and make sure you copied the full connection string from the correct project.";
  }

  if (error.code === "28P01") {
    return "Database authentication failed. Verify the database username/password, and if your password contains special characters, prefer the exact URI copied from Supabase Connect.";
  }

  if (error.code === "ECONNREFUSED") {
    return "Database refused the connection. This usually means the host/port is wrong, the database is unreachable, or DATABASE_URL is missing and the app is falling back to localhost.";
  }

  if (String(error.message || "").includes("tenant/user")) {
    return "The database username and host do not belong to the same Supabase project. Copy the full Session Pooler URI from the same Supabase project's Connect dialog.";
  }

  return error.message;
}

async function query(text, params) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

async function ensureDatabaseConnection() {
  try {
    await pool.query("select 1");
    dbState.connected = true;
    dbState.lastCheckedAt = new Date().toISOString();
    dbState.lastError = null;
    dbState.startupHint = null;
  } catch (error) {
    dbState.connected = false;
    dbState.lastCheckedAt = new Date().toISOString();
    dbState.lastError = error.message;
    error.startupHint = explainConnectionError(error);
    dbState.startupHint = error.startupHint;
    throw error;
  }
}

function getDatabaseStatus() {
  return { ...dbState };
}

module.exports = {
  query,
  getClient,
  ensureDatabaseConnection,
  explainConnectionError,
  getDatabaseStatus
};
