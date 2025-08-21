const mongoose = require("mongoose");

const ParkingLotSchema = new mongoose.Schema({
  name: String,
  location: {
    type: {
      type: String, // 'Point'
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  totalSlots: Number,
  availableSlots: Number,
  carsParked: { type: Number, default: 0 },
});

// 🌍 Create a 2dsphere index for geo queries
ParkingLotSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("ParkingLot", ParkingLotSchema);
