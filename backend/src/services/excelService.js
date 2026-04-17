const XLSX = require("xlsx");
const ApiError = require("../utils/apiError");
const { parsePayrollMonth } = require("../utils/date");

const REQUIRED_COLUMNS = [
  "EmployeeCode",
  "Name",
  "Basic",
  "HRA",
  "Allowances",
  "Deductions",
  "NetSalary",
  "Month"
];

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function parseSalaryWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  if (!rows.length) {
    throw new ApiError(400, "Excel file is empty");
  }

  const headers = Object.keys(rows[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));

  if (missingColumns.length) {
    throw new ApiError(400, "Missing required columns", missingColumns);
  }

  const validRows = [];
  const invalidRows = [];
  const seenPayrollRows = new Set();

  rows.forEach((row, index) => {
    const monthData = parsePayrollMonth(String(row.Month).trim());
    const payload = {
      employeeCode: String(row.EmployeeCode || "").trim().toUpperCase(),
      name: String(row.Name || "").trim(),
      basic: normalizeNumber(row.Basic),
      hra: normalizeNumber(row.HRA),
      allowances: normalizeNumber(row.Allowances),
      deductions: normalizeNumber(row.Deductions),
      netSalary: normalizeNumber(row.NetSalary),
      month: monthData?.month,
      year: monthData?.year,
      department: row.Department ? String(row.Department).trim() : null,
      designation: row.Designation ? String(row.Designation).trim() : null,
      bankDetails: row.BankDetails ? String(row.BankDetails).trim() : null
    };

    const errors = [];

    if (!payload.employeeCode) errors.push("EmployeeCode is required");
    if (!payload.name) errors.push("Name is required");
    if (!monthData) errors.push("Month must be in YYYY-MM or Month YYYY format");

    ["basic", "hra", "allowances", "deductions", "netSalary"].forEach((field) => {
      if (Number.isNaN(payload[field])) {
        errors.push(`${field} must be a valid number`);
      }

      if (!Number.isNaN(payload[field]) && payload[field] < 0) {
        errors.push(`${field} cannot be negative`);
      }
    });

    if (
      !Number.isNaN(payload.basic) &&
      !Number.isNaN(payload.hra) &&
      !Number.isNaN(payload.allowances) &&
      !Number.isNaN(payload.deductions) &&
      !Number.isNaN(payload.netSalary)
    ) {
      const calculatedNetSalary = payload.basic + payload.hra + payload.allowances - payload.deductions;
      if (Math.abs(calculatedNetSalary - payload.netSalary) > 0.01) {
        errors.push("NetSalary must equal Basic + HRA + Allowances - Deductions");
      }
    }

    if (monthData && payload.employeeCode) {
      const dedupeKey = `${payload.employeeCode}-${payload.year}-${payload.month}`;
      if (seenPayrollRows.has(dedupeKey)) {
        errors.push("Duplicate EmployeeCode and Month combination found in file");
      } else {
        seenPayrollRows.add(dedupeKey);
      }
    }

    if (errors.length) {
      invalidRows.push({
        rowNumber: index + 2,
        employeeCode: payload.employeeCode || null,
        errors
      });
      return;
    }

    validRows.push(payload);
  });

  return {
    validRows,
    invalidRows,
    totalRows: rows.length
  };
}

module.exports = {
  parseSalaryWorkbook
};
