// services/bookingsService.js - MongoDB-based booking storage
const Booking = require("../models/Booking");
const ParkingLot = require("../models/ParkingLot");

/**
 * Create a new booking
 */
async function createBooking(bookingData) {
  try {
    // Defensive normalization so callers can pass minimal data
    const data = { ...bookingData };

    // Normalize status to lowercase and default to active
    if (data.status) {
      data.status = String(data.status).toLowerCase();
    }
    const validStatuses = ["active", "completed", "cancelled", "expired"];
    if (!data.status || !validStatuses.includes(data.status)) {
      data.status = "active";
    }

    // Ensure we have a lot and hydrate related fields
    let lot = null;
    if (data.parkingLotId) {
      lot = await ParkingLot.findById(data.parkingLotId);
    }
    if (!lot) {
      throw new Error("Parking lot not found");
    }
    if (!data.parkingLotName) data.parkingLotName = lot.name;

    // Ensure user metadata is present if userId provided
    if ((!data.userName || !data.userEmail || !data.userPhone) && data.userId) {
      try {
        const User = require("../models/User");
        const user = await User.findById(data.userId);
        if (user) {
          data.userName = data.userName || user.name || "Unknown";
          data.userEmail = data.userEmail || user.email || "";
          data.userPhone = data.userPhone || user.phone || "";
        }
      } catch {}
    }

    // Timing & pricing
    const now = new Date();
    if (!data.startTime) data.startTime = now;
    if (!data.duration && data.startTime && data.endTime) {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      data.duration = Math.max(
        0.5,
        Math.ceil((end - start) / (1000 * 60 * 60))
      );
    }
    if (!data.duration) data.duration = 1;
    if (!data.endTime) {
      data.endTime = new Date(
        new Date(data.startTime).getTime() + data.duration * 3600000
      );
    }

    if (data.pricePerHour == null) {
      data.pricePerHour = lot.pricePerHour || 50;
    }
    if (data.totalPrice == null) {
      data.totalPrice = Number(data.pricePerHour) * Number(data.duration);
    }

    const booking = new Booking(data);
    await booking.save();

    // Update parking lot availability
    await ParkingLot.findByIdAndUpdate(data.parkingLotId, {
      $inc: { availableSlots: -1, carsParked: 1 },
    });

    return booking;
  } catch (error) {
    throw new Error(`Failed to create booking: ${error.message}`);
  }
}

/**
 * Get all bookings (admin only, with pagination)
 */
async function getAllBookings(page = 1, limit = 50) {
  try {
    const skip = (page - 1) * limit;
    const bookings = await Booking.find()
      .populate("userId", "name email phone")
      .populate("parkingLotId", "name address city")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Booking.countDocuments();

    return {
      bookings,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }
}

/**
 * Get bookings for a specific user
 */
async function getBookingsByUser(userId, status = null) {
  try {
    const query = { userId };
    if (status) {
      query.status = status;
    }
    const bookings = await Booking.find(query)
      .populate(
        "parkingLotId",
        "name address city location pricePerHour availableSlots totalSlots"
      )
      .sort({ createdAt: -1 });
    return bookings;
  } catch (error) {
    throw new Error(`Failed to fetch user bookings: ${error.message}`);
  }
}

/**
 * Get bookings for a specific parking lot
 */
async function getBookingsByParkingLot(parkingLotId, status = null) {
  try {
    const query = { parkingLotId };
    if (status) {
      query.status = status;
    }
    const bookings = await Booking.find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 });
    return bookings;
  } catch (error) {
    throw new Error(`Failed to fetch parking lot bookings: ${error.message}`);
  }
}

/**
 * Get bookings for multiple parking lots (for owner dashboard)
 */
async function getBookingsForLots(lotIds) {
  try {
    if (!Array.isArray(lotIds) || lotIds.length === 0) return [];
    const bookings = await Booking.find({ parkingLotId: { $in: lotIds } })
      .populate("userId", "name email phone")
      .populate("parkingLotId", "name address")
      .sort({ createdAt: -1 });
    return bookings;
  } catch (error) {
    throw new Error(`Failed to fetch bookings for lots: ${error.message}`);
  }
}

/**
 * Get booking by ID
 */
