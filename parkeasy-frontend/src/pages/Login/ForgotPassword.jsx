import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../config";
import "./Login.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/auth/forgot-password`, {
        email,
      });

      // Extract token and redirect user to reset password page
      if (res.data?.resetUrl) {
        try {
          const token = new URL(res.data.resetUrl).searchParams.get("token");
          if (token) {
            // Redirect directly to reset password page with token
            navigate(`/reset-password?token=${token}`);
            return;
          }
        } catch (err) {
          console.error("Failed to parse reset URL:", err);
        }
      }

      // Fallback: show success message if redirect fails
      setMessage(
        res.data?.message ||
          "If that email exists, check your inbox for reset instructions."
      );
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="login-title">Forgot Password</h2>
        {error && <p className="login-error">{error}</p>}
        {message && <p className="login-success">{message}</p>}
        <input
          type="email"
          placeholder="Enter your registered email"
          className="login-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          pattern="^[^\s@]+@gmail\.com$"
          title="Please use your Gmail address (e.g., name@gmail.com)"
          required
        />
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
