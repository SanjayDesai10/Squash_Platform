# The Ball Room - Backend

Backend API for **The Ball Room**, a pickleball court-booking platform. It provides user registration/login, JWT authentication, court information, court availability, booking creation, booking history, and booking cancellation.

> **Project status:** Booking, authentication, admin authorization, token revocation and migration history are implemented and verified end-to-end. The React frontend is wired to the API (login/register, live availability, booking, my bookings, password change). See **Known TODOs** for the status of each item and the remaining open decisions.

## Tech Stack

- **Node.js** and **TypeScript**
- **Express** for HTTP routing
- **PostgreSQL** for persistence
- **Prisma ORM Postgres** (Prisma 8 release-candidate workflow)
- **bcryptjs** for password hashing
- **jsonwebtoken** for JWT creation and verification
- **temporal-polyfill** for the Prisma Postgres runtime setup used by this project

## Features

- User registration with email normalization and password hashing
- User login using email and password
- JWT authentication middleware
- `GET /api/auth/me` to retrieve the current user's details
- Password-change endpoint with current-password verification
- Court listing and detail endpoints
- Court availability generated dynamically from operating hours and confirmed bookings
- One-hour, hourly-aligned booking slots
- Booking creation tied to the authenticated user's ID
- User-specific booking history and booking ownership checks
- Booking cancellation only by the booking owner and before the booking starts
- PostgreSQL partial unique index to prevent two confirmed bookings from occupying the same court/date/start time
- Cancelled bookings do not block that slot from being booked again

## Prerequisites

Install the following before running the project:

- Node.js and npm
- PostgreSQL
- Access to the project's PostgreSQL database

The commands below assume you are in the backend/server directory that contains `package.json`, `src/`, and `prisma.config.ts`.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the backend/server directory:

```env
DATABASE_URL="postgresql://YOUR_DB_USER@localhost:5432/ball_room"
JWT_SECRET="replace-with-a-long-random-secret"
```

Use your actual PostgreSQL username, password (if configured), host, port, and database name. Keep `.env` out of version control; do not commit real credentials or `JWT_SECRET`.

### 3. Start PostgreSQL

If PostgreSQL is installed through Homebrew on macOS, check its service status and start the service if needed. The service name depends on your installed PostgreSQL version.

Example:

```bash
brew services list
```

### 4. Check the Prisma contract/database state

This project uses the Prisma 8 ORM Postgres contract workflow, not the standard Prisma workflow used by many older projects. The repository's `prisma.config.ts`, `src/prisma/contract.prisma`, and migration setup determine the correct schema-change procedure.

The following commands have been used in this project:

```bash
npx prisma contract emit
npx prisma db verify
```

- `contract emit` regenerates contract artifacts from the authored contract.
- `db verify` checks the database marker/schema against the contract.

Use the project's established migration procedure when changing the schema. **Do not run a schema-modifying command blindly**: review the generated migration and the current database state first, especially for the partial unique booking index.

### 5. Run the server

Development (auto-restarts on file changes):

```bash
npm run dev
```

Production:

```bash
npm run build      # compiles src/ to dist/ (tsconfig.build.json)
npm run db:migrate # apply any pending migrations
npm start          # NODE_ENV=production node dist/index.js
```

The server listens on `PORT` (default **3000**). `GET /health` returns `{"status":"ok"}` for load-balancer checks. The server refuses to start if `DATABASE_URL` or `JWT_SECRET` is missing (and, in production, if `JWT_SECRET` is shorter than 32 characters).

### 6. Create the first admin

Register a normal account through the API or the frontend, then promote it from the server shell:

```bash
npm run make-admin -- admin@example.com            # promote
npm run make-admin -- admin@example.com --revoke   # demote back to "user"
```

There is intentionally no HTTP endpoint for granting the admin role. In a production build without `tsx`, run `node dist/cli/makeAdmin.js <email>`.

### 7. Seed demo data (optional, development only)

```bash
npm run seed            # adds Court 01/02, demo users, bookings and blocked slots (safe to re-run)
npm run seed -- --fresh # rebuilds the demo bookings around today's date
```

