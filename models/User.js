// Import mongoose for MongoDB object modeling
const mongoose = require("mongoose");

// Define the schema for a User
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // User's name
    email: { type: String, required: true, unique: true }, // User's email (must be unique)
    phone: { type: String }, // User's phone number (optional)
    password: { type: String, required: true }, // Hashed password
    role: { type: String, enum: ["user", "owner", "admin"], default: "user" }, // Role of the user
    // Fields for password reset functionality
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true } // Automatically add createdAt and updatedAt fields
);

// Export the User model
module.exports = mongoose.model("User", userSchema);
