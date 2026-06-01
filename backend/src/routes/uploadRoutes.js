const express = require("express");
const { query } = require("express-validator");
const { uploadSalarySheet, listUploadLogs } = require("../controllers/uploadController");
const upload = require("../middleware/upload");
const { requireAdminAuth } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post("/upload-salary", requireAdminAuth, upload.single("file"), uploadSalarySheet);
router.get(
  "/upload-logs",
  requireAdminAuth,
  [query("limit").optional().isInt({ min: 1, max: 50 })],
  validateRequest,
  listUploadLogs
);

module.exports = router;
