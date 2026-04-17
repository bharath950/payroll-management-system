const ApiError = require("../utils/apiError");
const { verifyAdminToken } = require("../utils/jwt");

function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const token = header.slice(7).trim();

  try {
    req.admin = verifyAdminToken(token);
    return next();
  } catch {
    return next(new ApiError(401, "Invalid or expired session"));
  }
}

module.exports = {
  requireAdminAuth
};

