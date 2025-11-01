#!/usr/bin/env node
/*
  Deletes parking lot documents by exact name.
  Usage:
    node scripts/deleteLotByName.js "Lot Name"
  Uses process.env.MONGO_URI or defaults to mongodb://localhost:27017/parkeasy
*/
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const ParkingLot = require("../models/ParkingLot");

(async () => {
  const name = process.argv[2];
  if (!name) {
    console.error("Error: Provide the parking lot name to delete.");
    console.error('Example: node scripts/deleteLotByName.js "dsfd"');
    process.exit(1);
  }
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/parkeasy";
  try {
    await mongoose.connect(uri);
    const res = await ParkingLot.deleteMany({ name });
    console.log(`Deleted ${res.deletedCount} parking lot(s) named "${name}".`);
  } catch (err) {
    console.error("Failed to delete lot:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
