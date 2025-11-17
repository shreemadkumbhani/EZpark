// Payment routes for Razorpay integration
const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const requireAuth = require("../middleware/authMiddleware");
const Booking = require("../models/Booking");

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

// POST /api/payments/create-order
// Create a Razorpay order for a booking
router.post("/create-order", requireAuth, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;

    if (!bookingId || !amount) {
      return res
        .status(400)
        .json({ message: "Booking ID and amount required" });
    }

    // Verify booking belongs to user
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: "INR",
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId: bookingId.toString(),
        userId: req.user.id,
      },
    };

    const order = await razorpay.orders.create(options);

    // Update booking with order ID
    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
    });
  } catch (error) {
    console.error("Error creating payment order:", error);
    res.status(500).json({
      message: "Failed to create payment order",
      error: error.message,
    });
  }
});

// POST /api/payments/verify
// Verify Razorpay payment signature
router.post("/verify", requireAuth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !bookingId
    ) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // Verify booking
    const booking = await Booking.findOne({
      _id: bookingId,
      userId: req.user.id,
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "dummy_secret")
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update booking with payment details
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.razorpaySignature = razorpay_signature;
      booking.paymentStatus = "paid";
      await booking.save();

      res.json({
        success: true,
        message: "Payment verified successfully",
        booking,
      });
    } else {
      // Mark payment as failed
      booking.paymentStatus = "failed";
      await booking.save();

      res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      message: "Failed to verify payment",
      error: error.message,
    });
  }
});

// POST /api/payments/webhook
// Razorpay webhook for payment events (optional)
router.post("/webhook", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (secret) {
      const signature = req.headers["x-razorpay-signature"];
      const body = JSON.stringify(req.body);

      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        return res.status(400).json({ message: "Invalid signature" });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload.payment.entity;

    console.log(`[Webhook] Received event: ${event}`);

    if (event === "payment.captured") {
      // Handle successful payment
      const orderId = payload.order_id;
      const booking = await Booking.findOne({ razorpayOrderId: orderId });

      if (booking) {
        booking.razorpayPaymentId = payload.id;
        booking.paymentStatus = "paid";
        await booking.save();
        console.log(`[Webhook] Payment captured for booking ${booking._id}`);
      }
    } else if (event === "payment.failed") {
      // Handle failed payment
      const orderId = payload.order_id;
      const booking = await Booking.findOne({ razorpayOrderId: orderId });

      if (booking) {
        booking.paymentStatus = "failed";
        await booking.save();
        console.log(`[Webhook] Payment failed for booking ${booking._id}`);
      }
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    res.status(500).json({ message: "Webhook error" });
  }
});

module.exports = router;
