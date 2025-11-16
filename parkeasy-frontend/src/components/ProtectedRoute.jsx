import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// roles: optional array of allowed roles (e.g. ['owner','admin'])
export default function ProtectedRoute({ children, roles }) {
  const { isAuthed, role } = useAuth();

  if (!isAuthed) return <Navigate to="/login" replace />;
  if (roles && roles.length > 0 && !roles.includes(role)) {
    // If authenticated but wrong role, send to dashboard as a safe default
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
