import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const role = user?.role || "guest";

  const syncFromStorage = useCallback(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      setUser(u);
    } catch {
      setUser(null);
    }
    setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    const onAuthChanged = () => syncFromStorage();
    window.addEventListener("storage", onAuthChanged);
    window.addEventListener("auth:changed", onAuthChanged);
    return () => {
      window.removeEventListener("storage", onAuthChanged);
      window.removeEventListener("auth:changed", onAuthChanged);
    };
  }, [syncFromStorage]);

  function login(data) {
    if (data?.token) localStorage.setItem("token", data.token);
    if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));
    try {
      window.dispatchEvent(new Event("auth:changed"));
    } catch {}
    syncFromStorage();
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    try {
      window.dispatchEvent(new Event("auth:changed"));
    } catch {}
    syncFromStorage();
  }

  const value = { user, token, role, isAuthed: !!token, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
