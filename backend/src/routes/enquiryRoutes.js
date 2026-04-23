const express = require("express");
const { body } = require("express-validator");
const { submitEnquiry } = require("../controllers/enquiryController");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/enquiry",
  [
    body("name").trim().isLength({ min: 2, max: 150 }),
    body("phone").trim().isLength({ min: 8, max: 30 }),
    body("email").trim().isEmail().isLength({ max: 150 })
  ],
  validateRequest,
  submitEnquiry
);

module.exports = router;

