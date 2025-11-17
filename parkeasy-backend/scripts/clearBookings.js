// Script to delete all bookings from the database
require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");

const MONGO_URI = process.env.MONGO_URI;

async function clearAllBookings() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const result = await Booking.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} bookings`);

    console.log("✅ All bookings cleared successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing bookings:", error);
    process.exit(1);
  }
}

clearAllBookings();
