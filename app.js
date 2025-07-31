const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const parkingRoutes = require("./routes/parkingRoutes");

app.use(express.json());
app.use("/api/parkinglots", parkingRoutes);


app.get("/", (req, res) => {
  res.send("🎉 ParkEasy API is running!");
});

module.exports = app;



