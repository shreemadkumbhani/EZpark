import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../config";
import { computeStatus } from "../utils/bookingUtils";

export function useBookingHistory(options = {}) {
  const { autoRefreshMs = 30000, perPage = 2 } = options;
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState({});

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/api/bookings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setBookings(res.data.bookings || []);
    } catch (e) {
      console.error("Failed to fetch bookings", e);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    const interval = setInterval(fetchBookings, autoRefreshMs);
    return () => clearInterval(interval);
  }, [fetchBookings, autoRefreshMs]);

  useEffect(() => {
    function onStorage(e) {
      if (e.key === "bookings:refresh" && e.newValue === "1") {
        fetchBookings();
        localStorage.setItem("bookings:refresh", "0");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [fetchBookings]);

  async function cancelBooking(bookingId) {
    if (!bookingId) return;
    if (!window.confirm("Cancel this booking?")) return;
    try {
      setCancelling((s) => ({ ...s, [bookingId]: true }));
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE}/api/bookings/${bookingId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      await fetchBookings();
    } catch (e) {
      console.error("Failed to cancel booking", e);
      alert(e.response?.data?.message || "Failed to cancel booking");
    } finally {
      setCancelling((s) => ({ ...s, [bookingId]: false }));
    }
  }

  const filtered = bookings.filter((b) => {
    if (filter === "all") return true;
    const status = computeStatus(b).toLowerCase();
    return status === filter.toLowerCase();
  });

  const sorted = [...filtered].sort((a, b) => {
    const aTime = new Date(a.createdAt || a.time).getTime();
    const bTime = new Date(b.createdAt || b.time).getTime();
    return sort === "asc" ? aTime - bTime : bTime - aTime;
  });

  const totalPages = Math.ceil(sorted.length / perPage) || 1;
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  return {
    bookings,
    loading,
    filter,
    setFilter,
    sort,
    setSort,
    page: currentPage,
    setPage,
    totalPages,
    paged,
    perPage,
    fetchBookings,
    cancelBooking,
    cancelling,
  };
}
