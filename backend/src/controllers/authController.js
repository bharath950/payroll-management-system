const { signAdminToken } = require("../utils/jwt");

function login(req, res) {
  const { username, password } = req.body;

  if (
    !process.env.ADMIN_USERNAME ||
    !process.env.ADMIN_PASSWORD ||
    !process.env.JWT_SECRET
  ) {
    return res.status(500).json({
      message: "Admin authentication is not configured on the server."
    });
  }

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = signAdminToken({
    role: "admin",
    username: process.env.ADMIN_USERNAME
  });

  return res.json({
    message: "Login successful",
    token,
    admin: {
      username: process.env.ADMIN_USERNAME,
      role: "admin"
    }
  });
}

function me(req, res) {
  return res.json({
    admin: {
      username: req.admin.username,
      role: req.admin.role
    }
  });
}

module.exports = {
  login,
  me
};

