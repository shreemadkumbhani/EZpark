// Import required modules and models
const User = require("../models/User"); // User model for database operations
const bcrypt = require("bcryptjs"); // For hashing passwords
const jwt = require("jsonwebtoken"); // For creating JWT tokens
const crypto = require("crypto"); // For generating secure tokens
const JWT_SECRET = process.env.JWT_SECRET; // Secret key for JWT

// Register a new user
exports.register = async (req, res) => {
  try {
    // Get user details from request body
    const { name, email, phone, password } = req.body;
    // Basic validations
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }
    // Restrict to Gmail addresses only
    const emailRegex = /^[^\s@]+@gmail\.com$/i;
    if (!emailRegex.test(String(email).toLowerCase())) {
      return res
        .status(400)
        .json({ message: "Email must be a Gmail address (@gmail.com)" });
    }
    if (String(password).length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    if (phone && !/^\d{10}$/.test(String(phone))) {
      return res
        .status(400)
        .json({ message: "Phone number must be 10 digits" });
    }
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create new user in the database
    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    // Respond with success message and user info
    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (err) {
    // Handle errors
    res.status(500).json({ error: err.message });
  }
};

// Login a user and return a JWT token
exports.login = async (req, res) => {
  try {
    // Get email and password from request body
    const { email, password } = req.body;
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Compare provided password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Create JWT token with user id and role
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Respond with token and user info
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    // Handle errors
    res.status(500).json({ error: err.message });
  }
};

// Handle forgot password request and generate a reset link
exports.forgotPassword = async (req, res) => {
  try {
    // Get email from request body
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Find user by email
    const user = await User.findOne({ email });
    if (!user)
      // For security, always return same message
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link has been sent" });

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save token and expiry to user document
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 minutes
    await user.save();

    // In production, send email. For dev, return the URL.
    const baseUrl =
      process.env.FRONTEND_URL ||
      (req.headers.origin ? req.headers.origin : "http://localhost:5173");
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Log the reset URL for development
    console.log("Password reset URL:", resetUrl);
    return res.status(200).json({ message: "Reset link generated", resetUrl });
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Handle password reset using the token
exports.resetPassword = async (req, res) => {
  try {
    // Get token and new password from request body
    const { token, password } = req.body;
    if (!token || !password)
      return res
        .status(400)
        .json({ message: "Token and new password are required" });

    // Hash the token to compare with DB
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    // Find user with matching token and valid expiry
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    // Hash and update the new password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Respond with success message
    return res
      .status(200)
      .json({ message: "Password has been reset successfully" });
  } catch (err) {
    // Handle errors
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
