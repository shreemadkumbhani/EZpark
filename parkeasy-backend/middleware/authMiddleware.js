const jwt = require("jsonwebtoken");
const User = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(403).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch fresh user to ensure latest role/state
    const user = await User.findById(decoded.id).select("role");
    if (!user) return res.status(401).json({ message: "User not found" });
    req.user = { id: decoded.id, role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
