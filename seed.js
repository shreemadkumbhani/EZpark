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
        coordinates: [72.6677, 23.0512], // Ahmedabad coordinates
      },
      totalSlots: 50,
      availableSlots: 25,
    },
    {
      name: "Lakeview Plaza",
      location: {
        type: "Point",
        coordinates: [72.6655, 23.0523],
      },
      totalSlots: 80,
      availableSlots: 40,
    },
  ]);

  console.log("🚗 Seeded parking lots!");
  mongoose.disconnect();
});
