// Import express and jsonwebtoken
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT token for protected routes
const authMiddleware = (req, res, next) => {
  // Get token from Authorization header
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

// GET /api/protected/dashboard
// Example protected route that returns a welcome message
router.get("/dashboard", authMiddleware, (req, res) => {
  res.json({ message: `Welcome to your dashboard, user ID: ${req.user.id}` });
});

// Export the router
module.exports = router;
