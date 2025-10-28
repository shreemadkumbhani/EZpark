// Navigation bar component for ParkEasy app
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem("token");
  // Get user info from localStorage
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const navigate = useNavigate();

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">🚗 ParkEasy</div>
      <ul className="navbar-links">
        {/* Always show Home link */}
        <li>
          <Link to="/">Home</Link>
        </li>
        {/* Show Login/Register if not logged in */}
        {!isLoggedIn && (
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
        {isLoggedIn && (
          <>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/booking-history">History</Link>
            </li>
            <li>
              {/* Show Add Parking if owner, else Become Owner */}
              {user?.role === "owner" ? (
                <Link to="/owner/register">Add Parking</Link>
              ) : (
                <Link to="/owner/register">Become Owner</Link>
              )}
            </li>
            <li>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
