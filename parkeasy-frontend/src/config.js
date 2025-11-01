// Central API base; resolves to your machine IP when opened from another device.
export const API_BASE = (() => {
  try {
    const host = window.location.hostname || "localhost";
    const port = 8080;
    return `http://${host}:${port}`;
  } catch {
    return "http://localhost:8080";
  }
})();
