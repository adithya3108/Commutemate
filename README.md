# CommuteMate — Codebase

> "You're already going. Bring someone along."

A commute-sharing platform for IT park corridors. Nobody earns. Everyone saves.

---

## Project structure

```
commutemate-app/
├── backend/          Node.js + Express + PostgreSQL (PostGIS)
├── mobile/           React Native app (iOS + Android)
└── shared/           Shared types and constants
```

## Quick start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ with PostGIS extension
- React Native environment (see https://reactnative.dev/docs/getting-started)
- Google Maps API key

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/commutemate.git
cd commutemate-app

# Install backend deps
cd backend && npm install

# Install mobile deps
cd ../mobile && npm install
```

### 2. Set up environment

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in: DATABASE_URL, GOOGLE_MAPS_API_KEY, JWT_SECRET, etc.
```

### 3. Set up database

```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

### 4. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — mobile
cd mobile && npx react-native start

# Terminal 3 — run on device
cd mobile && npx react-native run-android
# or
cd mobile && npx react-native run-ios
```

---

## Tech stack

| Layer | Tech |
|-------|------|
| Mobile | React Native 0.73 |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 15 + PostGIS |
| ORM | Prisma |
| Auth | JWT + work email verification |
| Maps | Google Maps Routes API |
| Payments | Razorpay / UPI deeplink |
| Push | Firebase Cloud Messaging |

---

## Product principles

Nobody earns. Everyone saves. The sharer is never called a driver.  
Full principles → see `../docs/PRODUCT_PRINCIPLES.md`
