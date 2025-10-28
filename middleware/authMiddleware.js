// Import required modules
const jwt = require("jsonwebtoken"); // For verifying JWT tokens
const User = require("../models/User"); // User model
const JWT_SECRET = process.env.JWT_SECRET; // Secret key for JWT

// Middleware to authenticate requests using JWT
module.exports = async (req, res, next) => {
  // Get the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(403).json({ message: "No token provided" });

  // Extract the token from the header (format: 'Bearer <token>')
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, JWT_SECRET);
    // Fetch the latest user info from the database to ensure up-to-date role
    const user = await User.findById(decoded.id).select("role vehicle");
    if (!user) return res.status(401).json({ message: "User not found" });
    // Attach user info to the request object
    req.user = { id: decoded.id, role: user.role, vehicle: user.vehicle };
    next(); // Continue to the next middleware or route handler
  } catch (err) {
    // If token is invalid or expired, return 401 error
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