Demo logins: `admin@seed.test` / `Admin@12345` (admin) and `aarav@seed.test`, `priya@seed.test`, `rohan@seed.test` / `Player@12345`. The script never modifies existing data, skips slots already taken by real bookings, and refuses to run with `NODE_ENV=production`.

### 8. Run the frontend

From `frontend/`:

```bash
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:3000`, so no CORS setup is needed in development. For a production build served from a different origin than the API, set `VITE_API_URL` at build time and add the frontend origin to the backend's `CORS_ORIGIN`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string used by Prisma ORM Postgres (required) |
| `JWT_SECRET` | Private server-side secret used to sign and verify JWTs (required; ≥ 32 chars in production) |
| `PORT` | HTTP port (default `3000`) |
| `NODE_ENV` | `production` enables JSON logs, HSTS and the strict secret-length check |
| `CORS_ORIGIN` | Comma-separated browser origins allowed to call the API cross-origin (optional) |
| `TRUST_PROXY` | `true` when running behind a reverse proxy / load balancer |

Frontend: `VITE_API_URL` - API base URL baked in at build time (leave empty for same-origin / dev proxy).

Never expose `JWT_SECRET` to frontend code. JWTs are signed, not encrypted; do not put passwords or password hashes in the token payload.

## API Routes

Base URL for local development: `http://localhost:3000`

### Authentication - `/api/auth`

| Method | Endpoint | Auth required? | Purpose |
|---|---|---:|---|
| `POST` | `/api/auth/register` | No | Create a user account |
| `POST` | `/api/auth/login` | No | Verify credentials and return a JWT |
| `GET` | `/api/auth/me` | Yes | Return the authenticated user's current database details |
| `PATCH` | `/api/auth/change-password` | Yes | Verify current password and update the password hash |

#### Register request example

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "password": "a-strong-password"
}
```

#### Login request example

```json
{
  "email": "user@example.com",
  "password": "a-strong-password"
}
```

The login response includes a JWT. Send it on protected requests using the HTTP header:

```http
Authorization: Bearer <JWT>
```

#### Change-password request example

```json
{
  "currentPassword": "your-current-password",
  "newPassword": "your-new-password"
}
```

A successful change increments `tokenVersion`, which immediately invalidates every previously issued token (all other sessions are signed out). The response contains a fresh `token` for the current session. A new password identical to the current one is rejected with `400`.

### Courts - `/api/courts`

| Method | Endpoint | Auth required? | Purpose |
|---|---|---:|---|
| `GET` | `/api/courts` | No | List active courts |
| `GET` | `/api/courts/:id` | No | Get one active court |
| `POST` | `/api/courts` | Admin | Create a court |
| `PATCH` | `/api/courts/:id` | Admin | Update a court |
| `DELETE` | `/api/courts/:id` | Admin | Deactivate a court (`available: false`, `isActive: false`) |

Court mutations return `401` without a valid token and `403` for non-admin users. `PATCH` also accepts `isActive: true` to restore a deactivated court.

### Admin - `/api/admin` (admin only)

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/admin/courts` | All courts, including deactivated ones |
| `GET` | `/api/admin/bookings?date=YYYY-MM-DD` | All bookings for a date (with `court` and `user` summaries); without `date`, the latest 200 |
| `PATCH` | `/api/admin/bookings/:id/cancel` | Cancel a confirmed booking or reject a pending request (`409` if already cancelled) |
| `PATCH` | `/api/admin/bookings/:id/confirm` | Confirm a pending request after payment; rejects the slot's other requests. `409` if the slot is already booked or blocked |
| `GET` | `/api/admin/users` | All users (no password hashes) with `bookingCount` |
| `GET` | `/api/admin/schedule?date=YYYY-MM-DD` | Every active court with all of its slots for the date: `state` (`available` / `booked` / `blocked`), `isPast`, and booking + player details for booked slots |
| `POST` | `/api/admin/slots/block` | Body `{ courtId, date, startTime }`. Blocks one upcoming slot; any confirmed booking on it is cancelled. Idempotent |
| `POST` | `/api/admin/slots/unblock` | Same body. Re-opens a blocked slot |

