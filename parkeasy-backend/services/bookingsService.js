// Booking service for shared in-memory booking storage
let bookingsStore = [];
let bookingIdCounter = 1;

function generateDemoBookings(userId) {
  const now = Date.now();
  return [
    {
      id: `booking_${bookingIdCounter++}`,
      userId: userId,
      lotName: "City Center Mall",
      slot: "A12",
      time: now - 86400000,
      startTime: now - 86400000,
      endTime: now - 82800000,
      price: 50,
      vehicle: "MH12AB1234",
      latitude: 19.076,
      longitude: 72.8777,
      status: "Completed",
      review: "",
    },
    {
      id: `booking_${bookingIdCounter++}`,
      userId: userId,
      lotName: "Airport Terminal 2",
      slot: "B05",
      time: now - 3600000,
      startTime: now + 1800000,
      endTime: now + 7200000,
      price: 120,
      vehicle: "MH12CD5678",
      latitude: 19.0896,
      longitude: 72.8656,
      status: "Upcoming",
      review: "",
    },
    {
      id: `booking_${bookingIdCounter++}`,
      userId: userId,
      lotName: "Business District Plaza",
      slot: "C23",
      time: now - 7200000,
      startTime: now - 7200000,
      endTime: now + 3600000,
      price: 80,
      vehicle: "MH12EF9012",
      latitude: 19.0688,
      longitude: 72.8856,
      status: "Active",
      review: "",
    },
  ];
}

function addBooking(booking) {
  const newBooking = {
    id: `booking_${bookingIdCounter++}`,
    ...booking,
  };
  bookingsStore.push(newBooking);
  return newBooking;
}

function getBookingsForUser(userId) {
  return bookingsStore.filter((b) => b.userId === userId);
}

// Get bookings for a set of parking lot ids (owner view)
function getBookingsForLots(lotIds = []) {
  if (!Array.isArray(lotIds) || lotIds.length === 0) return [];
  const idSet = new Set(lotIds.map(String));
  return bookingsStore.filter((b) => idSet.has(String(b.lotId)));
}

function updateBookingStatus(bookingList) {
  const now = Date.now();
  return bookingList.map((b) => {
    let status = b.status;
    if (b.endTime && now > b.endTime) status = "Completed";
    else if (b.startTime && now < b.startTime) status = "Upcoming";
    else if (b.startTime && b.endTime && now >= b.startTime && now <= b.endTime)
      status = "Active";
    return { ...b, status };
  });
}

function cancelBooking(id, userId) {
  const idx = bookingsStore.findIndex(
    (b) => b.id === id && b.userId === userId
  );
  if (idx === -1) return { ok: false };
  const booking = bookingsStore[idx];
  bookingsStore.splice(idx, 1);
  return { ok: true, booking };
}

async function restockLotForCancelled(booking, ParkingLotModel) {
  if (!booking || !booking.lotId || !ParkingLotModel) return;
  try {
    const lot = await ParkingLotModel.findById(booking.lotId);
    if (!lot) return;
    lot.availableSlots = Math.min(
      (lot.availableSlots || 0) + 1,
      lot.totalSlots || (lot.availableSlots || 0) + 1
    );
    lot.carsParked = Math.max((lot.carsParked || 0) - 1, 0);
    await lot.save();
  } catch {}
}

function addReview(id, userId, review) {
  const idx = bookingsStore.findIndex(
    (b) => b.id === id && b.userId === userId
  );
  if (idx === -1) return null;
  bookingsStore[idx].review = review;
  return bookingsStore[idx];
}

module.exports = {
  addBooking,
  generateDemoBookings,
  getBookingsForUser,
  getBookingsForLots,
  updateBookingStatus,
  cancelBooking,
  restockLotForCancelled,
  addReview,
};
