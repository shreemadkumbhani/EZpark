// Parking Lot API routes
// Handles: fetch nearby lots, book slot, owner registration, become owner
const express = require("express");
const router = express.Router();
const ParkingLot = require("../models/ParkingLot");
const requireAuth = require("../middleware/authMiddleware");
const bookingsService = require("../services/bookingsService");
const User = require("../models/User");

// GET /api/parkinglots?lat=...&lng=...
// Returns all parking lots within 5km of the given coordinates
router.get("/", async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    // Must provide both latitude and longitude
    return res.status(400).json({ message: "Missing latitude or longitude" });
  }

  try {
    // Use $near query to find lots sorted by distance
    const lots = await ParkingLot.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: 5000,
        },
      },
    });

    // Mongo returns distance in 'dist.calculated' only for $geoNear; calculate approx distance from coordinates if needed in frontend.
    res.json({ parkingLots: lots });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching parking lots", error: err.message });
  }
});

module.exports = router;

// POST /api/parkinglots/:id/book
// Book a slot at a parking lot (decrements availableSlots, increments carsParked) and record booking
router.post("/:id/book", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { hour } = req.body;
  if (!hour) return res.status(400).json({ message: "Hour required" });
  try {
    const lot = await ParkingLot.findById(id);
    if (!lot) return res.status(404).json({ message: "Parking lot not found" });
    if (lot.availableSlots < 1)
      return res.status(400).json({ message: "No slots available" });
    // For demo: just increment carsParked, decrement availableSlots
    lot.carsParked += 1;
    lot.availableSlots -= 1;
    await lot.save();

    // Record booking in shared store so history shows it
    const duration = parseInt(hour, 10) || 1;
    const now = Date.now();
    const startTime = now;
    const endTime = now + duration * 3600000;
    const slotNumber = lot.carsParked; // simplistic slot reference

    bookingsService.addBooking({
      userId: req.user.id,
      lotId: lot._id?.toString?.() || String(lot._id),
      lotName: lot.name,
      slot: slotNumber,
      time: now,
      startTime,
      endTime,
      price: duration * 10,
      vehicle: "",
      latitude: lot.location?.coordinates?.[1],
      longitude: lot.location?.coordinates?.[0],
      status: "Upcoming",
      review: "",
    });

    res.json({ message: "Slot booked!", lot });
  } catch (err) {
    res.status(500).json({ message: "Booking failed", error: err.message });
  }
});

// POST /api/parkinglots
// Owner registers a new parking lot (requires owner/admin role)
router.post("/", requireAuth, async (req, res) => {
  try {
    // Only allow owners or admins to register new parking
    if (!req.user || !["owner", "admin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Only owners can register parking" });
    }
    const { name, latitude, longitude, totalSlots, address } = req.body;
    // Validate required fields
    if (!name || latitude == null || longitude == null || !totalSlots) {
      return res.status(400).json({
        message: "name, latitude, longitude, totalSlots are required",
      });
    }
    // Create and save new parking lot
    const lot = new ParkingLot({
      name,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      address: address || {},
      totalSlots: Number(totalSlots),
      availableSlots: Number(totalSlots),
    });
    await lot.save();
    res.status(201).json({ message: "Parking lot registered", lot });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to register parking lot", error: err.message });
  }
});

// POST /api/parkinglots/become-owner
// Upgrade the current user to owner role
router.post("/become-owner", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "owner")
      return res.status(200).json({ message: "Already an owner" });
    user.role = "owner";
    await user.save();
    res.json({
      message: "Role updated to owner",
      user: { id: user._id, role: user.role },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update role", error: err.message });
  }
});
