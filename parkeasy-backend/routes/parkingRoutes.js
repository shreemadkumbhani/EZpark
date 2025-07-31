const express = require("express");
const router = express.Router();
const ParkingLot = require("../models/ParkingLot");

// GET /api/parkinglots?lat=...&lng=...
router.get("/", async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Missing latitude or longitude" });
  }

  try {
    const lots = await ParkingLot.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          distanceField: "distance",
          maxDistance: 5000, // 5km
          spherical: true,
        },
      },
    ]);

    res.json({ parkingLots: lots });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching parking lots", error: err.message });
  }
});

module.exports = router;
