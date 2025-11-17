// Booking History API routes
// Handles: fetch user's booking history, create new bookings, cancel bookings
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const {
  createBooking,
  getAllBookings,
  getBookingsByUser,
  getBookingsByParkingLot,
  getBookingsForLots,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getOwnerStats,
} = require("../services/bookingsService");
const ParkingLot = require("../models/ParkingLot");
const User = require("../models/User");

// GET /api/bookings
// Returns booking history for the authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const bookings = await getBookingsByUser(req.user.id, status);
    res.json({ bookings });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: err.message });
  }
});

// GET /api/bookings/all (admin only)
// Returns all bookings with pagination
router.get("/all", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const result = await getAllBookings(page, limit);
    res.json(result);
  } catch (err) {
    console.error("Error fetching all bookings:", err);
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: err.message });
  }
});

// GET /api/bookings/owner-lots
// Returns bookings for all parking lots owned by the authenticated owner
router.get("/owner-lots", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Owner or admin access required" });
    }

    const lots = await ParkingLot.find({ owner: req.user.id }).select("_id");
    const lotIds = lots.map((lot) => lot._id);

    const bookings = await getBookingsForLots(lotIds);
    res.json({ bookings });
  } catch (err) {
    console.error("Error fetching owner bookings:", err);
    res
      .status(500)
      .json({ message: "Error fetching owner bookings", error: err.message });
  }
});

// GET /api/bookings/owner-stats
// Returns booking statistics for owner
router.get("/owner-stats", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "owner" && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Owner or admin access required" });
    }

    const lots = await ParkingLot.find({ owner: req.user.id }).select("_id");
    const lotIds = lots.map((lot) => lot._id);

    const stats = await getOwnerStats(lotIds);
    res.json(stats);
  } catch (err) {
    console.error("Error fetching owner stats:", err);
    res
      .status(500)
      .json({ message: "Error fetching owner stats", error: err.message });
  }
});

// GET /api/bookings/lot/:lotId
// Returns bookings for a specific parking lot
router.get("/lot/:lotId", requireAuth, async (req, res) => {
  try {
    const { lotId } = req.params;
    const { status } = req.query;

    // Verify lot ownership for owners
    if (req.user.role === "owner") {
      const lot = await ParkingLot.findOne({ _id: lotId, owner: req.user.id });
      if (!lot) {
        return res
          .status(403)
          .json({ message: "You don't own this parking lot" });
      }
    }

    const bookings = await getBookingsByParkingLot(lotId, status);
    res.json({ bookings });
  } catch (err) {
    console.error("Error fetching lot bookings:", err);
    res
      .status(500)
      .json({ message: "Error fetching lot bookings", error: err.message });
  }
});

// GET /api/bookings/:id
// Get a specific booking by ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const booking = await getBookingById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check authorization
    if (
      req.user.role !== "admin" &&
      booking.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json({ booking });
  } catch (err) {
    console.error("Error fetching booking:", err);
    res
      .status(500)
      .json({ message: "Error fetching booking", error: err.message });
  }
});

// POST /api/bookings
// Create a new booking
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      parkingLotId,
      vehicleType,
      vehicleNumber,
      startTime,
      endTime,
      duration,
    } = req.body;

    // Validate required fields
    if (
      !parkingLotId ||
      !vehicleType ||
      !vehicleNumber ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get parking lot details
    const parkingLot = await ParkingLot.findById(parkingLotId);
    if (!parkingLot) {
      return res.status(404).json({ message: "Parking lot not found" });
    }

    // Check availability
    if (parkingLot.availableSlots <= 0) {
      return res.status(400).json({ message: "No slots available" });
    }

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate duration and price
    const start = new Date(startTime);
    const end = new Date(endTime);
    const hours = duration || Math.ceil((end - start) / (1000 * 60 * 60));
    const totalPrice = hours * parkingLot.pricePerHour;

    const bookingData = {
      userId: req.user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      parkingLotId,
      parkingLotName: parkingLot.name,
      vehicleType,
      vehicleNumber,
      startTime: start,
      endTime: end,
      duration: hours,
      pricePerHour: parkingLot.pricePerHour,
      totalPrice,
      status: "active",
    };

    const booking = await createBooking(bookingData);
    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (err) {
    console.error("Error creating booking:", err);
    res
      .status(500)
      .json({ message: "Error creating booking", error: err.message });
  }
});

// PATCH /api/bookings/:id/status
// Update booking status
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await updateBookingStatus(
      req.params.id,
      status,
      req.user.role === "admin" ? null : req.user.id
    );

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found or not authorized" });
    }

    res.json({ message: "Booking status updated", booking });
  } catch (err) {
    console.error("Error updating booking:", err);
    res
      .status(500)
      .json({ message: "Error updating booking", error: err.message });
  }
});

// DELETE /api/bookings/:id
// Cancel a booking
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const booking = await cancelBooking(req.params.id, req.user.id);

    if (!booking) {
      return res
        .status(404)
        .json({ message: "Booking not found or not authorized" });
    }

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error("Error cancelling booking:", err);
    res
      .status(500)
      .json({ message: "Error cancelling booking", error: err.message });
  }
});

module.exports = router;
