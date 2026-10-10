import express from "express";
import { db } from "../prisma/db.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { hasSlotStarted, isValidDateString, isValidHourTime } from "../lib/bookingRules.js";
import { isUniqueViolation } from "../lib/pgErrors.js";
import { buildDaySlots, getSlotTimes, isSlotBlocked, isWithinOperatingHours } from "../lib/schedule.js";
import { BOOKING_STATUS, cancelActiveBooking } from "../lib/bookingStatus.js";
import { BookingConflictError } from "../errors/BookingConflictError.js";

// Read-only overviews and admin actions for the admin dashboard.
// Court create/update/deactivate live in routes/courts.ts.
const router = express.Router();

router.use(authenticate, requireAdmin);

// Without a date filter, cap the list so it stays fast as data grows.
const MAX_UNFILTERED_BOOKINGS = 200;

// all courts, including deactivated ones
router.get("/courts", asyncHandler(async (req, res) => {
    const courts = await db.orm.public.Court
        .orderBy(court => court.id.asc())
        .all();

    res.status(200).json({ courts });
}));

// all bookings, optionally for one date
router.get("/bookings", asyncHandler(async (req, res) => {
    const date = req.query.date;

    if (date !== undefined && !isValidDateString(date)) {
        return res.status(400).json({
            message: "invalid date format"
        });
    }

    const base = date === undefined
        ? db.orm.public.Booking
        : db.orm.public.Booking.where({ date });

    const query = base
        .include("court", court => court.select("id", "name", "color"))
        .include("user", user => user.select("id", "name", "email"));

    const bookings = date === undefined
        ? await query
            .orderBy([
                booking => booking.date.desc(),
                booking => booking.startTime.asc()
            ])
            .limit(MAX_UNFILTERED_BOOKINGS)
            .all()
        : await query
            .orderBy([
                booking => booking.startTime.asc(),
                booking => booking.courtId.asc()
            ])
            .all();

    res.status(200).json({ bookings });
}));

// cancel any user's booking
router.patch("/bookings/:id/cancel", asyncHandler(async (req, res) => {
    const bookingId = req.params.id;

    if (typeof bookingId !== "string") {
        return res.status(400).json({
            message: "invalid id"
        });
    }

    const booking = await db.orm.public.Booking.first({
        id: bookingId
    });

    if (!booking) {
        return res.status(404).json({
            message: "booking not found"
        });
    }

    if (booking.status === "cancelled") {
        return res.status(409).json({
            message: "booking is already cancelled"
        });
    }

    if (hasSlotStarted(booking.date, booking.startTime)) {
        return res.status(400).json({
            message: "cannot cancel a booking that has already started"
        });
    }

    // Cancels a pending request (= reject) or a confirmed booking.
    const updatedBooking = await cancelActiveBooking({ id: bookingId });

    if (!updatedBooking) {
        return res.status(409).json({
            message: "booking is already cancelled"
        });
    }

    res.status(200).json({
        message: "Booking cancelled successfully",
        booking: updatedBooking
    });
}));

// confirm a pending request after payment (reserves the slot)
router.patch("/bookings/:id/confirm", asyncHandler(async (req, res) => {
    const bookingId = req.params.id;

    if (typeof bookingId !== "string") {
        return res.status(400).json({
            message: "invalid id"
        });
    }

    const booking = await db.orm.public.Booking.first({
        id: bookingId
    });

    if (!booking) {
        return res.status(404).json({
            message: "booking not found"
        });
    }

    if (booking.status === BOOKING_STATUS.confirmed) {
        return res.status(409).json({
            message: "booking is already confirmed"
        });
    }

    if (booking.status !== BOOKING_STATUS.pending) {
        return res.status(409).json({
            message: "only pending requests can be confirmed"
        });
    }

    if (hasSlotStarted(booking.date, booking.startTime)) {
        return res.status(400).json({
            message: "this slot has already started; the request has expired"
        });
    }

    const slot = {
        courtId: booking.courtId,
        date: booking.date,
        startTime: booking.startTime
    };

    if (await isSlotBlocked(slot.courtId, slot.date, slot.startTime)) {
        return res.status(409).json({
            message: "this slot is blocked; unblock it first"
        });
    }

    // The booking_confirmed_slot_unique index guarantees only one
    // confirmed booking per slot, even if two admins confirm different
    // requests for the same slot at once.
    let confirmed;
    try {
        [confirmed] = await db.orm.public.Booking
            .where({ id: bookingId, status: BOOKING_STATUS.pending })
            .updateAll({ status: BOOKING_STATUS.confirmed });
    } catch (error) {
        if (isUniqueViolation(error, "booking_confirmed_slot_unique")) {
            throw new BookingConflictError();
        }
        throw error;
    }

    if (!confirmed) {
        return res.status(409).json({
            message: "request is no longer pending"
        });
    }

    // Same two-sided check as booking a blocked slot: blocking writes the
    // block, then cancels; we confirm, then re-check the block.
    if (await isSlotBlocked(slot.courtId, slot.date, slot.startTime)) {
        await db.orm.public.Booking
            .where({ id: bookingId, status: BOOKING_STATUS.confirmed })
            .updateAll({ status: BOOKING_STATUS.pending });

        return res.status(409).json({
            message: "this slot was just blocked; unblock it first"
        });
    }

    // The slot is taken now: reject the other open requests for it.
    const rejected = await db.orm.public.Booking
        .where({ ...slot, status: BOOKING_STATUS.pending })
        .updateAll({ status: BOOKING_STATUS.cancelled });

    res.status(200).json({
        message: "booking confirmed",
        booking: confirmed,
        rejectedRequests: rejected.map(r => r.id)
    });
}));

