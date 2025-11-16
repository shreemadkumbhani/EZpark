// Booking History API routes
// Handles: fetch user's booking history, create new bookings, cancel bookings, add reviews
const express = require("express");
const router = express.Router();
const requireAuth = require("../middleware/authMiddleware");
const {
  addBooking,
  generateDemoBookings,
  getBookingsForUser,
  getBookingsForLots,
  updateBookingStatus,
  cancelBooking,
  restockLotForCancelled,
  addReview,
} = require("../services/bookingsService");
const ParkingLot = require("../models/ParkingLot");

// GET /api/bookings
// Returns booking history for the authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    let userBookings = getBookingsForUser(req.user.id);
    if (userBookings.length === 0) {
      // Seed with demo data for this user once
      const demos = generateDemoBookings(req.user.id);
      demos.forEach((b) => addBooking(b));
      userBookings = getBookingsForUser(req.user.id);
    }
    // Compute status dynamically based on current time
    const withStatus = updateBookingStatus(userBookings);
    res.json({ bookings: withStatus });
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res
      .status(500)
      .json({ message: "Error fetching bookings", error: err.message });
  }
});

// POST /api/bookings
// Create a new booking
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      lotName,
      slot,
      startTime,
      endTime,
      price,
      vehicle,
      latitude,
      longitude,
    } = req.body;
    const booking = addBooking({
      userId: req.user.id,
      lotName: lotName || "Unknown Lot",
      slot: slot || `S${Math.floor(Math.random() * 100)}`,
      time: Date.now(),
      startTime: startTime || Date.now(),
      endTime: endTime || Date.now() + 3600000,
      price: price || Math.floor(Math.random() * 100) + 20,
      vehicle: vehicle || "Unknown Vehicle",
      latitude: latitude || 19.076,
      longitude: longitude || 72.8777,
      status: "Upcoming",
      review: "",
    });
    res.status(201).json({ message: "Booking created", booking });
  } catch (err) {
    console.error("Error creating booking:", err);
    res
      .status(500)
      .json({ message: "Error creating booking", error: err.message });
  }
});

// DELETE /api/bookings/:id
// Cancel a booking
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { ok, booking } = cancelBooking(id, req.user.id);
    if (!ok)
      return res
        .status(404)
        .json({ message: "Booking not found or not authorized" });
    // Restock lot availability and decrement carsParked if possible
    await restockLotForCancelled(booking, ParkingLot);
    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    console.error("Error cancelling booking:", err);
    res
      .status(500)
      .json({ message: "Error cancelling booking", error: err.message });
  }
});

// PATCH /api/bookings/:id/review
// Add or update a review for a booking
router.patch("/:id/review", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { review } = req.body;
    const updated = addReview(id, req.user.id, review);
    if (!updated)
      return res
        .status(404)
        .json({ message: "Booking not found or not authorized" });
    res.json({ message: "Review saved successfully", booking: updated });
  } catch (err) {
    console.error("Error saving review:", err);
    res
      .status(500)
      .json({ message: "Error saving review", error: err.message });
  }
});

module.exports = router;

// GET /api/bookings/owner-lots
// Returns all bookings for parking lots owned by the authenticated owner/admin
router.get("/owner-lots", requireAuth, async (req, res) => {
  try {
    if (!req.user || !["owner", "admin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Only owners can view lot bookings" });
    }
    // Find all lots owned by this user
    const lots = await ParkingLot.find(
      { owner: req.user.id },
      { _id: 1, name: 1 }
    ).lean();
    const lotIds = lots.map((l) => l._id.toString());
    if (lotIds.length === 0) {
      return res.json({ bookings: [], lots: [] });
    }
    let lotBookings = getBookingsForLots(lotIds);
    // Update status dynamically
    lotBookings = updateBookingStatus(lotBookings);
    // Attach lot name for convenience (already stored but ensure freshness)
    const nameMap = new Map(lots.map((l) => [l._id.toString(), l.name]));
    lotBookings = lotBookings.map((b) => ({
      ...b,
      lotName: nameMap.get(String(b.lotId)) || b.lotName,
    }));
    res.json({ bookings: lotBookings, lots });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching owner bookings", error: err.message });
  }
});
