const jwt = require("jsonwebtoken");

function signAdminToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h"
  });
}

function verifyAdminToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  signAdminToken,
  verifyAdminToken
};

