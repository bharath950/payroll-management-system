const { findSalaryByEmployeeAndMonth } = require("../models/salaryModel");
const { parsePayrollMonth } = require("../utils/date");
const { buildSalarySlipPdf } = require("../services/pdfService");

async function getSalary(req, res, next) {
  try {
    const employeeCode = req.params.code.toUpperCase();
    const parsedMonth = parsePayrollMonth(req.params.month);

    if (!parsedMonth) {
      return res.status(400).json({ message: "Month must be in YYYY-MM format" });
    }

    const salary = await findSalaryByEmployeeAndMonth(
      employeeCode,
      parsedMonth.month,
      parsedMonth.year
    );

    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" });
    }

    return res.json(salary);
  } catch (error) {
    return next(error);
  }
}

async function getSalarySlip(req, res, next) {
  try {
    const employeeCode = req.params.code.toUpperCase();
    const parsedMonth = parsePayrollMonth(req.params.month);

    if (!parsedMonth) {
      return res.status(400).json({ message: "Month must be in YYYY-MM format" });
    }

    const salary = await findSalaryByEmployeeAndMonth(
      employeeCode,
      parsedMonth.month,
      parsedMonth.year
    );

    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" });
    }

    await buildSalarySlipPdf(res, salary);
    return;
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getSalary,
  getSalarySlip
};
