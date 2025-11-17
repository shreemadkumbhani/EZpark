// Navigation bar component for ParkEasy app
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { isAuthed, user, logout, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Lock body scroll robustly when mobile menu is open (prevents underlay scroll/interactions)
  useEffect(() => {
    if (!menuOpen) return;
    const scrollY = window.scrollY;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overscroll: document.documentElement.style.overscrollBehavior,
    };
    // Prevent background scroll and iOS rubber-band
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      // Restore styles and scroll position
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      document.documentElement.style.overscrollBehavior = prev.overscroll;
      window.scrollTo(0, scrollY);
    };
  }, [menuOpen]);

  // Handle user logout
  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        🚗 ParkEasy{" "}
        {isAuthed && (
          <span className="role-badge" title={`Role: ${role}`}>
            {role}
          </span>
        )}
      </div>
      <button
        className="menu-toggle"
        aria-label="Open menu"
        onClick={() => setMenuOpen((v) => !v)}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 6h18M3 12h18M3 18h18"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <ul className="navbar-links desktop">
        {/* Always show Home link */}
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        {/* Only show payment for regular users, not owners */}
        {isAuthed && role !== "owner" && role !== "admin" && (
          <li>
            <Link to="/payment">Payment</Link>
          </li>
        )}
        {/* Show Login/Register if not logged in */}
        {!isAuthed && (
          <>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
          </>
        )}
        {/* Show dashboard, history, owner links, and logout if logged in */}
        {isAuthed && (
          <>
            {role === "owner" || role === "admin" ? (
              <li>
                <Link to="/owner/dashboard">Owner Dashboard</Link>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link to="/booking-history">History</Link>
                </li>
              </>
            )}
            {(role === "owner" || role === "admin") && (
              <li>
                <Link to="/owner/register">Add Parking</Link>
              </li>
            )}
            <li>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)}>
          <div
            className="mobile-menu"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="menu-close"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              ✕
            </button>
            <ul>
              <li>
                <Link to="/" onClick={() => setMenuOpen(false)}>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" onClick={() => setMenuOpen(false)}>
                  About
                </Link>
              </li>
              {/* Only show payment for regular users, not owners */}
              {isAuthed && role !== "owner" && role !== "admin" && (
                <li>
                  <Link to="/payment" onClick={() => setMenuOpen(false)}>
                    Payment
                  </Link>
                </li>
              )}
              {!isAuthed && (
                <>
                  <li>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" onClick={() => setMenuOpen(false)}>
                      Register
                    </Link>
                  </li>
                </>
              )}
              {isAuthed && (
                <>
                  {role === "owner" || role === "admin" ? (
                    <li>
                      <Link
                        to="/owner/dashboard"
                        onClick={() => setMenuOpen(false)}
                      >
                        Owner Dashboard
                      </Link>
                    </li>
                  ) : (
                    <>
                      <li>
                        <Link
                          to="/dashboard"
                          onClick={() => setMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/booking-history"
                          onClick={() => setMenuOpen(false)}
                        >
                          History
                        </Link>
                      </li>
                    </>
                  )}
                  {(role === "owner" || role === "admin") && (
                    <li>
                      <Link
                        to="/owner/register"
                        onClick={() => setMenuOpen(false)}
                      >
                        Add Parking
                      </Link>
                    </li>
                  )}
                  <li>
                    <button onClick={handleLogout} className="logout-btn">
                      Logout
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}
