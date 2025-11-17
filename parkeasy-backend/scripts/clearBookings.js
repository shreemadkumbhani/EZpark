// Script to delete all bookings and parking lots from the database
require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const ParkingLot = require("../models/ParkingLot");

const MONGO_URI = process.env.MONGO_URI;

async function clearAllData() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const bookingResult = await Booking.deleteMany({});
    console.log(`🗑️  Deleted ${bookingResult.deletedCount} bookings`);

    const parkingResult = await ParkingLot.deleteMany({});
    console.log(`🗑️  Deleted ${parkingResult.deletedCount} parking lots`);

    console.log("✅ All data cleared successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing data:", error);
    process.exit(1);
  }
}

clearAllData();
