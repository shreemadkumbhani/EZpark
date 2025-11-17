import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./Payment.css";

export default function Payment() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const passedAmount = searchParams.get("amount");
  const lotName = searchParams.get("lot");
  const [form, setForm] = useState({
    name: "",
    card: "",
    expiry: "",
    cvv: "",
    amount: passedAmount || "5.00",
    email: "",
  });
  const [cardError, setCardError] = useState("");
  // Simple Luhn check for realism (still mock)
  function luhnValid(num) {
    const digits = (num || "").replace(/\D/g, "").split("").reverse();
    if (digits.length < 12) return false;
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      let d = parseInt(digits[i], 10);
      if (i % 2 === 1) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
    }
    return sum % 10 === 0;
  }

  useEffect(() => {
    if (!form.card) {
      setCardError("");
      return;
    }
    if (!luhnValid(form.card)) {
      setCardError("Card number looks invalid (Luhn check failed)");
    } else {
      setCardError("");
    }
  }, [form.card]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function fakePay(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    // Simulate network delay
    setTimeout(() => {
      setSubmitting(false);
      setResult({
        status: "success",
        id: "TXN-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
        amount: form.amount,
      });
    }, 1200);
  }

  return (
    <div className="payment-page">
      <div className="payment-card">
        <h2 className="payment-title">💳 Mock Payment</h2>
        <p className="payment-note">
          This is a <strong>demo-only</strong> payment screen. No real charges
          are made. Enter any card details to simulate a successful payment.
        </p>
        <form className="payment-form" onSubmit={fakePay}>
          <div className="form-row">
            <label>
              Name on Card
              <input
                required
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                autoComplete="cc-name"
              />
            </label>
          </div>
          <div className="form-row two">
            <label>
              Card Number
              <input
                required
                name="card"
                value={form.card}
                onChange={handleChange}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="cc-number"
              />
            </label>
            <label>
              Expiry (MM/YY)
              <input
                required
                name="expiry"
                value={form.expiry}
                onChange={handleChange}
                placeholder="12/30"
                autoComplete="cc-exp"
              />
            </label>
          </div>
          {cardError && (
            <div style={{ color: "#f87171", fontSize: "0.75rem" }}>
              {cardError}
            </div>
          )}
          <div className="form-row two">
            <label>
              CVV
              <input
                required
                name="cvv"
                value={form.cvv}
                onChange={handleChange}
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
              />
            </label>
            <label>
              Amount (USD)
              <input
                required
                name="amount"
                value={form.amount}
                onChange={handleChange}
                placeholder="5.00"
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Email for receipt
              <input
                type="email"
                required
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
          </div>
          <button className="pay-btn" disabled={submitting || !!cardError}>
            {submitting ? "Processing…" : "Pay Now"}
          </button>
        </form>
        {result && (
          <div className="payment-result">
            <h4>✅ Payment Success</h4>
            <p>
              Transaction ID: <code>{result.id}</code>
            </p>
            <p>Amount Charged: ${result.amount}</p>
            {bookingId && (
              <p style={{ fontSize: "0.75rem" }}>
                Related Booking: {bookingId}
              </p>
            )}
            {lotName && (
              <p style={{ fontSize: "0.75rem" }}>Parking Lot: {lotName}</p>
            )}
            <p style={{ fontSize: "0.75rem", opacity: 0.8 }}>
              (Not a real charge. Demo environment.)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
