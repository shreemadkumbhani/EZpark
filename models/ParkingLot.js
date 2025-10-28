// Import mongoose for MongoDB object modeling
const mongoose = require("mongoose");

// Define the schema for a Parking Lot
const ParkingLotSchema = new mongoose.Schema({
  name: String, // Name of the parking lot
  location: {
    type: {
      type: String, // Should always be 'Point' for GeoJSON
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  address: {
    line1: { type: String },
    line2: { type: String },
    landmark: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
  },
  totalSlots: Number, // Total number of parking slots
  availableSlots: Number, // Number of currently available slots
  carsParked: { type: Number, default: 0 }, // Number of cars currently parked
});

// 🌍 Create a 2dsphere index to enable geospatial queries on location
ParkingLotSchema.index({ location: "2dsphere" });

// Export the ParkingLot model
module.exports = mongoose.model("ParkingLot", ParkingLotSchema);