// every active court with all of its slots for one date
router.get("/schedule", asyncHandler(async (req, res) => {
    const date = req.query.date;

    if (!isValidDateString(date)) {
        return res.status(400).json({
            message: "invalid date format"
        });
    }

    const [courts, bookings, blocks] = await Promise.all([
        db.orm.public.Court
            .where({ isActive: true })
            .orderBy(court => court.id.asc())
            .all(),
        db.orm.public.Booking
            .where({ date })
            .include("user", user => user.select("id", "name", "email"))
            .orderBy(booking => booking.createdAt.asc())
            .all(),
        db.orm.public.Timeslot
            .where({ date, available: false })
            .all()
    ]);

    const now = new Date();

    const schedule = courts.map(court => {
        const courtBookings = bookings.filter(b => b.courtId === court.id);
        const bookingByStart = new Map(
            courtBookings
                .filter(b => b.status === BOOKING_STATUS.confirmed)
                .map(b => [b.startTime, b])
        );
        const pending = courtBookings.filter(b => b.status === BOOKING_STATUS.pending);

        const slots = buildDaySlots(
            date,
            new Set(bookingByStart.keys()),
            new Set(blocks.filter(b => b.courtId === court.id).map(b => b.startTime)),
            now
        ).map(slot => {
            const booking = slot.state === "booked"
                ? bookingByStart.get(slot.startTime)
                : undefined;

            // Open payment requests for this slot, oldest first.
            const requests = slot.state === "available"
                ? pending
                    .filter(b => b.startTime === slot.startTime)
                    .map(b => ({ id: b.id, price: b.price, user: b.user, createdAt: b.createdAt }))
                : [];

            return {
                ...slot,
                booking: booking
                    ? {
                        id: booking.id,
                        price: booking.price,
                        user: booking.user
                    }
                    : null,
                requests
            };
        });

        return { court, slots };
    });

    res.status(200).json({ date, schedule });
}));

// Shared validation for block / unblock requests.
async function parseSlotRequest(body: unknown) {
    const { courtId, date, startTime } = (body ?? {}) as Record<string, unknown>;

    if (typeof courtId !== "number" || !Number.isInteger(courtId) || courtId <= 0) {
        return { error: "invalid courtId" } as const;
    }

    if (!isValidDateString(date)) {
        return { error: "invalid date format" } as const;
    }

    if (!isValidHourTime(startTime) || !isWithinOperatingHours(date, startTime)) {
        return { error: "startTime is not a slot on this date" } as const;
    }

    const court = await db.orm.public.Court.first({ id: courtId, isActive: true });

    if (!court) {
        return { error: "court not found", status: 404 } as const;
    }

    const endTime = getSlotTimes(date).find(slot => slot.startTime === startTime)!.endTime;

    return { courtId, date, startTime, endTime } as const;
}

// block one slot; cancels the booking on it, if any
router.post("/slots/block", asyncHandler(async (req, res) => {
    const slot = await parseSlotRequest(req.body);

    if ("error" in slot) {
        return res.status(slot.status ?? 400).json({ message: slot.error });
    }

    const { courtId, date, startTime, endTime } = slot;

    if (hasSlotStarted(date, startTime)) {
        return res.status(400).json({
            message: "cannot block a slot that has already started"
        });
    }

    // 1. Write the block first...
    try {
        await db.orm.public.Timeslot.create({
            courtId,
            date,
            startTime,
            endTime,
            available: false
        });
    } catch (error) {
        if (!isUniqueViolation(error, "timeslot_courtId_date_startTime_key")) {
            throw error;
        }

        // Row already exists: make sure it is a block (idempotent).
        await db.orm.public.Timeslot
            .where({ courtId, date, startTime })
            .updateAll({ available: false });
    }

    // 2. ...then cancel any confirmed booking. Booking creation does
    // the reverse (insert, then check for a block), so a concurrent
    // booking is always caught by one side. See routes/booking.ts.
    const cancelledBookings = await db.orm.public.Booking
        .where({ courtId, date, startTime, status: BOOKING_STATUS.confirmed })
        .updateAll({ status: BOOKING_STATUS.cancelled });

    // Open requests for a blocked hour can't be fulfilled either.
    const rejectedRequests = await db.orm.public.Booking
        .where({ courtId, date, startTime, status: BOOKING_STATUS.pending })
        .updateAll({ status: BOOKING_STATUS.cancelled });

    res.status(200).json({
        message: cancelledBookings.length > 0
            ? "booking cancelled and slot blocked"
            : "slot blocked",
        cancelledBookings,
        rejectedRequests: rejectedRequests.map(r => r.id)
    });
}));

// unblock one slot
router.post("/slots/unblock", asyncHandler(async (req, res) => {
    const slot = await parseSlotRequest(req.body);

    if ("error" in slot) {
        return res.status(slot.status ?? 400).json({ message: slot.error });
    }

    const { courtId, date, startTime } = slot;

    const removed = await db.orm.public.Timeslot
        .where({ courtId, date, startTime })
        .deleteAll();

    res.status(200).json({
        message: removed.length > 0 ? "slot unblocked" : "slot was not blocked"
    });
}));

// all users, without password hashes
router.get("/users", asyncHandler(async (req, res) => {
    const users = await db.orm.public.User
        .select("id", "name", "email", "role", "createdAt")
        .include("bookings", bookings => bookings.count())
        .orderBy(user => user.id.asc())
        .all();

    res.status(200).json({
        users: users.map(({ bookings, ...user }) => ({
            ...user,
            bookingCount: bookings
        }))
    });
}));

export default router;
