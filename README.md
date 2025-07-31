# 🚗 EZpark

**EZpark** is a full-stack smart parking solution built with **React** and **Node.js**, designed to make parking management seamless in malls, public spaces, and commercial areas.

---

## 🛠️ Tech Stack

- **Frontend:** React, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **Authentication:** Firebase Auth  
- **Database:** MongoDB (Atlas)  
- **Payments:** Razorpay  
- **Geolocation & Maps:** HTML Geolocation API, Map API integration

---

## 📦 Features

- 🔐 User Registration & Login (JWT Authentication)  
- 📍 Live Location Detection  
- 🅿️ Nearby Parking Slot Suggestion  
- 🎟️ Advance Parking Slot Booking  
- 💳 Online Payment Integration  
- 📅 Date & Time-Based Slot Reservation  
- 🗺️ Admin Dashboard for Lot Management  
- 📈 Total Working Hours for Attendants  
- 📜 Terms & Conditions on Booking

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/shreemadkumbhani/EZpark.git
cd EZpark
```

### 2. Setup Backend

```bash
cd parkeasy-backend
npm install
```

Create a `.env` file in `parkeasy-backend`:

```env
PORT=8080
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

Then start the backend server:

```bash
npm start
```

### 3. Setup Frontend

```bash
cd ../parkeasy-frontend
npm install
npm start
```

---

## 📂 Project Structure

```
EZpark/
├── parkeasy-frontend/   # React App
├── parkeasy-backend/    # Node + Express Backend
├── README.md
└── .gitignore
```

---

## 🧪 Future Enhancements

- Push Notifications on Slot Status  
- QR Code-Based Check-in/Checkout  
- Admin Analytics Dashboard  
- Vehicle License Plate Recognition

---

## 🤝 Contributing

Feel free to fork the repo and open a pull request. For major changes, open an issue first to discuss what you'd like to change.

---

## 📄 License

This project is licensed under the MIT License.
