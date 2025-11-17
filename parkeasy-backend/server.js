require("dotenv").config({ path: __dirname + '/.env' });
const app = require("./app");
const mongoose = require("mongoose");
const cron = require("node-cron");
const { finalizeExpiredBookings } = require("./services/bookingsService");

const PORT = process.env.PORT || 8080; // respect .env or fallback to 8080
const MONGO_URI = process.env.MONGO_URI;

// Debug logging
console.log("🔍 Environment Check:");
console.log("  PORT:", PORT);
console.log("  MONGO_URI:", MONGO_URI ? "✓ SET" : "✗ NOT SET");
console.log("  JWT_SECRET:", process.env.JWT_SECRET ? "✓ SET" : "✗ NOT SET");

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
    app.listen(PORT, () =>
      console.log(`🚀 Server is running on http://localhost:${PORT}`)
    );

    // Kick off a cron job to auto-complete expired bookings every minute
    try {
      cron.schedule("* * * * *", async () => {
        try {
          const { updated } = await finalizeExpiredBookings();
          if (updated) {
            // Optional: console log minimal info to avoid noise
            // console.log(`⏱️ Finalized ${updated} expired bookings`);
          }
        } catch {}
      });
      // Also run once on startup
      finalizeExpiredBookings().catch(() => {});
    } catch (e) {
      console.error("Failed to schedule finalizeExpiredBookings", e);
    }
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));