**Blocked slots** are stored in the `timeslot` table (one row per blocked hour, `available = false`; unblocking deletes the row). Slots themselves are still generated from operating hours. Public availability reports blocked hours as `status: "blocked"`, and booking one returns `409`. Concurrency: blocking writes the timeslot row and *then* cancels bookings; booking creation inserts and *then* re-checks for a block (cancelling its own booking if found), so a confirmed booking can never remain on a blocked slot.

The frontend dashboard lives at **`/admin`** (only shown to admins) and opens on **Schedule**: every court for the chosen day as a card with an Open / Under maintenance selector and all its slots colour-coded (free, booked, blocked, passed); clicking a slot lets the admin block/unblock it or cancel its booking (optionally also blocking it). Other tabs: **Bookings** (day list with totals and cancel), **Courts** (add, edit, close for maintenance, remove/restore).

### Bookings - `/api/bookings`

| Method | Endpoint | Auth required? | Purpose |
|---|---|---:|---|
| `POST` | `/api/bookings` | Yes | Create a booking **request** (`pending`) for the authenticated user; see Booking Flow |
| `GET` | `/api/bookings` | Yes | List the authenticated user's bookings (newest first, including cancelled ones), each with a `court` summary (`id`, `name`, `type`, `color`) |
| `GET` | `/api/bookings/availability?courtId=1&date=YYYY-MM-DD` | No | Generate hourly availability for a court/date |
| `GET` | `/api/bookings/:id` | Yes | Get one booking, only if owned by the authenticated user |
| `PATCH` | `/api/bookings/:id` | Yes | Cancel a booking, only if owned by the authenticated user and not already started |

#### Create-booking request example

```json
{
  "courtId": 1,
  "date": "2026-10-12",
  "startTime": "10:00",
  "endTime": "11:00"
}
```

Do **not** send `userId` in the request body. The server derives the user ID from the verified JWT.

To retrieve one booking, put its ID in the **URL path**, not in a query parameter:

```http
GET /api/bookings/SQ-2026-7K3MZQ9D
```

Booking IDs have the form `SQ-<year>-<8 chars>`: the year is the current year in India at creation time, and the suffix is 8 cryptographically random Crockford base32 characters (no `I`, `L`, `O`, `U`). The primary key guarantees uniqueness; on the rare collision the server retries with a new ID.

#### Availability response

```json
{
  "courtId": 1,
  "date": "2026-10-12",
  "pricePerHour": 800,
  "slots": [
    { "startTime": "06:00", "endTime": "07:00", "status": "past", "available": false },
    { "startTime": "07:00", "endTime": "08:00", "status": "booked", "available": false },
    { "startTime": "08:00", "endTime": "09:00", "status": "available", "available": true }
  ]
}
```

`status` is one of `available`, `booked` or `past`. Dates outside the booking window return `400` with a `bookingWindow: { from, to }` field.

#### Status codes

| Situation | Status |
|---|---|
| Slot already booked (including two simultaneous requests for the same slot) | `409` |
| Cancelling a booking that is already cancelled (including a concurrent cancel) | `409` |
| Cancelling a booking that has already started | `400` |
| Viewing/cancelling another user's booking | `403` |
| Malformed JSON body | `400` |

Use `GET /api/bookings` to retrieve all bookings owned by the logged-in user.

## Sign-in: Google OAuth and email verification (Better Auth)

