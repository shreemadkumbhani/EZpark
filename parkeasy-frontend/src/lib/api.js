import axios from "axios";

// Determine API base URL
// Priority: VITE_API_BASE (env) -> http://localhost:8080 (dev default)
export const API_BASE =
  import.meta.env?.VITE_API_BASE || "http://localhost:8080";

const api = axios.create({ baseURL: API_BASE });

// Attach Authorization header automatically if token exists
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token)
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
  } catch {
    // ignore localStorage access errors (e.g., SSR or blocked storage)
  }
  return config;
});

export default api;
