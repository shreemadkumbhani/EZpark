const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const parkingLotRoutes = require("./routes/parkingLotRoutes");
app.use("/api/parkinglots", parkingLotRoutes);

const bookingsRoutes = require("./routes/bookingsRoutes");
app.use("/api/bookings", bookingsRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  res.send("🎉 ParkEasy API is running!");
});

// Lightweight health check for Render/containers
app.get("/health", (req, res) => {
  const dbStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const dbState = dbStates[mongoose.connection.readyState] || "unknown";
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    db: dbState,
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
