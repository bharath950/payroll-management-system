const express = require("express");
const { body } = require("express-validator");
const { login, me } = require("../controllers/authController");
const validateRequest = require("../middleware/validateRequest");
const { requireAdminAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/auth/login",
  [
    body("username").trim().isLength({ min: 3, max: 50 }),
    body("password").isLength({ min: 8, max: 100 })
  ],
  validateRequest,
  login
);

router.get("/auth/me", requireAdminAuth, me);

module.exports = router;

