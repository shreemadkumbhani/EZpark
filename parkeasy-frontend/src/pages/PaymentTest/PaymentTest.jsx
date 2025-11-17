import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../../config";
import "./PaymentTest.css";

export default function PaymentTest() {
  const [amount, setAmount] = useState("100");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadRazorpayCheckout() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });
  }

  const showToast = (msg, isSuccess = true) => {
    try {
      const toast = document.createElement("div");
      toast.textContent = msg;
      toast.style.position = "fixed";
      toast.style.right = "20px";
      toast.style.bottom = "20px";
      toast.style.zIndex = 9999;
      toast.style.background = isSuccess
        ? "rgba(34,197,94,0.95)"
        : "rgba(239,68,68,0.95)";
      toast.style.color = "white";
      toast.style.padding = "12px 16px";
      toast.style.borderRadius = "10px";
      toast.style.boxShadow = "0 8px 30px rgba(0,0,0,0.2)";
      toast.style.fontWeight = "600";
      toast.style.backdropFilter = "saturate(180%) blur(8px)";
      document.body.appendChild(toast);
      setTimeout(() => {
        try {
          document.body.removeChild(toast);
        } catch {}
      }, 3000);
    } catch {}
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        setMessage("Please enter a valid amount");
        setLoading(false);
        return;
      }

      await loadRazorpayCheckout();

      // Get Razorpay key
      const keyRes = await axios.get(`${API_BASE}/api/payments/key`);
      const keyId = keyRes.data?.keyId;
      if (!keyId) {
        throw new Error("Payment key not configured");
      }

      // Create a test order
      const orderRes = await axios.post(`${API_BASE}/api/payments/test-order`, {
        amount: amountValue,
      });
      const order = orderRes.data?.order;
      if (!order?.id) {
        throw new Error("Failed to create payment order");
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ParkEasy Payment Test",
        description: "Test payment gateway",
        order_id: order.id,
        prefill: {
          name: "Test User",
          email: "test@parkeasy.com",
          contact: "9999999999",
        },
        handler: async function (response) {
          try {
            // Verify payment
            await axios.post(`${API_BASE}/api/payments/test-verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            showToast("✅ Payment successful!", true);
            setMessage("Payment verified successfully!");
            setLoading(false);
          } catch (e) {
            showToast(
              "❌ Payment verification failed: " +
                (e.response?.data?.message || e.message),
              false
            );
            setMessage("Payment verification failed");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setMessage("Payment cancelled");
            setLoading(false);
          },
        },
        theme: { color: "#4f46e5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setMessage(
        err.response?.data?.message || err.message || "Failed to initiate payment"
      );
      showToast("❌ " + (err.response?.data?.message || err.message), false);
      setLoading(false);
    }
  };

  return (
    <div className="payment-test-page">
      <div className="payment-test-container">
        <div className="payment-test-card">
          <h1>💳 Payment Gateway Test</h1>
          <p className="subtitle">Test Razorpay integration for ParkEasy</p>

          <form onSubmit={handlePayment} className="payment-form">
            <div className="form-group">
              <label htmlFor="amount">Amount (₹)</label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                step="0.01"
                className="form-control"
                placeholder="Enter amount"
                required
              />
            </div>

            <div className="amount-display">
              Total: ₹{parseFloat(amount || 0).toFixed(2)}
            </div>

            {message && (
              <div
                className={`message ${
                  message.includes("success") ? "success" : "error"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              className="pay-button"
              disabled={loading}
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          </form>

          <div className="test-info">
            <h3>🧪 Test Mode</h3>
            <p>Use Razorpay test credentials:</p>
            <ul>
              <li>Card: 4111 1111 1111 1111</li>
              <li>CVV: Any 3 digits</li>
              <li>Expiry: Any future date</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
