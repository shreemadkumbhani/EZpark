// Booking scheduler service for automatic status updates and slot restoration
const cron = require("node-cron");
const Booking = require("../models/Booking");
const ParkingLot = require("../models/ParkingLot");

/**
 * Auto-complete expired bookings and restore parking slots
 * Runs every 5 minutes
 */
function startBookingScheduler() {
  // Run every 5 minutes: */5 * * * *
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();
      
      // Find all active bookings that have passed their endTime
      const expiredBookings = await Booking.find({
        status: "active",
        endTime: { $lte: now },
      });

      if (expiredBookings.length === 0) {
        return;
      }

      console.log(`[Scheduler] Found ${expiredBookings.length} expired bookings to complete`);

      // Update each booking to completed status
      for (const booking of expiredBookings) {
        try {
          // Update booking status
          booking.status = "completed";
          await booking.save();

          // Restore parking lot slot
          await ParkingLot.findByIdAndUpdate(booking.parkingLotId, {
            $inc: { availableSlots: 1, carsParked: -1 },
          });

          console.log(`[Scheduler] Completed booking ${booking._id} and restored slot for lot ${booking.parkingLotId}`);
        } catch (err) {
          console.error(`[Scheduler] Error processing booking ${booking._id}:`, err.message);
        }
      }

      console.log(`[Scheduler] Successfully processed ${expiredBookings.length} bookings`);
    } catch (error) {
      console.error("[Scheduler] Error in booking scheduler:", error.message);
    }
  });

  console.log("✅ Booking scheduler started - running every 5 minutes");
}

module.exports = { startBookingScheduler };
