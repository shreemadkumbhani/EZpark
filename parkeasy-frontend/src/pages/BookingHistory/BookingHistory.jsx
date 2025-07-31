import { useEffect, useState } from "react";
import "./BookingHistory.css";

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    // Simulating fetch from localStorage or backend
    const data = JSON.parse(localStorage.getItem("bookings")) || [];
    setBookings(data);
  }, []);

  return (
    <div className="history-container">
      <h2 className="history-title">🕓 Booking History</h2>
      {bookings.length === 0 ? (
        <p className="no-history">No previous bookings found.</p>
      ) : (
        <ul className="history-list">
          {bookings.map((booking, index) => (
            <li key={index} className="history-item">
              Slot #{booking.slot} booked at{" "}
              {new Date(booking.time).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
