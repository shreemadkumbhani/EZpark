import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../../config";
import "./BookingModal.css";

export default function BookingModal({ lot, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    vehicleType: "car",
    vehicleNumber: "",
    duration: "1",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const showToast = (message) => {
    try {
      const toast = document.createElement("div");
      toast.textContent = message;
      toast.style.position = "fixed";
      toast.style.right = "20px";
      toast.style.bottom = "20px";
      toast.style.zIndex = 9999;
      toast.style.background = "rgba(34,197,94,0.95)"; // green
      toast.style.color = "white";
      toast.style.padding = "12px 16px";
      toast.style.borderRadius = "10px";
      toast.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)";
      toast.style.fontWeight = "600";
      toast.style.backdropFilter = "saturate(180%) blur(8px)";
      document.body.appendChild(toast);
      setTimeout(() => {
        try {
          document.body.removeChild(toast);
        } catch {}
      }, 2500);
    } catch {}
  };

  async function loadRazorpayCheckout() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.vehicleNumber.trim()) {
      setError("Please enter vehicle number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const now = new Date();
      const duration = parseFloat(formData.duration);
      const endTime = new Date(now.getTime() + duration * 60 * 60 * 1000);

      const bookingData = {
        parkingLotId: lot._id,
        vehicleType: formData.vehicleType,
        vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
        startTime: now.toISOString(),
        endTime: endTime.toISOString(),
        duration,
      };

      const createRes = await axios.post(
        `${API_BASE}/api/bookings`,
        bookingData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const createdBooking = createRes.data?.booking;
      if (!createdBooking?._id) throw new Error("Failed to create booking");

      // Begin payment flow with Razorpay
      await loadRazorpayCheckout();

      const keyRes = await axios.get(`${API_BASE}/api/payments/key`);
      const keyId = keyRes.data?.keyId;
      if (!keyId) throw new Error("Payment key missing");

      const orderRes = await axios.post(
        `${API_BASE}/api/payments/order`,
        { bookingId: createdBooking._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const order = orderRes.data?.order;
      if (!order?.id) throw new Error("Failed to create payment order");

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ParkEasy",
        description: createdBooking.parkingLotName || "Parking Booking",
        order_id: order.id,
        prefill: {
          name: createdBooking.userName,
          email: createdBooking.userEmail,
          contact: createdBooking.userPhone,
        },
        notes: { bookingId: createdBooking._id },
        handler: async function (response) {
          try {
            await axios.post(
              `${API_BASE}/api/payments/verify`,
              {
                bookingId: createdBooking._id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast("Payment successful! Booking confirmed.");
            if (onSuccess) onSuccess();
            onClose();
          } catch (e) {
            setError(
              e.response?.data?.message ||
                e.message ||
                "Payment verification failed"
            );
            // Cancel booking to free slot on failed verification
            try {
              await axios.delete(
                `${API_BASE}/api/bookings/${createdBooking._id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            } catch {}
          }
        },
        modal: {
          ondismiss: async () => {
            // User closed payment modal; cancel booking to free slot
            try {
              await axios.delete(
                `${API_BASE}/api/bookings/${createdBooking._id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
            } catch {}
            setError("Payment cancelled. Booking was not completed.");
            setLoading(false);
          },
        },
        theme: { color: "#4f46e5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to create booking"
      );
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = lot.pricePerHour * parseFloat(formData.duration || 1);

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div
        className="booking-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        <h2>Book Parking Slot</h2>
        <div className="lot-summary">
          <h3>{lot.name}</h3>
          <p className="lot-address">
            {lot.address?.street}, {lot.address?.city}
          </p>
          <p className="lot-price">₹{lot.pricePerHour}/hour</p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label>Vehicle Type</label>
            <select
              value={formData.vehicleType}
              onChange={(e) =>
                setFormData({ ...formData, vehicleType: e.target.value })
              }
              className="form-control"
            >
              <option value="car">Car</option>
              <option value="bike">Bike</option>
              <option value="truck">Truck</option>
              <option value="van">Van</option>
            </select>
          </div>

          <div className="form-group">
            <label>Vehicle Number *</label>
            <input
              type="text"
              value={formData.vehicleNumber}
              onChange={(e) =>
                setFormData({ ...formData, vehicleNumber: e.target.value })
              }
              placeholder="MH12AB1234"
              className="form-control"
              required
            />
          </div>

          <div className="form-group">
            <label>Duration (hours)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) =>
                setFormData({ ...formData, duration: e.target.value })
              }
              min="0.5"
              step="0.5"
              className="form-control"
              required
            />
          </div>

          <div className="booking-summary">
            <div className="summary-row">
              <span>Price per hour:</span>
              <span>₹{lot.pricePerHour}</span>
            </div>
            <div className="summary-row">
              <span>Duration:</span>
              <span>{formData.duration} hours</span>
            </div>
            <div className="summary-row total">
              <span>Total Price:</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Processing..." : "Pay & Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
