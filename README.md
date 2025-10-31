# EZpark

This repository contains a full-stack parking booking app (frontend and backend).

Quick start (Windows)

1. Install Node.js (recommended: 18.x or 20.x LTS) and MongoDB.
2. Clone the repository and open PowerShell or CMD at the project root.
3. Copy example env and fill values:

```powershell
cd EZpark\parkeasy-backend
copy .env.example .env
# edit .env and set MONGO_URI and PORT if needed
```

4. Install dependencies and freeze them (lockfiles included):

```powershell
cd ..\..\
npm install
```

5. Start both servers from project root:

```powershell
npm run dev
```

This runs backend (nodemon) and frontend (Vite) concurrently.

If you prefer to run services separately:

```powershell
cd parkeasy-backend
npm install
npm run dev

cd ..\parkeasy-frontend
npm install
npm run dev
```

Uploading to GitHub

I prepared the repo for committing (added `.gitignore`, `package.json` at root) but did not push to your remote. To push to GitHub from this machine:

```powershell
git add .
git commit -m "Prepare project for Windows: freeze deps, root scripts, map picker"
git push origin main
```

## Deploying backend on Render

1. Ensure you have a cloud MongoDB (e.g., MongoDB Atlas). Copy the SRV connection string.
2. Render will detect `render.yaml` automatically when you choose Blueprint > this repo.
3. In the Render service environment, set:
   - MONGO_URI = your Atlas connection string
   - JWT_SECRET = a strong secret
   - FRONTEND_URL = your frontend origin (e.g., http://localhost:5173 or your hosted URL)
   - NODE_VERSION = 20 (optional; already in the blueprint)
   - (Frontend) VITE_API_BASE = the Render backend URL (e.g., https://your-api.onrender.com)
4. Deploy. The app listens on `process.env.PORT` provided by Render automatically.
5. If you see `ECONNREFUSED 127.0.0.1:27017`, it means you're pointing to a local MongoDB. Switch to Atlas.

## Frontend production config

Create `parkeasy-frontend/.env.production` to point the app to your hosted backend:

VITE_API_BASE=https://your-api.onrender.com

And set `FRONTEND_URL` in the backend environment to your frontend's origin so CORS allows it.
If you want, I can attempt to create the commit and push for you now (requires your git credentials to be available in the environment).

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
