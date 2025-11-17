import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SplashScreen from "./components/SplashScreen";
import Dashboard from "./pages/Dashboard/Dashboard";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/Login/ForgotPassword";
import ResetPassword from "./pages/Login/ResetPassword";
import BookingHistory from "./pages/BookingHistory/BookingHistory";
import Home from "./pages/Home/Home";
import OwnerRegister from "./pages/OwnerRegister/OwnerRegister";
import About from "./pages/About/About";
import Payment from "./pages/Payment/Payment";
import OwnerDashboard from "./pages/OwnerDashboard/OwnerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    console.log("🚗 App component mounted");
    const timer = setTimeout(() => {
      console.log("⏱️ Splash timeout complete, showing main app");
      setShowSplash(false);
    }, 1500); // 5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={["user", "owner", "admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/booking-history"
            element={
              <ProtectedRoute roles={["user", "owner", "admin"]}>
                <BookingHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/register"
            element={
              <ProtectedRoute roles={["user", "owner", "admin"]}>
                <OwnerRegister />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute roles={["owner", "admin"]}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/payment" element={<Payment />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
