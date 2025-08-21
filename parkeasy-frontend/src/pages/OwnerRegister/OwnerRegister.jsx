import { useEffect, useState } from "react";
import axios from "axios";
import "./OwnerRegister.css";

export default function OwnerRegister() {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [totalSlots, setTotalSlots] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [role, setRole] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null")?.role || "user";
    } catch {
      return "user";
    }
  });
  const token = localStorage.getItem("token");

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      });
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:8080/api/parkinglots",
        {
          name,
          latitude: Number(latitude),
          longitude: Number(longitude),
          totalSlots: Number(totalSlots),
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      setMsg("Parking lot registered successfully!");
      setName("");
      setTotalSlots("");
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not register parking lot");
    } finally {
      setLoading(false);
    }
  }

  async function becomeOwner() {
    setMsg("");
    try {
      await axios.post(
        "http://localhost:8080/api/parkinglots/become-owner",
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user) {
        user.role = "owner";
        localStorage.setItem("user", JSON.stringify(user));
      }
      setRole("owner");
      setMsg("You're now an owner. You can add parking below.");
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to update role");
    }
  }

  return (
    <div className="owner-wrap">
      <h2 className="owner-title">Register Your Parking</h2>
      {role !== "owner" && (
        <div
          style={{
            maxWidth: 520,
            margin: "0 auto 14px auto",
            textAlign: "center",
          }}
        >
          <p>To add parking, become an owner.</p>
          <button className="owner-submit" onClick={becomeOwner}>
            Become Owner
          </button>
        </div>
      )}
      <form className="owner-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Parking name"
            required
          />
        </label>
        <div className="row">
          <label>
            Latitude
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="e.g. 23.03"
              required
            />
          </label>
          <label>
            Longitude
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="e.g. 72.55"
              required
            />
          </label>
        </div>
        <label>
          Total Slots
          <input
            type="number"
            min="1"
            value={totalSlots}
            onChange={(e) => setTotalSlots(e.target.value)}
            placeholder="e.g. 50"
            required
          />
        </label>

        <button
          className="owner-submit"
          disabled={loading || role !== "owner"}
          type="submit"
        >
          {loading ? "Submitting..." : "Register Parking"}
        </button>
      </form>
      {msg && <div className="owner-msg">{msg}</div>}
    </div>
  );
}
