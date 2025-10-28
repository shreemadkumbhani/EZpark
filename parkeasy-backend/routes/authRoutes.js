// Import express and authentication controller functions
const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const router = express.Router();

// Route to register a new user
router.post("/register", register);
// Route to login a user
router.post("/login", login);
// Route to request a password reset link
router.post("/forgot-password", forgotPassword);
// Route to reset password using a token
router.post("/reset-password", resetPassword);

// Export the router
module.exports = router;
