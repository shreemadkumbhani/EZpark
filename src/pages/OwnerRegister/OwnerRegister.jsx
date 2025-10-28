// Page for parking owners to register their parking lot
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./OwnerRegister.css";

// Fix Leaflet's default icon paths in bundlers (Vite)
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

export default function OwnerRegister() {
  // State variables for form fields and UI
  const [name, setName] = useState(""); // Parking lot name
  const [position, setPosition] = useState(null); // { lat, lng }
  const [totalSlots, setTotalSlots] = useState(""); // Total slots
  // Address fields
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const [msg, setMsg] = useState(""); // Status message
  // Get user role from localStorage (default to 'user')
  const [role, setRole] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null")?.role || "user";
    } catch {
      return "user";
    }
  });
  const token = localStorage.getItem("token"); // Auth token

  // On mount, try to auto-detect current location for map center
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
      });
    }
  }, []);

  // Handle form submission to register a new parking lot
  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      if (!position) throw new Error("Please select a location on the map");
      await axios.post(
        "http://localhost:8080/api/parkinglots",
        {
          name,
          latitude: Number(position.lat),
          longitude: Number(position.lng),
          totalSlots: Number(totalSlots),
          address: {
            line1,
            line2,
            landmark,
            city,
            state: stateName,
            pincode,
          },
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      setMsg("Parking lot registered successfully!");
      setName("");
      setTotalSlots("");
      setLine1("");
      setLine2("");
      setLandmark("");
      setCity("");
      setStateName("");
      setPincode("");
    } catch (err) {
      setMsg(err.response?.data?.message || "Could not register parking lot");
    } finally {
      setLoading(false);
    }
  }

  // Request to become an owner (upgrade user role)
  async function becomeOwner() {
    setMsg("");
    try {
      await axios.post(
        "http://localhost:8080/api/parkinglots/become-owner",
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      // Update user role in localStorage
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

  // Leaflet map setup
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  useEffect(() => {
    if (!mapRef.current) {
      const center = position
        ? [position.lat, position.lng]
        : [23.0225, 72.5714];
      const map = L.map("owner-map").setView(center, 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      map.on("click", (e) => {
        const pos = { lat: e.latlng.lat, lng: e.latlng.lng };
        setPosition(pos);
        if (!markerRef.current) {
          markerRef.current = L.marker([pos.lat, pos.lng]).addTo(map);
        } else {
          markerRef.current.setLatLng([pos.lat, pos.lng]);
        }
      });
      mapRef.current = map;
    }
  }, [position]);
  // When position changes first time (from geolocation), sync map/marker
  useEffect(() => {
    if (!mapRef.current || !position) return;
    mapRef.current.setView([position.lat, position.lng], 14);
    if (!markerRef.current) {
      markerRef.current = L.marker([position.lat, position.lng]).addTo(
        mapRef.current
      );
    } else {
      markerRef.current.setLatLng([position.lat, position.lng]);
    }
  }, [position]);

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
        <div>
          <div className="map-label">Select Location (drop a pin)</div>
          <div className="map-wrap">
            <div id="owner-map" className="map" />
          </div>
          <div className="coords">
            <span>Latitude: {position ? position.lat.toFixed(6) : "-"}</span>
            <span>Longitude: {position ? position.lng.toFixed(6) : "-"}</span>
            <button
              type="button"
              className="owner-submit use-location"
              onClick={() => {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition((pos) => {
                    setPosition({
                      lat: Number(pos.coords.latitude.toFixed(6)),
                      lng: Number(pos.coords.longitude.toFixed(6)),
                    });
                    if (mapRef.current) {
                      mapRef.current.setView(
                        [
                          Number(pos.coords.latitude.toFixed(6)),
                          Number(pos.coords.longitude.toFixed(6)),
                        ],
                        14
                      );
                    }
                  });
                }
              }}
            >
              Use my location
            </button>
          </div>
        </div>

        <fieldset className="address">
          <legend>Address</legend>
          <label>
            Address Line 1
            <input
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              placeholder="House/Building, Street"
              required
            />
          </label>
          <label>
            Area / Line 2 (optional)
            <input
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              placeholder="Area, Locality"
            />
          </label>
          <label>
            Landmark (optional)
            <input
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Nearby landmark"
            />
          </label>
          <div className="row">
            <label>
              City
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </label>
            <label>
              State
              <input
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                required
              />
            </label>
          </div>
          <label>
            Pincode
            <input
              value={pincode}
              onChange={(e) =>
                setPincode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              placeholder="6-digit pincode"
              inputMode="numeric"
              pattern="^[0-9]{6}$"
              required
            />
          </label>
        </fieldset>
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
