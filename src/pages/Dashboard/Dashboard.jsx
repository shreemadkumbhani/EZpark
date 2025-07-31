import { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";

export default function Dashboard() {
  const [location, setLocation] = useState(null);
  const [parkingLots, setParkingLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });

        try {
          const res = await axios.get("http://localhost:8080/api/parkinglots", {
            params: { lat: latitude, lng: longitude },
          });

          setParkingLots(res.data.parkingLots || []);
        } catch (err) {
          setError("Could not fetch parking lots.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError("Location permission denied.");
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">📍 Park Nearby with ParkEasy</h2>

      {loading && <p>Detecting nearest parking lots...</p>}

      {error && <p style={{ color: "#ef4444" }}>{error}</p>}

      {!loading && !error && parkingLots.length === 0 && (
        <p>No nearby parking lots found.</p>
      )}

      <div className="slot-grid">
        {parkingLots.map((lot, index) => (
          <div key={index} className="slot available">
            <div style={{ fontWeight: "bold" }}>{lot.name}</div>
            <div style={{ fontSize: "12px" }}>
              {lot.availableSlots} slots left
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
