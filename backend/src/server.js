require("dotenv").config();
const app = require("./app");
const { ensureDatabaseConnection, explainConnectionError } = require("./config/db");

const port = Number(process.env.PORT || 5000);
const dbRetryIntervalMs = Number(process.env.DB_RETRY_INTERVAL_MS || 15000);

let dbRetryTimer = null;

async function verifyDatabaseConnection() {
  try {
    await ensureDatabaseConnection();
    console.log("Database connection established.");

    if (dbRetryTimer) {
      clearInterval(dbRetryTimer);
      dbRetryTimer = null;
    }
  } catch (error) {
    console.error("Database connection check failed.", error);
    console.error("Startup hint:", error.startupHint || explainConnectionError(error));

    if (!dbRetryTimer) {
      console.log(`Retrying database connection every ${dbRetryIntervalMs / 1000} seconds.`);
      dbRetryTimer = setInterval(async () => {
        try {
          await ensureDatabaseConnection();
          console.log("Database connection re-established.");
          clearInterval(dbRetryTimer);
          dbRetryTimer = null;
        } catch (retryError) {
          console.error("Database retry failed.", retryError.message);
          console.error("Startup hint:", retryError.startupHint || explainConnectionError(retryError));
        }
      }, dbRetryIntervalMs);
    }
  }
}

async function bootstrap() {
  try {
    app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });
    await verifyDatabaseConnection();
  } catch (error) {
    console.error("Failed to start server", error);
    if (error.startupHint || error.code) {
      console.error("Startup hint:", error.startupHint || explainConnectionError(error));
    }
    process.exit(1);
  }
}

bootstrap();
