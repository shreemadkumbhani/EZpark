#!/usr/bin/env node
/*
  Delete parking lots that appear in a given CSV.
  Usage examples:
    node scripts/deleteParkingByCSV.js ../../ahmedabad_parking_200.csv
    node scripts/deleteParkingByCSV.js ../../gandhinagar_karnavati_parking.csv

  Strategy:
    - Parse the CSV (same format as importer)
    - For each row, try to find lots within ~150m of the [lon,lat]
    - Prefer matches with the same (case-insensitive) name when present
    - Delete matched lots and keep counts
*/
require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const ParkingLot = require("../models/ParkingLot");

function parseCSV(csvContent) {
  const lines = csvContent.trim().split("\n");
  const headers = lines[0].split(",");
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let currentValue = "";
    let insideQuotes = false;
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') insideQuotes = !insideQuotes;
      else if (char === "," && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = "";
      } else currentValue += char;
    }
    values.push(currentValue.trim());
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => (row[h.trim()] = values[idx]));
      data.push(row);
    }
  }
  return data;
}

async function main() {
  const argPath = process.argv[2];
  if (!argPath) {
    console.error("Usage: node scripts/deleteParkingByCSV.js <path-to-csv>");
    process.exit(1);
  }

  const csvPath = path.resolve(__dirname, argPath);
  if (!fs.existsSync(csvPath)) {
    console.error("CSV not found:", csvPath);
    process.exit(1);
  }

  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/parkeasy";
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB");

  const csv = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCSV(csv);
  console.log(`📄 Rows parsed: ${rows.length}`);

  let matched = 0;
  let deleted = 0;
  let unmatched = 0;
  const toDeleteIds = new Set();

  for (const row of rows) {
    const name = (row.name || "").trim();
    const lat = parseFloat(row.lat);
    const lon = parseFloat(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      unmatched++;
      continue;
    }
    try {
      const nearby = await ParkingLot.find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [lon, lat] },
            $maxDistance: 150,
          },
        },
      })
        .limit(5)
        .lean();

      if (!nearby.length) {
        unmatched++;
        continue;
      }

      matched += nearby.length;
      // Prefer exact-name matches when a name exists
      const lowerName = name.toLowerCase();
      const exact = lowerName
        ? nearby.filter((l) => String(l.name || "").toLowerCase() === lowerName)
        : [];
      const chosen = exact.length ? exact : nearby;
      for (const lot of chosen) toDeleteIds.add(String(lot._id));
    } catch (e) {
      console.error("Lookup error:", e.message);
    }
  }

  if (toDeleteIds.size === 0) {
    console.log("No matching lots found to delete.");
    await mongoose.disconnect();
    return;
  }

  console.log(
    `🗑️  Deleting ${toDeleteIds.size} parking lot(s) that match CSV...`
  );
  const res = await ParkingLot.deleteMany({ _id: { $in: [...toDeleteIds] } });
  deleted = res.deletedCount || 0;

  console.log("\n📊 Delete Summary:");
  console.log(`   • Rows in CSV: ${rows.length}`);
  console.log(`   • Nearby matches found: ${matched}`);
  console.log(`   • Unique lots targeted: ${toDeleteIds.size}`);
  console.log(`   • Deleted: ${deleted}`);
  console.log(`   • Unmatched CSV rows: ${unmatched}`);

  await mongoose.disconnect();
  console.log("🔒 Disconnected");
}

if (require.main === module) {
  main().catch((e) => {
    console.error("Delete failed:", e);
    process.exitCode = 1;
  });
}

module.exports = main;
