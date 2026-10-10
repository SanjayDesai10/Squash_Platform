# The Ball Room — Backend Plan

A guide for building the backend for the squash/pickleball court booking platform.

---

## Data Models / Database Tables

### Courts
| Field | Type | Notes |
|---|---|---|
| `id` | Integer (PK) | Auto-increment |
| `name` | String | e.g. "Court 01" |
| `type` | String | e.g. "Professional", "Premium", "Standard", "Training" |
| `description` | Text | Court description |
| `features` | Array / JSON | e.g. `["Maple Flooring", "LED Lighting"]` |
| `pricePerHour` | Integer | Price in ₹ |
| `available` | Boolean | Whether the court is open for booking |
| `image` | String (nullable) | Image URL |
| `color` | String | Hex color code for UI |

### Time Slots
| Field | Type | Notes |
|---|---|---|
| `id` | Integer (PK) | Auto-increment |
| `courtId` | Integer (FK → Courts) | Which court |
| `date` | Date | The booking date |
| `startTime` | String | e.g. "06:00", "07:00" |
| `endTime` | String | e.g. "07:00", "08:00" |
| `available` | Boolean | `false` when booked |

### Bookings
| Field | Type | Notes |
|---|---|---|
| `id` | String (PK) | Format: `SQ-2026-XXXXX` |
| `courtId` | Integer (FK → Courts) | Which court was booked |
| `date` | Date | Booking date |
| `timeSlot` | String | e.g. "6:00 PM" |
| `price` | Integer | Price in ₹ |
| `status` | Enum | `confirmed` / `cancelled` |
| `createdAt` | Timestamp | When the booking was made |
| `userId` | Integer (FK → Users, nullable) | Optional, for future auth |

### Users *(Optional — for future auth)*
| Field | Type | Notes |
|---|---|---|
| `id` | Integer (PK) | Auto-increment |
| `name` | String | Full name |
| `email` | String (unique) | Login email |
| `phone` | String | Contact number |
| `passwordHash` | String | Hashed password |

---

## API Endpoints

### Courts

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/courts` | List all courts |
| `GET` | `/api/courts/:id` | Get single court details |
| `GET` | `/api/courts/:id/slots?date=YYYY-MM-DD` | Get available time slots for a court on a specific date |

### Bookings

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/bookings` | Create a new booking |
| `GET` | `/api/bookings/:id` | Get booking details by ID |
| `DELETE` or `PATCH` | `/api/bookings/:id` | Cancel a booking |

### Facilities *(optional)*

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/facilities` | List all facilities (can stay static on frontend too) |

---

## Core Backend Logic

### Slot Availability
- When a booking is confirmed, mark that `(courtId, date, startTime)` combination as unavailable.
- Replaces the current deterministic seed-based fake availability in `src/data/mockData.js → generateTimeSlots()`.

### Booking ID Generation
- Generate unique IDs server-side in the `SQ-2026-XXXXX` format.
- Replaces the current client-side `generateBookingId()`.

### Double-Booking Prevention
- Before confirming a booking, check that the slot is still available.
- Use a database transaction or a unique constraint on `(courtId, date, startTime)` to prevent race conditions.

### Date/Time Validation
- Reject bookings in the past.
- Reject bookings outside operating hours:
  - **Mon–Fri**: 6 AM – 10 PM
  - **Sat–Sun**: 7 AM – 9 PM
- Reject bookings for courts where `available = false`.

---

## Tech Stack Decisions

Pick one from each:

| Decision | Options |
|---|---|
| **Runtime** | Node.js (Express / Fastify), Python (Flask / FastAPI), Go, etc. |
| **Database** | SQLite (simplest for local dev), PostgreSQL, MongoDB |
| **ORM** | Prisma, Drizzle, Knex, Sequelize, or raw SQL queries |
| **Auth** *(future)* | JWT, session-based, or third-party (Google OAuth) |

---

## Frontend Changes Needed After Backend Is Ready

| Current (Frontend) | Replace With |
|---|---|
| Hardcoded `courts` array in `mockData.js` | `fetch('GET /api/courts')` |
| `generateTimeSlots()` | `fetch('GET /api/courts/:id/slots?date=...')` |
| `generateBookingId()` + confirm handler | `fetch('POST /api/bookings')` |
| `facilities`, `benefits`, `stats` | Keep client-side (static content) or move to backend if you want them editable |

---

## Suggested Project Structure

```
Squash/
├── src/                    ← existing frontend
├── server/                 ← new backend
│   ├── index.js            ← entry point, server setup
│   ├── routes/
│   │   ├── courts.js       ← court endpoints
│   │   └── bookings.js     ← booking endpoints
│   ├── models/             ← database models / schemas
│   │   ├── Court.js
│   │   ├── Booking.js
│   │   └── TimeSlot.js
│   ├── middleware/          ← validation, error handling
│   ├── db/
│   │   ├── connection.js   ← database connection
│   │   └── seed.js         ← seed courts + initial slot data
│   └── utils/
│       └── bookingId.js    ← ID generation logic
├── package.json
└── BACKEND_PLAN.md         ← this file
```
