const mongoose = require("mongoose");
require("dotenv").config();
const ParkingLot = require("./models/ParkingLot");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await ParkingLot.deleteMany({});

  await ParkingLot.create([
    {
      name: "Alpha Mall Parking",
      location: {
        type: "Point",
        coordinates: [72.6677, 23.0512],
      },
      totalSlots: 50,
      availableSlots: 25,
      carsParked: 25,
    },
    {
      name: "Lakeview Plaza",
      location: {
        type: "Point",
        coordinates: [72.6655, 23.0523],
      },
      totalSlots: 80,
      availableSlots: 40,
      carsParked: 40,
    },
    {
      name: "City Center Parking",
      location: {
        type: "Point",
        coordinates: [72.67, 23.05],
      },
      totalSlots: 100,
      availableSlots: 60,
      carsParked: 40,
    },
    {
      name: "Riverfront Lot",
      location: {
        type: "Point",
        coordinates: [72.668, 23.049],
      },
      totalSlots: 30,
      availableSlots: 10,
      carsParked: 20,
    },
    {
      name: "Airport Parking",
      location: {
        type: "Point",
        coordinates: [72.627, 23.073],
      },
      totalSlots: 200,
      availableSlots: 150,
      carsParked: 50,
    },
  ]);

  console.log("🚗 Seeded parking lots!");
  mongoose.disconnect();
});
