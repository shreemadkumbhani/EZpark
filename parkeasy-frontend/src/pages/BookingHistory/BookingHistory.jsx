import { useState } from "react";
import "./BookingHistory.css";
import { useBookingHistory } from "../../hooks/useBookingHistory";
import {
  formatDateTime,
  computeStatus,
  getMapsLink,
  getDestinationCoords,
  getQRCodeUrl,
  getLotDisplayName,
  getVehicleNumber,
  downloadReceiptAsImage,
  openDirections,
} from "../../utils/bookingUtils";

export default function BookingHistory() {
  const {
    paged,
    bookings,
    loading,
    filter,
    setFilter,
    sort,
    setSort,
    page,
    setPage,
    totalPages,
    fetchBookings,
    cancelBooking,
    cancelling,
    completeBooking,
    completing,
  } = useBookingHistory({ perPage: 2 });
  const [review, setReview] = useState({});
  const [error, setError] = useState(null);

  // Wrap fetchBookings to capture and surface error state
  async function safeRefresh() {
    setError(null);
    try {
      await fetchBookings();
      if (!Array.isArray(bookings)) throw new Error("Invalid response shape");
    } catch (e) {
      console.error("Booking history refresh failed", e);
      setError(e.message || "Failed to load bookings");
    }
  }

  return (
    <div className="history-container">
      <h2 className="history-title">
        🕓 Booking History{" "}
        {loading && (
          <span style={{ fontSize: 14, color: "#666" }}>(Updating...)</span>
        )}
      </h2>
      <div className="history-controls">
        <label>
          Filter:
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
        <label>
          Sort:
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </label>
        <button onClick={safeRefresh} className="receipt-btn">
          Refresh
        </button>
      </div>
      {error && (
        <div style={{ color: "#f87171", fontSize: 14, marginBottom: 12 }}>
          {error} – ensure backend URL is configured.
        </div>
      )}
      {bookings.length === 0 ? (
        <p className="no-history">No bookings found.</p>
      ) : (
        <ul className="history-list">
          {paged.map((booking, index) => {
            const globalIndex = (page - 1) * 2 + index;
            const status = computeStatus(booking);
            const mapsLink = getMapsLink(booking);
            const bookingId = booking._id || booking.id;
            const lotName = getLotDisplayName(booking);
            const vehicleNum = getVehicleNumber(booking);
            const price = booking.totalPrice || booking.price || 0;
            const bookingTime = booking.createdAt || booking.time;

            return (
              <li key={bookingId || globalIndex} className="history-item">
                {/* Hidden offscreen receipt template for image download only */}
                <div
                  id={`receipt-card-${globalIndex}`}
                  style={{
                    position: "fixed",
                    left: -10000,
                    top: -10000,
                    padding: 20,
                    background: "#23232a",
                    borderRadius: 10,
                    maxWidth: 420,
                    color: "#fff",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 20,
                      marginBottom: 8,
                      color: "#3b82f6",
                    }}
                  >
                    ParkEasy Booking Receipt
                  </div>
                  <div>
                    <b>Booking ID:</b> {bookingId}
                  </div>
                  <div>
                    <b>Parking Lot:</b> {lotName}
                  </div>
                  <div>
                    <b>Vehicle Type:</b> {booking.vehicleType || "N/A"}
                  </div>
                  <div>
                    <b>Booked At:</b> {formatDateTime(bookingTime)}
                  </div>
                  {booking.startTime && booking.endTime && (
                    <div>
                      <b>Duration:</b> {formatDateTime(booking.startTime)} -{" "}
                      {formatDateTime(booking.endTime)}
                    </div>
                  )}
                  <div>
                    <b>Status:</b> {status}
                  </div>
                  <div>
                    <b>Price:</b> ₹{price}
                  </div>
                  <div>
                    <b>Vehicle:</b> {vehicleNum}
                  </div>
                  {mapsLink && (
                    <div>
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#60a5fa" }}
                      >
                        View on Map
                      </a>
                    </div>
                  )}
                  <div style={{ margin: "8px 0" }}>
                    <img src={getQRCodeUrl(booking)} alt="QR Code" />
                  </div>
                </div>

                {/* Visible compact booking summary */}
                <div className="booking-summary">
                  <div className="summary-header">
                    <div className="summary-title">{lotName}</div>
                    <div
                      className={`summary-status status-${status.toLowerCase()}`}
                    >
                      {status}
                    </div>
                  </div>
                  <div className="summary-row">
                    <b>Vehicle:</b> {vehicleNum} ({booking.vehicleType || "N/A"}
                    )
                  </div>
                  <div className="summary-row">
                    <b>Booked:</b> {formatDateTime(bookingTime)}
                  </div>
                  {booking.startTime && booking.endTime && (
                    <div className="summary-row">
                      <b>Window:</b> {formatDateTime(booking.startTime)} -{" "}
                      {formatDateTime(booking.endTime)}
                    </div>
                  )}
                  <div className="summary-row">
                    <b>Duration:</b> {booking.duration || "N/A"} hours
                  </div>
                  <div className="summary-row">
                    <b>Price:</b> ₹{price}
                  </div>
                  {mapsLink && (
                    <div className="summary-row">
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="maps-link"
                      >
                        View on Map
                      </a>
                    </div>
                  )}
                </div>
                <button
                  className="receipt-btn"
                  onClick={() => downloadReceiptAsImage(globalIndex)}
                >
                  Download Receipt
                </button>
                {getDestinationCoords(booking) && (
                  <button
                    className="directions-btn"
                    onClick={() => openDirections(booking)}
                    title="Open directions in Google Maps"
                  >
                    Directions
                  </button>
                )}
                {(status === "Upcoming" || status === "Active") && (
                  <button
                    className="cancel-btn"
                    disabled={!!cancelling[bookingId]}
                    onClick={() => cancelBooking(bookingId)}
                  >
                    {cancelling[bookingId] ? "Cancelling..." : "Cancel Booking"}
                  </button>
                )}
                {status === "Active" && (
                  <button
                    className="receipt-btn"
                    style={{ background: "#2563eb" }}
                    disabled={!!completing[bookingId]}
                    onClick={() => completeBooking(bookingId)}
                  >
                    {completing[bookingId] ? "Completing..." : "Complete"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
