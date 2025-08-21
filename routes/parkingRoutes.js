const express = require("express");
const router = express.Router();
const ParkingLot = require("../models/ParkingLot");
const requireAuth = require("../middleware/authMiddleware");
const User = require("../models/User");

// GET /api/parkinglots?lat=...&lng=...
router.get("/", async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Missing latitude or longitude" });
  }

  try {
    // Use $near query to avoid $geoNear index ambiguity
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
router.post("/:id/book", async (req, res) => {
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
    res.json({ message: "Slot booked!", lot });
  } catch (err) {
    res.status(500).json({ message: "Booking failed", error: err.message });
  }
});

// POST /api/parkinglots  -> Owner registers a new parking lot
router.post("/", requireAuth, async (req, res) => {
  try {
    if (!req.user || !["owner", "admin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Only owners can register parking" });
    }
    const { name, latitude, longitude, totalSlots } = req.body;
    if (!name || latitude == null || longitude == null || !totalSlots) {
      return res
        .status(400)
        .json({
          message: "name, latitude, longitude, totalSlots are required",
        });
    }
    const lot = new ParkingLot({
      name,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
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

// POST /api/parkinglots/become-owner -> upgrade current user to owner
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
