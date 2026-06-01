const express = require("express");
const { param } = require("express-validator");
const { getSalary, getSalarySlip } = require("../controllers/salaryController");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

const routeValidators = [
  param("code").trim().isLength({ min: 2, max: 50 }).matches(/^[a-zA-Z0-9_-]+$/),
  param("month").trim().isLength({ min: 7, max: 20 })
];

router.get("/salary/:code/:month", routeValidators, validateRequest, getSalary);
router.get("/salary-slip/:code/:month", routeValidators, validateRequest, getSalarySlip);

module.exports = router;