async function getBookingById(bookingId) {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("userId", "name email phone")
      .populate("parkingLotId", "name address city location pricePerHour");
    return booking;
  } catch (error) {
    throw new Error(`Failed to fetch booking: ${error.message}`);
  }
}

/**
 * Update booking status
 */
async function updateBookingStatus(bookingId, status, userId = null) {
  try {
    const query = { _id: bookingId };
    if (userId) {
      query.userId = userId;
    }
    const booking = await Booking.findOneAndUpdate(
      query,
      { status },
      { new: true }
    ).populate("parkingLotId", "name address");
    return booking;
  } catch (error) {
    throw new Error(`Failed to update booking: ${error.message}`);
  }
}

/**
 * Cancel a booking
 */
async function cancelBooking(bookingId, userId) {
  try {
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      throw new Error("Booking not found");
    }

    booking.status = "cancelled";
    await booking.save();

    // Restore parking lot availability
    await ParkingLot.findByIdAndUpdate(booking.parkingLotId, {
      $inc: { availableSlots: 1, carsParked: -1 },
    });

    return booking;
  } catch (error) {
    throw new Error(`Failed to cancel booking: ${error.message}`);
  }
}

/**
 * Get active bookings for a parking lot (for availability calculation)
 */
async function getActiveBookingsForLot(parkingLotId) {
  try {
    const bookings = await Booking.find({
      parkingLotId,
      status: "active",
      endTime: { $gte: new Date() },
    });
    return bookings;
  } catch (error) {
    throw new Error(`Failed to fetch active bookings: ${error.message}`);
  }
}

/**
 * Get booking statistics for owner
 */
async function getOwnerStats(lotIds) {
  try {
    const stats = await Booking.aggregate([
      { $match: { parkingLotId: { $in: lotIds } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
    ]);

    const totalBookings = await Booking.countDocuments({
      parkingLotId: { $in: lotIds },
    });

    return {
      stats,
      totalBookings,
    };
  } catch (error) {
    throw new Error(`Failed to fetch owner stats: ${error.message}`);
  }
}

/**
 * Automatically marks active bookings as expired when their endTime has passed
 * and frees up parking lot slots by replenishing availability.
 */
async function finalizeExpiredBookings() {
  const now = new Date();
  console.log(`🔍 Checking for expired bookings at ${now.toISOString()}`);

  // Find active bookings that ended in the past
  const expiredBookings = await Booking.find({
    status: "active",
    endTime: { $lte: now },
  }).populate("parkingLotId", "name");

  if (!expiredBookings.length) {
    console.log("📊 No expired bookings found");
    return { updated: 0 };
  }

  console.log(`⏰ Found ${expiredBookings.length} expired bookings to process`);
  let updated = 0;
  let errors = 0;

  for (const booking of expiredBookings) {
    try {
      // Mark as expired
      booking.status = "expired";
      await booking.save();

      // Free up the parking slot by incrementing available slots and decrementing cars parked
      await ParkingLot.findByIdAndUpdate(booking.parkingLotId, {
        $inc: { availableSlots: 1, carsParked: -1 },
      });

      console.log(
        `✅ Expired booking ${booking._id} for ${booking.parkingLotName} - slot freed`
      );
      updated += 1;
    } catch (error) {
      console.error(
        `❌ Error processing expired booking ${booking._id}:`,
        error.message
      );
      errors += 1;
      // Continue processing other bookings
    }
  }

  console.log(`🎉 Processed ${updated} expired bookings, ${errors} errors`);
  return { updated, errors };
}

// Legacy function for compatibility (no longer needed but kept for safety)
function addBooking(booking) {
  return createBooking(booking);
}

function getBookingsForUser(userId) {
  return getBookingsByUser(userId);
}

async function restockLotForCancelled(booking, ParkingLotModel) {
  if (!booking || !booking.parkingLotId) return;
  try {
    await ParkingLotModel.findByIdAndUpdate(booking.parkingLotId, {
      $inc: { availableSlots: 1, carsParked: -1 },
    });
  } catch (error) {
    console.error("Failed to restock lot:", error);
  }
}

module.exports = {
  createBooking,
  getAllBookings,
  getBookingsByUser,
  getBookingsByParkingLot,
  getBookingsForLots,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getActiveBookingsForLot,
  getOwnerStats,
  finalizeExpiredBookings,
  // Legacy exports
  addBooking,
  getBookingsForUser,
  restockLotForCancelled,
};
