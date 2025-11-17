const express = require("express");
const cors = require("cors");
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

module.exports = app;
