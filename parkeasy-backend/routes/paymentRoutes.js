const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const auth = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");

const router = express.Router();

const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

// Lazy init instance to allow startup without keys (non-payment flows)
let razorpayInstance = null;
function getRazorpay() {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys not configured");
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

// Public endpoint to fetch publishable key for frontend
router.get("/key", (req, res) => {
  if (!RAZORPAY_KEY_ID) {
    return res.status(500).json({ message: "Razorpay key not configured" });
  }
  res.json({ keyId: RAZORPAY_KEY_ID });
});

// Create an order for a booking
router.post("/order", auth, async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId)
      return res.status(400).json({ message: "bookingId is required" });

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.paymentStatus === "paid")
      return res.status(400).json({ message: "Booking already paid" });

    const instance = getRazorpay();
    const amountPaise = Math.max(1, Math.round(booking.totalPrice * 100)); // in paise

    const order = await instance.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: booking._id.toString(),
      notes: {
        bookingId: booking._id.toString(),
        parkingLotId: booking.parkingLotId.toString(),
        userId: booking.userId.toString(),
      },
    });

    booking.paymentProvider = "razorpay";
    booking.paymentOrderId = order.id;
    await booking.save();

    res.json({ order, bookingId: booking._id });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create order" });
  }
});

// Verify payment signature and mark booking as paid
router.post("/verify", auth, async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};
    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({ message: "Missing verification fields" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.paymentStatus === "paid") {
      return res.json({ verified: true, message: "Already verified" });
    }

    if (booking.paymentOrderId !== razorpay_order_id) {
      return res.status(400).json({ message: "Order ID mismatch" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;
    if (!isValid) {
      return res
        .status(400)
        .json({ verified: false, message: "Invalid signature" });
    }

    booking.paymentStatus = "paid";
    booking.paymentId = razorpay_payment_id;
    booking.paymentSignature = razorpay_signature;
    await booking.save();

    res.json({
      verified: true,
      message: "Payment verified",
      bookingId: booking._id,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Failed to verify payment" });
  }
});

module.exports = router;
