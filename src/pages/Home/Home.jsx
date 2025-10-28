import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Home.css";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("token")
  );
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "token" || e.key === "user") {
        setIsLoggedIn(!!localStorage.getItem("token"));
        try {
          setUser(JSON.parse(localStorage.getItem("user") || "null"));
        } catch {
          setUser(null);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const ctaTo = isLoggedIn ? "/dashboard" : "/login";
  const ctaText = isLoggedIn ? "Go to Dashboard" : "Get Started";

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          {isLoggedIn ? (
            <>
              <h2>Welcome back{user?.name ? `, ${user.name}` : "!"}</h2>
              <p>
                Jump into your dashboard to find spots near you or view your
                recent bookings.
              </p>
            </>
          ) : (
            <>
              <h2>Book Your Parking Slot Easily!</h2>
              <p>
                Skip the hassle and find a spot instantly at malls and public
                spaces.
              </p>
            </>
          )}
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <Link to={ctaTo} className="hero-cta">
              {ctaText}
            </Link>
            {isLoggedIn && (
              <Link to="/booking-history" className="hero-cta alt">
                View History
              </Link>
            )}
          </div>
        </div>
      </section>
      <section className="featured-section">
        <h3>
          {isLoggedIn ? "Quick picks near you" : "Popular Parking Locations"}
        </h3>
        <div className="card-list">
          <div className="card">🏬 Phoenix Mall</div>
          <div className="card">🛍️ City Center</div>
          <div className="card">🏙️ Downtown Plaza</div>
        </div>
      </section>
    </div>
  );
}