[Better Auth](https://better-auth.com) is used for two things; our own JWT login, roles, admin and password change are unchanged.

**Google sign-in**
1. "Continue with Google" (login/register pages) calls Better Auth's `POST /api/better-auth/sign-in/social` and redirects to Google.
2. Google returns to `GET /api/better-auth/callback/google`; Better Auth creates a short-lived session (cookie `tbr-auth.session_token`) and redirects to `/auth/google/callback`.
3. That page calls `POST /api/auth/google/complete`: the backend checks the session belongs to a Google account with a verified email, **links to the existing account with the same email** (or creates one with no password), issues our normal JWT, and immediately deletes the Better Auth session.

**Email verification for email/password sign-ups**
- `POST /api/auth/register` creates the account unverified and emails a 6-digit code (Better Auth `emailOTP` plugin, sent with Resend; logged to the console when `RESEND_API_KEY` is not set in development).
- `POST /api/auth/verify-email { email, otp }` confirms it and logs the user in. Codes expire after 10 minutes, allow 5 attempts and are single-use.
- `POST /api/auth/resend-verification { email }` (60 s cooldown per email). Logging in to an unverified account returns `403 { code: "EMAIL_NOT_VERIFIED" }` and sends a fresh code.
- Accounts that existed before this feature, Google accounts and seeded demo accounts are verified.

**Other endpoints:** `GET /api/auth/providers` → `{ google: boolean }` (button only shows when configured). User objects now include `image` (Google photo) and `hasPassword` (false for Google-only accounts, which cannot use password login or change-password).

**Data:** Better Auth's tables are `auth_user`, `auth_session`, `auth_account`, `auth_verification` (Prisma contract + migration `add_better_auth_and_email_verification`). It connects to Postgres through `pg` directly. Its unused public endpoints (email/password, email-OTP sign-in, account updates) are disabled via `disabledPaths`; server-side calls still work.

**Google Cloud Console (OAuth client, type "Web application")**

| Setting | Development |
|---|---|
| Authorized JavaScript origins | `http://localhost:5173` |
| Authorized redirect URIs | `http://localhost:5173/api/better-auth/callback/google` |

For production add `https://<your-domain>` and `https://<your-domain>/api/better-auth/callback/google`, and set `FRONTEND_URL` accordingly. The site must be opened at exactly that origin (e.g. `localhost`, not `127.0.0.1`).

**npm note:** `backend/.npmrc` sets `legacy-peer-deps=true` because better-auth lists Prisma ≤ 7 as an optional peer (for an adapter we don't use).

## Booking Flow (payment by phone)

Online payment is not live yet. Booking works as a request that an admin confirms after payment:

1. The player picks a slot and clicks **Request Booking**. `POST /api/bookings` creates the booking with status **`pending`** (response message: `booking request received`). The modal asks them to call the venue (`VITE_CONTACT_PHONE`) and pay.
2. A pending request **does not reserve the slot**. It stays available to everyone, and several players may request the same hour. A player can't have two open requests for the same slot (`409 you have already requested this slot`), and nobody can request a confirmed or blocked slot.
3. After payment, an admin clicks **Confirm (paid)** (Schedule slot dialog or Bookings tab), which calls `PATCH /api/admin/bookings/:id/confirm`. The booking becomes **`confirmed`** and takes the slot. Every other pending request for that slot is rejected automatically (set to `cancelled`). If two admins confirm different requests at once, the unique index lets only one through; the other gets `409`.
4. Players can withdraw a pending request (or cancel a confirmed booking) before the slot starts. Admins reject a request with the existing admin cancel endpoint. Blocking a slot rejects its pending requests too.
5. A request still pending when its slot starts is shown as **Expired** and can no longer be confirmed. This is computed at display time; it is not a stored status.

Statuses: `pending` → `confirmed` | `cancelled`. Only `confirmed` holds a slot (`booking_confirmed_slot_unique`), so no schema change was needed.

## Booking Rules

- All booking times are interpreted in **India Standard Time (`Asia/Kolkata`, UTC+05:30)**.
- Bookings must start and end on the hour, for example `10:00`–`11:00`.
- Each booking must be exactly one hour.
- Monday–Friday operating hours: **06:00–22:00**.
- Saturday–Sunday operating hours: **07:00–21:00**.
- Bookings cannot be created in the past.
- Bookings can be made for **30 days**: today plus the next 29 days (`BOOKING_WINDOW_DAYS` in `src/lib/bookingRules.ts`). Availability uses the same window, and the frontend date picker shows the same 30 days.
- A court must be active and available to be booked.
- Only `confirmed` bookings occupy a slot.
- A cancelled booking allows that slot to be booked again.
- The authenticated user can only retrieve or cancel their own bookings.
- A user cannot cancel a booking that has already started.
- Availability returns slots that have already started with `status: "past"` (they are not omitted).
- All "now" comparisons (creation, availability, cancellation, booking window) go through `src/lib/bookingRules.ts`, which always interprets dates/times in India time, independent of the server's time zone.

## Database Models

The current schema includes these main models:

- **User** - name, normalized unique email, password hash, role, token version, creation time, and bookings.
- **Court** - name, type, description, features, hourly price, availability, active flag, image, and color.
- **Timeslot** - stores admin-blocked slots (one row per blocked court/date/hour, `available = false`). Regular slots are generated dynamically and are not stored.
- **Booking** - booking ID, court, date, start/end time, price, status, creation time, and optional user relationship.

The schema uses a PostgreSQL partial unique index to prevent duplicate confirmed bookings for a court, date, and start time:

```sql
CREATE UNIQUE INDEX booking_confirmed_slot_unique
ON booking ("courtId", date, "startTime")
WHERE status = 'confirmed';
```

The database constraint is important: application-level checks alone cannot reliably prevent simultaneous requests from booking the same slot. Booking creation therefore does not pre-check the slot; it relies on this index and converts **only** a violation of `booking_confirmed_slot_unique` into a `409` (a `booking_pkey` violation triggers an ID retry; anything else is a `500`).

### Migrations

| Migration | Contents |
|---|---|
| `20261006T1728_initial_schema` | All tables, foreign keys, indexes, including the `booking_confirmed_slot_unique` partial unique index |
| `20261010T1831_add_user_token_version` | `ALTER TABLE "user" ADD COLUMN "tokenVersion" int4 DEFAULT 0 NOT NULL` |

A fresh, empty database built with `npx prisma db migrate --db <url>` applies both migrations and passes `npx prisma db verify` with no warnings (verified 2026-10-11).

Schema-change workflow: edit `src/prisma/contract.prisma` → `npx prisma contract emit` → `npx prisma migration plan --name <change>` → review the generated `migrations/app/<dir>/` → `npx prisma db migrate --advance-ref db` → `npx prisma db verify`.

**Prisma ORM note:** `db.orm.<Model>.where(...).update()` selects a matching row first and then updates it **by primary key only**, so extra `where` conditions are *not* re-checked at write time. Use `.updateAll()` (a single `UPDATE … WHERE … RETURNING`) for conditional / compare-and-set writes. Cancellation and password change both rely on this.

## Authentication and Security Notes

- Passwords are stored as bcrypt hashes, not plaintext.
- JWTs are signed with `JWT_SECRET` (HS256 only) and expire after one hour. The payload contains only `userId` and `tokenVersion`.
- Protected routes require `Authorization: Bearer <JWT>`.
- Booking creation derives `userId` from the authenticated request rather than trusting client input.
- Booking lookup and cancellation enforce ownership checks.
- `authenticate` loads the user on every request and rejects the token if the user no longer exists or the token's `tokenVersion` differs from the database. Changing the password increments `tokenVersion` atomically (compare-and-set), so old tokens are rejected immediately and concurrent password changes cannot both succeed.
- The user's **role is read from the database on every request**, not from the JWT, so promoting or demoting a user takes effect on their next request.
- Registration only reads `name`, `email` and `password`; `role` always comes from the database default (`user`).
- Admin authorization (`requireAdmin`) protects all court mutations. Admins are created only via the `make-admin` CLI.
- Authentication middleware is async-safe: database errors are forwarded to the global error handler.
- Security headers (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, HSTS in production), `x-powered-by` disabled, 10 kB JSON body limit, opt-in CORS allow-list.
- Request logging records method, path, status, duration and IP only - never headers or bodies. Production logs are one JSON object per line.

## Known TODOs

### Authentication and accounts

- [x] Finish and verify token-version invalidation: increment `User.tokenVersion` when the password changes; ensure old tokens are rejected and new login tokens work. *(Login now puts `tokenVersion` in the JWT - previously it was missing, which made every protected route return 401.)*
- [x] Ensure the database migration for `tokenVersion` has been applied and the Prisma contract verifies.
- [x] Ensure database errors during asynchronous authentication middleware reach the global error handler.
- [x] Consider password confirmation/rejecting a new password identical to the current one. *(Server rejects identical passwords; the frontend asks for confirmation on register and password change.)*
- [x] Decide whether account recovery/password reset and an explicit logout/revocation flow are required. *(Decision: deferred. Logout is client-side (token discarded); changing the password revokes all sessions. Email-based reset needs an email provider.)*

### Admin system

- [x] Decide how to bootstrap the first admin account safely. *(CLI: `npm run make-admin -- <email>`.)*
- [x] Add admin authorization middleware.
- [x] Protect `POST /api/courts`, `PATCH /api/courts/:id`, and `DELETE /api/courts/:id` with authentication and admin authorization.
- [x] Verify that users cannot assign themselves the admin role during registration.
- [x] Define behavior when a user's role changes while they have an existing JWT. *(Role is read from the DB on every request; changes apply immediately.)*

### Booking correctness

- [x] Check the result of the conditional cancellation update; return `409` if another request cancelled it first. *(Uses `updateAll()`; see the Prisma ORM note above.)*
- [x] Convert only the `booking_confirmed_slot_unique` violation into a booking-slot conflict.
- [x] Replace the random five-digit booking ID with a robust strategy and stop hardcoding the year.
- [x] Ensure availability follows the same one-month booking horizon as booking creation.
- [x] Define and test one-month boundary behavior for dates at the end of a month. *(Now a fixed 30-day window: today + 29 days.)*
- [x] Confirm all availability, creation, and cancellation time comparisons consistently use India time.
- [x] Decide whether past slots should be returned as unavailable or omitted. *(Returned, with `status: "past"`.)*

### Database and migrations

- [x] Repair/recreate the migration for the confirmed-booking partial unique index. *(The current `initial_schema` migration already creates it; verified on a fresh database.)*
- [x] Ensure the `tokenVersion` schema change is represented in a real migration.
- [x] Resolve or consciously accept the Prisma contract warning about exact SQL-body comparison for the partial unique index. *(Accepted: `db verify` reports no drift because the stored body matches Postgres's reprinted form. Switching `map:` to `name:` would rename the physical index, and the application matches on the name `booking_confirmed_slot_unique`. If you edit that index's `where:` text, copy it exactly as Postgres prints it.)*
- [x] Regenerate contract artifacts after changes.
- [x] Run `npx prisma db verify` after the schema/migration work and confirm the database and contract agree.
- [x] Confirm a fresh database can be built from the migration history.
- [x] Decide whether the `Timeslot` model is needed while availability is generated dynamically. *(Yes - it now stores admin-blocked slots.)*

### Deployment readiness

- [x] Confirm `.env` and secrets are excluded from version control.
- [x] Add production logging, secure deployment configuration, and a documented production start/build command.

### Still open

- [ ] Automated test suite (auth, admin, booking rules, concurrency). The flows above were verified with a scripted end-to-end run, but it is not checked in.
- [ ] Email-based password reset and per-session logout (would need a provider and/or a token denylist).
- [ ] Rate limiting on `/api/auth/login` and `/api/auth/register` (typically at the reverse proxy).
- [x] Admin UI in the frontend - `/admin` dashboard (bookings, courts, users).
- [ ] Granting/revoking admin from the dashboard (currently CLI only, by design).
- [ ] Frontend: elements using the `scroll-reveal` pattern start at `opacity: 0` and are never revealed for users with "reduce motion" enabled (pre-existing; fixed for the booking flow components only).

## Development Notes

- Run commands from the backend/server directory unless the command specifically targets the repository root.
- Do not commit `.env`, JWT secrets, database passwords, or tokens.
- Before schema modifications, review the generated migration and the current database state.
