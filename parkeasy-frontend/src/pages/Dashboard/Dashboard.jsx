// Dashboard page for users to view and book nearby parking lots
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./Dashboard.css";

export default function Dashboard() {
  // State variables for parking lots, loading, errors, booking, and UI
  const [parkingLots, setParkingLots] = useState([]); // List of nearby parking lots
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(""); // Error message
  const [selectedLot, setSelectedLot] = useState(null); // Currently selected lot for booking
  const [bookingHour, setBookingHour] = useState(""); // Hour input for booking
  const [bookingMsg, setBookingMsg] = useState(""); // Booking status message
  const [bookingLoading, setBookingLoading] = useState(false); // Booking loading state
  const [flippedId, setFlippedId] = useState(null); // ID of card currently flipped
  const [expand, setExpand] = useState(null); // Expanding popup state

  // Fetch nearby parking lots from backend using user's coordinates
  const fetchParkingLots = useCallback(async (coords) => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:8080/api/parkinglots", {
        params: { lat: coords.latitude, lng: coords.longitude },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setParkingLots(res.data.parkingLots || []);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Could not fetch parking lots.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ask for user's location and load parking lots
  const askLocationAndLoad = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = { latitude, longitude };
        fetchParkingLots(coords);
      },
      () => {
        setError("Location permission denied.");
        setLoading(false);
      }
    );
  }, [fetchParkingLots]);

  // On mount, ask for location and load lots
  useEffect(() => {
    askLocationAndLoad();
  }, [askLocationAndLoad]);

  // Lock body scroll and optionally blur background when popup is open
  // Lock body scroll when popup is open
  useEffect(() => {
    if (expand) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [expand]);

  // Helper to format distance in meters/kilometers
  // Format distance in meters or kilometers
  function formatDistance(m) {
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(2)} km`;
  }

  // Availability status without numbers
  // Get availability status and color class for a parking lot
  function getAvailabilityStatus(lot) {
    const a = Number(lot.availableSlots || 0);
    const t = Number(lot.totalSlots || 0) || 1;
    if (a <= 0) return { label: "Sold out", cls: "status-sold" };
    const ratio = Math.max(0, Math.min(1, a / t));
    // More granular bands (7 + sold out)
    if (ratio >= 0.8) return { label: "Plenty", cls: "status-plenty" };
    if (ratio >= 0.55) return { label: "Available", cls: "status-available" };
    if (ratio >= 0.35) return { label: "Moderate", cls: "status-moderate" };
    if (ratio >= 0.22) return { label: "Busy", cls: "status-busy" };
    if (ratio >= 0.12) return { label: "Limited", cls: "status-limited" };
    if (ratio >= 0.05) return { label: "Filling fast", cls: "status-fast" };
    return { label: "Almost full", cls: "status-almost" };
  }

  // Book slot handler
  // Book a slot for the selected parking lot
  async function handleBookSlot() {
    if (!selectedLot || !bookingHour) return;
    setBookingLoading(true);
    setBookingMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:8080/api/parkinglots/${selectedLot._id}/book`,
        { hour: bookingHour },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      setBookingMsg("Slot booked successfully!");
      // Signal other tabs/pages (History) to update immediately
      try {
        localStorage.setItem("bookings:refresh", "1");
      } catch {
        // ignore storage signaling errors
      }
      // Update lot info in UI
      setParkingLots((lots) =>
        lots.map((l) => (l._id === selectedLot._id ? res.data.lot : l))
      );
      setSelectedLot(res.data.lot);
    } catch (err) {
      setBookingMsg(err.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  }

  // Flip a specific card
  // Flip a specific card to show more details
  function toggleFlip(lotId) {
    setFlippedId((prev) => (prev === lotId ? null : lotId));
  }

  // Start expanding popup from the clicked card element
  // Start expanding popup animation from the clicked card
  function startExpandFrom(el, lot) {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const startStyle = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    setSelectedLot(lot);
    setBookingHour("");
    setBookingMsg("");
    setExpand({ lot, style: startStyle, rect });
    // transition to target size next frame
    requestAnimationFrame(() => {
      const vw = Math.min(window.innerWidth * 0.92, 640);
      const vh = Math.min(window.innerHeight * 0.75, 520);
      const left = (window.innerWidth - vw) / 2;
      const top = Math.max(24, (window.innerHeight - vh) / 2);
      setExpand(
        (prev) =>
          prev && { ...prev, style: { left, top, width: vw, height: vh } }
      );
    });
  }

  // Close expanding popup (shrink back to card if visible)
  // Close expanding popup (shrink back to card if visible)
  function closeExpand() {
    if (!expand) return;
    const target = document.getElementById(`slot-${expand.lot._id}`);
    const rect = target?.getBoundingClientRect?.();
    const endStyle = rect
      ? {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        }
      : expand.rect;
    setExpand((prev) => prev && { ...prev, style: endStyle, closing: true });
    setTimeout(() => setExpand(null), 320);
  }

  return (
    <div className="dashboard-container">
      <div className={`dashboard-content${expand ? " blurred" : ""}`}>
        <h2 className="dashboard-title">📍 Park Nearby with ParkEasy</h2>

        {loading && (
          <div className="loading-wrap">
            <div className="spinner" aria-label="loading" />
            <p>Detecting nearest parking lots...</p>
          </div>
        )}

        {error && (
          <div>
            <p style={{ color: "#ef4444", marginBottom: 12 }}>{error}</p>
            <button className="retry-button" onClick={askLocationAndLoad}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && parkingLots.length === 0 && (
          <p>No nearby parking lots found.</p>
        )}

        <div className="slot-grid">
          {parkingLots.map((lot) => {
            const isFlipped = flippedId === lot._id;
            const status = getAvailabilityStatus(lot);
            return (
              <div
                id={`slot-${lot._id}`}
                key={lot._id}
                className={`slot${
                  selectedLot && selectedLot._id === lot._id ? " selected" : ""
                } ${isFlipped ? "flipped" : ""}`}
                onClick={() => toggleFlip(lot._id)}
              >
                <div className="slot-inner">
                  <div className="slot-front">
                    <div className="slot-front-plain">
                      <div className="slot-name">{lot.name}</div>
                      <div className="slot-distance">
                        {formatDistance(lot.distance || 0)}
                      </div>
                    </div>
                    <div className={`status-pill ${status.cls}`}>
                      {status.label}
                    </div>
                  </div>
                  <div className="slot-back">
                    <div className="slot-back-header">
                      <div className="slot-name">{lot.name}</div>
                      <div className="slot-distance">
                        {formatDistance(lot.distance || 0)}
                      </div>
                    </div>
                    <div className="slot-back-stats">
                      <div>
                        Slots: {lot.availableSlots} / {lot.totalSlots}
                      </div>
                      <div>Status: {status.label}</div>
                      <div>Cars parked: {lot.carsParked || 0}</div>
                    </div>
                    <div className="slot-back-actions">
                      <button
                        className="confirm-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const slotEl = e.currentTarget.closest(".slot");
                          startExpandFrom(slotEl, lot);
                        }}
                      >
                        Book
                      </button>
                      <button
                        className="retry-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFlip(lot._id);
                        }}
                      >
                        Flip Back
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {expand && (
        <div className="expand-overlay" aria-modal="true" role="dialog">
          <div className="expand-backdrop" onClick={closeExpand} />
          <div
            className="expand-card"
            style={{
              left: expand.style.left,
              top: expand.style.top,
              width: expand.style.width,
              height: expand.style.height,
            }}
          >
            {selectedLot && (
              <div className="expand-content">
                <div className="expand-header">
                  <div className="expand-title">{selectedLot.name}</div>
                  <button className="retry-button" onClick={closeExpand}>
                    Close
                  </button>
                </div>
                <div className="meta">
                  Distance: {formatDistance(selectedLot.distance || 0)} • Slots
                  left: {selectedLot.availableSlots} • Cars parked:{" "}
                  {selectedLot.carsParked || 0}
                </div>
                <div className="booking-controls" style={{ marginTop: 8 }}>
                  <label htmlFor="booking-hour">Select hour:</label>
                  <input
                    id="booking-hour"
                    type="number"
                    min="0"
                    max="23"
                    value={bookingHour}
                    onChange={(e) => setBookingHour(e.target.value)}
                    style={{ width: 64, marginLeft: 8 }}
                  />
                  <button
                    className="confirm-button"
                    onClick={handleBookSlot}
                    disabled={
                      bookingLoading ||
                      !bookingHour ||
                      selectedLot.availableSlots < 1
                    }
                  >
                    {bookingLoading ? "Booking..." : "Book Slot"}
                  </button>
                </div>
                {bookingMsg && (
                  <div
                    style={{
                      marginTop: 10,
                      color: bookingMsg.includes("success")
                        ? "#34d399"
                        : "#ef4444",
                    }}
                  >
                    {bookingMsg}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
