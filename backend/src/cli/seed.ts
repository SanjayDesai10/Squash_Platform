// Seed demo data for exercising every flow in the app (development only).
//
//   npm run seed            # add anything that's missing (safe to re-run)
//   npm run seed -- --fresh # also delete and re-create the demo bookings
//                           # so they line up with today's date again
//
// Creates:
//   - Courts "Court 01" (only if missing) and "Court 02"
//   - 1 admin + 3 players (emails below, all on @seed.test)
//   - Bookings relative to today (India time): past/completed, today,
//     upcoming, cancelled, and pending requests awaiting payment
//   - A few admin-blocked slots
//
// Existing data is never modified. Demo bookings belong only to the demo
// players, so `--fresh` never touches real users' bookings.
import bcrypt from "bcryptjs";
import { db } from "../prisma/db.js";
import { generateBookingId } from "../lib/bookingId.js";
import { getIndiaToday, getOperatingHours, parseHour } from "../lib/bookingRules.js";
import { isUniqueViolation } from "../lib/pgErrors.js";

const ADMIN_PASSWORD = "Admin@12345";
const PLAYER_PASSWORD = "Player@12345";

const USERS = [
    { key: "admin", name: "Demo Admin", email: "admin@seed.test", password: ADMIN_PASSWORD, role: "admin" },
    { key: "aarav", name: "Aarav Sharma", email: "aarav@seed.test", password: PLAYER_PASSWORD, role: "user" },
    { key: "priya", name: "Priya Nair", email: "priya@seed.test", password: PLAYER_PASSWORD, role: "user" },
    { key: "rohan", name: "Rohan Mehta", email: "rohan@seed.test", password: PLAYER_PASSWORD, role: "user" }
] as const;

const COURTS = [
    {
        key: "c1",
        name: "Court 01",
        type: "Professional",
        description: "Tournament-grade pickleball court with a cushioned acrylic surface and competition-standard lighting.",
        features: ["Cushioned Acrylic Surface", "LED Lighting", "Tournament Net", "Climate Control"],
        pricePerHour: 800,
        color: "#c8ff00"
    },
    {
        key: "c2",
        name: "Court 02",
        type: "Premium",
        description: "Our most popular court. Perfect for competitive matches and regular training sessions.",
        features: ["Hardwood Floor", "LED Lighting", "Viewing Gallery", "Sound System"],
        pricePerHour: 600,
        color: "#00ccff"
    }
] as const;

type UserKey = (typeof USERS)[number]["key"];
type CourtKey = (typeof COURTS)[number]["key"];

// day = offset from today (India time). Start hours stay within 07–20
// so every booking is valid on weekdays and weekends.
type SeedStatus = "confirmed" | "pending" | "cancelled";

const BOOKINGS: { day: number; court: CourtKey; start: number; user: UserKey; status?: SeedStatus }[] = [
    // History (completed)
    { day: -3, court: "c1", start: 18, user: "aarav" },
    { day: -3, court: "c2", start: 19, user: "priya" },
    { day: -2, court: "c2", start: 7, user: "aarav", status: "cancelled" },
    { day: -2, court: "c1", start: 20, user: "rohan" },
    { day: -1, court: "c1", start: 9, user: "priya" },
    // Today (passed or upcoming depending on the time you run it)
    { day: 0, court: "c1", start: 8, user: "rohan" },
    { day: 0, court: "c1", start: 19, user: "aarav" },
    { day: 0, court: "c2", start: 20, user: "rohan" },
    // Upcoming
    { day: 1, court: "c1", start: 10, user: "aarav" },
    { day: 1, court: "c1", start: 11, user: "priya" },
    { day: 1, court: "c2", start: 18, user: "rohan" },
    { day: 1, court: "c2", start: 19, user: "priya", status: "cancelled" },
    { day: 2, court: "c2", start: 8, user: "aarav" },
    { day: 2, court: "c1", start: 17, user: "rohan" },
    { day: 3, court: "c1", start: 18, user: "priya" },
    { day: 5, court: "c1", start: 19, user: "aarav" },
    { day: 5, court: "c2", start: 9, user: "rohan" },
    // Pending requests (awaiting payment by phone). Two players want
    // the same slot on day 1 so the "confirm one, reject the rest"
    // flow can be tried.
    { day: 1, court: "c1", start: 15, user: "aarav", status: "pending" },
    { day: 1, court: "c1", start: 15, user: "rohan", status: "pending" },
    { day: 2, court: "c2", start: 10, user: "priya", status: "pending" },
    { day: 3, court: "c2", start: 18, user: "aarav", status: "pending" }
];

const BLOCKED_SLOTS: { day: number; court: CourtKey; start: number }[] = [
    { day: 1, court: "c2", start: 12 },
    { day: 2, court: "c1", start: 13 },
    { day: 4, court: "c2", start: 7 },
    { day: 4, court: "c2", start: 8 }
];

