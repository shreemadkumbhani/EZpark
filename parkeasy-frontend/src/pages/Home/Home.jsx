import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home">

      <section className="hero">
        <div className="hero-content">
          <h2>Book Your Parking Slot Easily!</h2>
          <p>
            Skip the hassle and find a spot instantly at malls and public
            spaces.
          </p>
          <Link to="/login" className="hero-cta">
            Get Started
          </Link>
        </div>
      </section>

      <section className="featured-section">
        <h3>Popular Parking Locations</h3>
        <div className="card-list">
          <div className="card">🏬 Phoenix Mall</div>
          <div className="card">🛍️ City Center</div>
          <div className="card">🏙️ Downtown Plaza</div>
        </div>
      </section>
    </div>
  );
}
