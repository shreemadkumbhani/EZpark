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

      await axios.post(`${API_BASE}/api/bookings`, bookingData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Set flag for cross-tab updates
      try {
        localStorage.setItem("bookings:refresh", "1");
      } catch {}

      // Notify success
      if (onSuccess) onSuccess();
      onClose();
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
              {loading ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
