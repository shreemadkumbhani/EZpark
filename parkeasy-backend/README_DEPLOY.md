# ParkEasy Backend – Deploying to Render

This repo is a Node/Express + MongoDB API.

## One-click Render deployment

- Render can read `render.yaml` at the repo root.
- It will install dependencies and run `node server.js`.

## Required environment variables

Set these in Render service → Environment:

- `MONGO_URI` – your MongoDB connection string
- `JWT_SECRET` – random secret for JWTs
- `FRONTEND_URL` – your Vercel app URL (e.g., `https://<app>.vercel.app`)
 - `RAZORPAY_KEY_ID` – Razorpay key id (publishable)
 - `RAZORPAY_KEY_SECRET` – Razorpay secret key

Note: The server listens on `process.env.PORT` provided by Render.

## Local development

```
npm install
npm run dev
```

The dev server runs on http://localhost:8080

Create a `.env` based on `.env.example` and fill in values. Do not commit `.env`.
