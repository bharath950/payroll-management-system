const db = require("../config/db");

async function createUploadLog(log, client = db) {
  const result = await client.query(
    `
      insert into upload_logs (file_name, total_rows, success_count, failure_count, status, error_summary)
      values ($1, $2, $3, $4, $5, $6)
      returning *
    `,
    [
      log.fileName,
      log.totalRows,
      log.successCount,
      log.failureCount,
      log.status,
      JSON.stringify(log.errorSummary || [])
    ]
  );

  return result.rows[0];
}

async function getRecentUploadLogs(limit = 10) {
  const result = await db.query(
    `
      select *
      from upload_logs
      order by created_at desc
      limit $1
    `,
    [limit]
  );

  return result.rows;
}

module.exports = {
  createUploadLog,
  getRecentUploadLogs
};
