// Script to import Ahmedabad parking data from CSV file
require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const ParkingLot = require("../models/ParkingLot");

// CSV parsing function
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

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index];
      });
      data.push(row);
    }
  }

  return data;
}

// Convert CSV row to ParkingLot format
function csvToParkingLot(csvRow) {
  // Parse address to extract components
  const fullAddress = csvRow.address.replace(/"/g, "");
  const addressParts = fullAddress.split(",").map((part) => part.trim());

  // Extract city, state from address
  let city = "Ahmedabad";
  let state = "Gujarat";
  let line1 = addressParts[0] || "";
  let line2 = addressParts.length > 1 ? addressParts[1] : "";

  // If address contains "Ahmedabad", use it as city reference
  if (fullAddress.includes("Ahmedabad")) {
    city = "Ahmedabad";
  }
  if (fullAddress.includes("Gujarat")) {
    state = "Gujarat";
  }

  return {
    name: csvRow.name,
    pricePerHour: 50, // Default price per hour
    location: {
      type: "Point",
      coordinates: [parseFloat(csvRow.lon), parseFloat(csvRow.lat)], // [longitude, latitude]
    },
    address: {
      line1: line1,
      line2: line2,
      landmark:
        csvRow.type === "surface"
          ? "Surface Parking"
          : csvRow.type === "multi-storey"
          ? "Multi-Storey Parking"
          : csvRow.type === "underground"
          ? "Underground Parking"
          : "On-Street Parking",
      city: city,
      state: state,
      pincode: "380000", // Default Ahmedabad pincode
    },
    totalSlots: parseInt(csvRow.totalSlots) || 100,
    availableSlots: parseInt(csvRow.availableSlots) || 50,
    carsParked: Math.max(
      0,
      (parseInt(csvRow.totalSlots) || 100) -
        (parseInt(csvRow.availableSlots) || 50)
    ),
  };
}

async function importParkingData() {
  try {
    // Connect to MongoDB
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB successfully!");

    // Read CSV file
    const csvPath = path.join(__dirname, "../../ahmedabad_parking_200.csv");
    console.log("📁 Reading CSV file:", csvPath);

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const csvData = parseCSV(csvContent);
    console.log(`📊 Parsed ${csvData.length} parking lots from CSV`);

    // Check existing parking lots count
    const existingCount = await ParkingLot.countDocuments();
    console.log(`🏪 Current parking lots in database: ${existingCount}`);

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Import each parking lot
    for (const csvRow of csvData) {
      try {
        const parkingLotData = csvToParkingLot(csvRow);

        // Check if parking lot with this name already exists (simplified check)
        const existingLot = await ParkingLot.findOne({
          name: parkingLotData.name,
        });

        if (existingLot) {
          console.log(`⚠️  Skipping duplicate: ${parkingLotData.name}`);
          skippedCount++;
          continue;
        }

        // Create new parking lot
        const newParkingLot = new ParkingLot(parkingLotData);
        await newParkingLot.save();

        importedCount++;
        console.log(
          `✅ Imported: ${parkingLotData.name} (${importedCount}/${csvData.length})`
        );
      } catch (error) {
        errorCount++;
        console.error(`❌ Error importing ${csvRow.name}:`, error.message);
      }
    }

    // Final summary
    console.log("\n🎉 Import completed!");
    console.log(`📊 Summary:`);
    console.log(`   • Imported: ${importedCount} new parking lots`);
    console.log(`   • Skipped (duplicates): ${skippedCount}`);
    console.log(`   • Errors: ${errorCount}`);
    console.log(`   • Total in database: ${await ParkingLot.countDocuments()}`);
  } catch (error) {
    console.error("💥 Import failed:", error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("🔒 Database connection closed");
  }
}

// Run the import
if (require.main === module) {
  importParkingData();
}

module.exports = importParkingData;
