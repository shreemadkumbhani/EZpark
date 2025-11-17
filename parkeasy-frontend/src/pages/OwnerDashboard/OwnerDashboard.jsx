import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../config";
import { useAuth } from "../../context/AuthContext";
import "./OwnerDashboard.css";

export default function OwnerDashboard() {
  const { role } = useAuth();
  const [lots, setLots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    async function initialLoad() {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [lotsRes, bookingsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/parkinglots/owner`, { headers }),
          axios.get(`${API_BASE}/api/bookings/owner-lots`, { headers }),
        ]);
        setLots(lotsRes.data?.parkingLots || []);
        setBookings(bookingsRes.data?.bookings || []);
        setLastUpdated(new Date());
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load owner data");
      } finally {
        setLoading(false);
      }
    }
    if (role === "owner" || role === "admin") initialLoad();
  }, [role]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    async function autoRefresh() {
      if (role !== "owner" && role !== "admin") return;
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const [lotsRes, bookingsRes] = await Promise.all([
          axios.get(`${API_BASE}/api/parkinglots/owner`, { headers }),
          axios.get(`${API_BASE}/api/bookings/owner-lots`, { headers }),
        ]);
        setLots(lotsRes.data?.parkingLots || []);
        setBookings(bookingsRes.data?.bookings || []);
        setLastUpdated(new Date());
      } catch (err) {
        // Silent fail for auto refresh
      }
    }
    const interval = setInterval(autoRefresh, 15000); // 15s interval for fresher updates
    return () => clearInterval(interval);
  }, [role]);

  async function manualRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const [lotsRes, bookingsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/parkinglots/owner`, { headers }),
        axios.get(`${API_BASE}/api/bookings/owner-lots`, { headers }),
      ]);
      setLots(lotsRes.data?.parkingLots || []);
      setBookings(bookingsRes.data?.bookings || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  // Group bookings by parkingLotId (MongoDB field)
  const grouped = bookings.reduce((acc, b) => {
    const k = b.parkingLotId?._id || b.parkingLotId || b.lotId || "unknown";
    if (!acc[k]) acc[k] = [];
    acc[k].push(b);
    return acc;
  }, {});

  // Pre-sort bookings inside groups by startTime (recent first)
  const sortedGroupedEntries = Object.entries(grouped).map(([lotId, list]) => {
    const sorted = [...list].sort(
      (a, b) => new Date(b.startTime) - new Date(a.startTime)
    );
    return [lotId, sorted];
  });

  return (
    <div className="owner-dash-wrap">
      <h2 className="owner-dash-title">Owner Dashboard</h2>
      {role !== "owner" && role !== "admin" && (
        <p>You must become an owner to view this dashboard.</p>
      )}
      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {!loading && !error && (role === "owner" || role === "admin") && (
        <div className="owner-dash-content">
          <div className="owner-controls" style={{ marginBottom: 20 }}>
            <button
              onClick={manualRefresh}
              disabled={refreshing}
              className="small-button"
              style={{ minWidth: 120 }}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <span style={{ marginLeft: 12, fontSize: "0.75rem", opacity: 0.8 }}>
              {lastUpdated
                ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
                : "Not updated yet"}
            </span>
            <span style={{ marginLeft: 16, fontSize: "0.75rem" }}>
              Active bookings: {bookings.filter((b) => b.status === "active").length}
            </span>
          </div>
          <section className="owner-lots">
            <h3>Your Lots ({lots.length})</h3>
            {lots.length === 0 && <p>No lots registered yet.</p>}
            <div className="lots-grid">
              {lots.map((lot) => (
                <div key={lot._id} className="lot-card">
                  <div className="lot-name">{lot.name}</div>
                  <div className="lot-slots">
                    Slots: {lot.availableSlots}/{lot.totalSlots}
                  </div>
                  <div className="lot-address">
                    {lot.address?.line1} {lot.address?.city}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section className="owner-bookings">
            <h3>Customer Bookings ({bookings.length})</h3>
            {bookings.length === 0 && <p>No bookings yet.</p>}
            {sortedGroupedEntries.map(([lotId, list]) => {
              const lot = lots.find((l) => l._id === lotId);
              return (
                <div key={lotId} className="booking-group">
                  <h4>
                    {lot?.name || "Unknown Lot"} ({list.length})
                  </h4>
                  {/* Desktop table view */}
                  <table className="booking-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Vehicle</th>
                        <th>Status</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((b) => (
                        <tr key={b._id || b.id}>
                          <td>{b.userName || b.userId?.name || "N/A"}</td>
                          <td>
                            {b.vehicleNumber || b.vehicle || "N/A"} (
                            {b.vehicleType || "N/A"})
                          </td>
                          <td>
                            <span className={`status-badge status-${b.status}`}>
                              {b.status}
                            </span>
                          </td>
                          <td>{new Date(b.startTime).toLocaleString()}</td>
                          <td>{new Date(b.endTime).toLocaleString()}</td>
                          <td>₹{b.totalPrice || b.price || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Mobile card view */}
                  <div className="booking-cards">
                    {list.map((b) => (
                      <div key={b._id || b.id} className="booking-card">
                        <div className="booking-card-row">
                          <span className="booking-card-label">Customer</span>
                          <span className="booking-card-value">
                            {b.userName || b.userId?.name || "N/A"}
                          </span>
                        </div>
                        <div className="booking-card-row">
                          <span className="booking-card-label">Vehicle</span>
                          <span className="booking-card-value">
                            {b.vehicleNumber || b.vehicle || "N/A"} (
                            {b.vehicleType || "N/A"})
                          </span>
                        </div>
                        <div className="booking-card-row">
                          <span className="booking-card-label">Status</span>
                          <span className={`status-badge status-${b.status}`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="booking-card-row">
                          <span className="booking-card-label">Start</span>
                          <span className="booking-card-value">
                            {new Date(b.startTime).toLocaleString()}
                          </span>
                        </div>
                        <div className="booking-card-row">
                          <span className="booking-card-label">End</span>
                          <span className="booking-card-value">
                            {new Date(b.endTime).toLocaleString()}
                          </span>
                        </div>
                        <div className="booking-card-row">
                          <span className="booking-card-label">Price</span>
                          <span className="booking-card-value">
                            ₹{b.totalPrice || b.price || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
          <div style={{ marginTop: 24 }}>
            <a href="/owner/register" className="owner-add-link">
              ➕ Add New Parking
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
