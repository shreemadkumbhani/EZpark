import html2canvas from "html2canvas";

export function formatDateTime(dt) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt);
  }
}

export function computeStatus(booking) {
  const raw = booking.status;
  if (raw && typeof raw === "string") {
    const normalized = raw.trim().toLowerCase();
    if (["active", "upcoming", "completed", "cancelled"].includes(normalized)) {
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
  }
  const now = Date.now();
  const start = booking.startTime
    ? new Date(booking.startTime).getTime()
    : null;
  const end = booking.endTime ? new Date(booking.endTime).getTime() : null;
  if (end && now > end) return "Completed";
  if (start && now < start) return "Upcoming";
  return "Active";
}

export function getMapsLink(booking) {
  if (booking.parkingLotId?.location?.coordinates) {
    const [lng, lat] = booking.parkingLotId.location.coordinates;
    return `https://www.google.com/maps?q=${lat},${lng}`;
  }
  if (booking.latitude && booking.longitude) {
    return `https://www.google.com/maps?q=${booking.latitude},${booking.longitude}`;
  }
  return null;
}

export function getDestinationCoords(booking) {
  if (booking.parkingLotId?.location?.coordinates) {
    const [lng, lat] = booking.parkingLotId.location.coordinates;
    return { lat, lng };
  }
  if (booking.latitude && booking.longitude) {
    return { lat: Number(booking.latitude), lng: Number(booking.longitude) };
  }
  return null;
}

export function getLotDisplayName(booking) {
  return (
    booking.parkingLotName ||
    booking.lotName ||
    booking.parkingLotId?.name ||
    "(Unknown)"
  );
}

export function getVehicleNumber(booking) {
  return booking.vehicleNumber || booking.vehicle || "-";
}

export function getQRCodeUrl(booking) {
  const lotName = getLotDisplayName(booking);
  const qrData = `Booking ID: ${
    booking._id || booking.id
  }\nLot: ${lotName}\nVehicle: ${getVehicleNumber(
    booking
  )}\nTime: ${formatDateTime(booking.createdAt || booking.time)}`;
  const encodedData = encodeURIComponent(qrData);
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodedData}&bgcolor=23232a&color=ffffff`;
}

export async function downloadReceiptAsImage(globalIndex) {
  const node = document.getElementById(`receipt-card-${globalIndex}`);
  if (!node) return;
  const canvas = await html2canvas(node, { backgroundColor: null });
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = `booking-receipt-${globalIndex + 1}.png`;
  a.click();
}

export function openDirections(booking) {
  const dest = getDestinationCoords(booking);
  if (!dest) return;
  const openWith = (url) => window.open(url, "_blank", "noopener,noreferrer");
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${dest.lat},${dest.lng}&travelmode=driving`;
        openWith(url);
      },
      () => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`;
        openWith(url);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  } else {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}&travelmode=driving`;
    openWith(url);
  }
}
