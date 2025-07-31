const app = require("./app");
const mongoose = require("mongoose");
require("dotenv").config();

const PORT = 8080; // ✅ change here
const MONGO_URI = process.env.MONGO_URI;

const cors = require("cors");
app.use(cors({ origin: "*" })); // or use your actual frontend port:5174

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () =>
      console.log(`🚀 Server is running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
