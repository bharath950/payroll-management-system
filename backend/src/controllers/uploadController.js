const fs = require("fs");
const db = require("../config/db");
const { parseSalaryWorkbook } = require("../services/excelService");
const { upsertEmployee } = require("../models/employeeModel");
const { upsertSalary } = require("../models/salaryModel");
const { createUploadLog, getRecentUploadLogs } = require("../models/uploadLogModel");

async function uploadSalarySheet(req, res, next) {
  let client;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required" });
    }

    client = await db.getClient();
    const { validRows, invalidRows, totalRows } = parseSalaryWorkbook(req.file.path);
    let successCount = 0;

    await client.query("begin");

    for (const row of validRows) {
      await upsertEmployee(row, client);
      await upsertSalary(row, client);
      successCount += 1;
    }

    const log = await createUploadLog(
      {
        fileName: req.file.originalname,
        totalRows,
        successCount,
        failureCount: invalidRows.length,
        status: invalidRows.length ? "completed_with_errors" : "completed",
        errorSummary: invalidRows
      },
      client
    );

    await client.query("commit");

    return res.status(201).json({
      message: "Salary data uploaded successfully",
      log
    });
  } catch (error) {
    if (client) {
      await client.query("rollback");
    }
    return next(error);
  } finally {
    if (client) {
      client.release();
    }
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
}

async function listUploadLogs(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const logs = await getRecentUploadLogs(limit);
    return res.json(logs);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadSalarySheet,
  listUploadLogs
};