function addDays(date: string, days: number) {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function hour(h: number) {
    return `${String(h).padStart(2, "0")}:00`;
}

function isWithinOperatingHours(date: string, startTime: string) {
    const { openingHour, closingHour } = getOperatingHours(date);
    const start = parseHour(startTime);
    return start >= openingHour && start + 1 <= closingHour;
}

async function main() {
    if (process.env.NODE_ENV === "production") {
        console.error("Refusing to seed demo data with NODE_ENV=production.");
        return 1;
    }

    const fresh = process.argv.includes("--fresh");
    const today = getIndiaToday();

    // Courts
    const courtIds = {} as Record<CourtKey, number>;

    for (const { key, ...court } of COURTS) {
        const existing = await db.orm.public.Court.first({ name: court.name });

        if (existing) {
            courtIds[key] = existing.id;
            console.log(`court   ${court.name}: exists (id ${existing.id}), left unchanged`);
            continue;
        }

        const created = await db.orm.public.Court.create(court);
        courtIds[key] = created.id;
        console.log(`court   ${court.name}: created (id ${created.id})`);
    }

    // Users
    const userIds = {} as Record<UserKey, number>;

    for (const { key, password, ...user } of USERS) {
        const existing = await db.orm.public.User.first({ email: user.email });

        if (existing) {
            userIds[key] = existing.id;
            console.log(`user    ${user.email}: exists`);
            continue;
        }

        const created = await db.orm.public.User.create({
            ...user,
            passwordHash: await bcrypt.hash(password, 10),
            // demo accounts skip the email-code step
            emailVerified: true
        });
        userIds[key] = created.id;
        console.log(`user    ${user.email}: created`);
    }

    const demoPlayerIds = USERS.filter(u => u.role === "user").map(u => userIds[u.key]);

    if (fresh) {
        let removed = 0;
        for (const userId of demoPlayerIds) {
            removed += (await db.orm.public.Booking.where({ userId }).deleteAll()).length;
        }
        console.log(`--fresh: removed ${removed} demo bookings`);
    }

    // Bookings - skipped if the demo players already have some
    // (re-run with --fresh to rebuild them around today's date).
    let hasDemoBookings = false;
    for (const userId of demoPlayerIds) {
        if (await db.orm.public.Booking.first({ userId })) hasDemoBookings = true;
    }

    if (hasDemoBookings) {
        console.log("bookings: demo bookings already exist, skipped (use --fresh to rebuild)");
    } else {
        let created = 0;
        let skipped = 0;

        for (const b of BOOKINGS) {
            const date = addDays(today, b.day);
            const startTime = hour(b.start);
            const courtId = courtIds[b.court];
            const court = await db.orm.public.Court.first({ id: courtId });

            if (!court || !isWithinOperatingHours(date, startTime)) {
                skipped++;
                continue;
            }

            try {
                await db.orm.public.Booking.create({
                    id: generateBookingId(),
                    courtId,
                    date,
                    startTime,
                    endTime: hour(b.start + 1),
                    price: court.pricePerHour,
                    status: b.status ?? "confirmed",
                    userId: userIds[b.user]
                });
                created++;
            } catch (error) {
                // Slot already taken by a real booking: leave it alone.
                if (isUniqueViolation(error, "booking_confirmed_slot_unique")) {
                    skipped++;
                    continue;
                }
                throw error;
            }
        }

        console.log(`bookings: created ${created}${skipped ? `, skipped ${skipped} (slot taken)` : ""}`);
    }

    // Blocked slots (idempotent)
    let blocked = 0;

    for (const s of BLOCKED_SLOTS) {
        const date = addDays(today, s.day);
        const startTime = hour(s.start);
        const courtId = courtIds[s.court];

        if (!isWithinOperatingHours(date, startTime)) continue;

        // Never block over a confirmed booking.
        if (await db.orm.public.Booking.first({ courtId, date, startTime, status: "confirmed" })) continue;

        try {
            await db.orm.public.Timeslot.create({
                courtId,
                date,
                startTime,
                endTime: hour(s.start + 1),
                available: false
            });
            blocked++;
        } catch (error) {
            if (!isUniqueViolation(error, "timeslot_courtId_date_startTime_key")) throw error;
        }
    }

    console.log(`blocked slots: added ${blocked}`);

    console.log(`
Demo logins:
  Admin    admin@seed.test   ${ADMIN_PASSWORD}
  Players  aarav@seed.test   ${PLAYER_PASSWORD}
           priya@seed.test   ${PLAYER_PASSWORD}
           rohan@seed.test   ${PLAYER_PASSWORD}`);

    return 0;
}

main()
    .then(code => process.exit(code))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
