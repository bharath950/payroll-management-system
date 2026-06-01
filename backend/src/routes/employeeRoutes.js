const express = require("express");
const { param } = require("express-validator");
const { getEmployee } = require("../controllers/employeeController");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.get(
  "/employee/:code",
  [param("code").trim().isLength({ min: 2, max: 50 }).matches(/^[a-zA-Z0-9_-]+$/)],
  validateRequest,
  getEmployee
);

module.exports = router;

