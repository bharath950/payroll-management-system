const { findEmployeeByCode } = require("../models/employeeModel");

async function getEmployee(req, res, next) {
  try {
    const employee = await findEmployeeByCode(req.params.code.toUpperCase());

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    return res.json(employee);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getEmployee
};

