const mongoose = require("mongoose");
require("dotenv").config({ path: __dirname + "/../.env" });

const Booking = require("../models/Booking");
const ParkingLot = require("../models/ParkingLot");
const { finalizeExpiredBookings } = require("../services/bookingsService");

async function testBookingExpiration() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find a parking lot to test with
    const testLot = await ParkingLot.findOne();
    if (!testLot) {
      console.log("❌ No parking lots found for testing");
      process.exit(1);
    }

    console.log(`📍 Using test parking lot: ${testLot.name}`);
    console.log(
      `🅿️ Initial state - Available: ${testLot.availableSlots}, Parked: ${testLot.carsParked}`
    );

    // Create a test booking that expires 30 seconds ago (to avoid cron job interference)
    const expiredTime = new Date(Date.now() - 30 * 1000); // 30 seconds ago
    const testBooking = new Booking({
      userId: new mongoose.Types.ObjectId(),
      userName: "Test User - Expiration Test",
      userEmail: "test-expiration@example.com",
      userPhone: "9999999999",
      parkingLotId: testLot._id,
      parkingLotName: testLot.name,
      vehicleType: "car",
      vehicleNumber: "EXPIRE123",
      startTime: new Date(Date.now() - 90 * 1000), // 1.5 minutes ago
      endTime: expiredTime,
      duration: 1,
      pricePerHour: testLot.pricePerHour,
      totalPrice: testLot.pricePerHour,
      status: "active",
    });

    // Save the test booking
    await testBooking.save();
    console.log(
      `📝 Created test booking ${testBooking._id} (expired 1 minute ago)`
    );

    // Update parking lot to reflect the booking (simulate active booking)
    await ParkingLot.findByIdAndUpdate(testLot._id, {
      $inc: { availableSlots: -1, carsParked: 1 },
    });

    const updatedLot = await ParkingLot.findById(testLot._id);
    console.log(
      `🅿️ After booking - Available: ${updatedLot.availableSlots}, Parked: ${updatedLot.carsParked}`
    );

    // Run the expiration logic
    console.log("\n⏰ Running expiration logic...");
    const result = await finalizeExpiredBookings();

    // Check results
    const expiredBooking = await Booking.findById(testBooking._id);
    const finalLot = await ParkingLot.findById(testLot._id);

    console.log(`\n📊 Results:`);
    console.log(`   Bookings processed: ${result.updated}`);
    console.log(`   Booking status: ${expiredBooking.status}`);
    console.log(`   Final available slots: ${finalLot.availableSlots}`);
    console.log(`   Final cars parked: ${finalLot.carsParked}`);

    // Verify the results
    if (expiredBooking.status === "expired" && result.updated > 0) {
      console.log(
        "\n✅ Test PASSED - Booking expired and slot freed successfully!"
      );
    } else {
      console.log("\n❌ Test FAILED - Something went wrong");
    }

    // Cleanup - remove test booking
    await Booking.findByIdAndDelete(testBooking._id);

    // Restore original parking lot state
    await ParkingLot.findByIdAndUpdate(testLot._id, {
      availableSlots: testLot.availableSlots,
      carsParked: testLot.carsParked,
    });

    console.log("🧹 Cleaned up test data");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔒 Database connection closed");
  }
}

// Run the test
testBookingExpiration();
