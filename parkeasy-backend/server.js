const app = require("./app");
const mongoose = require("mongoose");
const { startBookingScheduler } = require("./services/bookingScheduler");
require("dotenv").config();

const PORT = process.env.PORT || 8080; // respect .env or fallback to 8080
const MONGO_URI = process.env.MONGO_URI;

// Trust proxy (needed on Render/hosted envs for accurate protocol/origin)
app.set("trust proxy", 1);

const cors = require("cors");
const FRONTEND_URL = process.env.FRONTEND_URL; // e.g., https://<app>.vercel.app
const FRONTEND_URL_2 = process.env.FRONTEND_URL_2; // optional: preview or custom domain

// More flexible CORS to support Vercel previews and local dev
app.use(
  cors({
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    origin: (origin, cb) => {
      try {
        // Allow non-browser requests or same-origin
        if (!origin) return cb(null, true);

        const allowList = [FRONTEND_URL, FRONTEND_URL_2].filter(Boolean);
        if (allowList.includes(origin)) return cb(null, true);

        // Parse hostname to allow *.vercel.app and localhost dev
        const url = new URL(origin);
        const host = url.hostname || "";
        if (
          host.endsWith(".vercel.app") ||
          host.endsWith("localhost") ||
          host.match(/^\d+\.\d+\.\d+\.\d+$/) // LAN IP
        ) {
          return cb(null, true);
        }
        return cb(new Error(`CORS blocked for origin: ${origin}`));
      } catch (e) {
        return cb(new Error("CORS origin parse error"));
      }
    },
  })
);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");

    // Start automatic booking scheduler
    startBookingScheduler();

    app.listen(PORT, () =>
      console.log(`🚀 Server is running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
