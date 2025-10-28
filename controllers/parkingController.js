// controllers/parkingController.js

// Import the ParkingLot model to interact with the parking lots collection in the database
const ParkingLot = require("../models/ParkingLot");

// Controller to get nearby parking lots based on latitude and longitude from the request query
exports.getNearbyParkingLots = async (req, res) => {
  // Extract latitude and longitude from the query parameters
  const { lat, lng } = req.query;

  // If either latitude or longitude is missing, return a 400 error
  if (!lat || !lng) {
    return res.status(400).json({ message: "Latitude and longitude required" });
  }

  try {
    // Find parking lots within 10 km of the given coordinates using MongoDB geospatial query
    const parkingLots = await ParkingLot.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat], // Note: [longitude, latitude]
          },
          $maxDistance: 10000, // 10 km radius
        },
      },
    });

    // Respond with the list of nearby parking lots
    res.json({ parkingLots });
  } catch (error) {
    // Log and return server error if something goes wrong
    console.error("Geo query error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
