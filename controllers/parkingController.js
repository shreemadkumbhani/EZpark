// controllers/parkingController.js

const ParkingLot = require("../models/ParkingLot");

exports.getNearbyParkingLots = async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ message: "Latitude and longitude required" });
  }

  try {
    const parkingLots = await ParkingLot.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
          $maxDistance: 10000, // 10 km
        },
      },
    });

    res.json({ parkingLots });
  } catch (error) {
    console.error("Geo query error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
