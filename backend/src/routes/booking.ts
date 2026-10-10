import express from "express";
import { db } from "../prisma/db.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { BookingConflictError } from "../errors/BookingConflictError.js";
import { authenticate } from "../middleware/auth.js";
import { isUniqueViolation } from "../lib/pgErrors.js";
import { generateBookingId } from "../lib/bookingId.js";
import { buildDaySlots, getBlockedStartTimes, isSlotBlocked } from "../lib/schedule.js";
import { BOOKING_STATUS, cancelActiveBooking } from "../lib/bookingStatus.js";
import {
    getBookingWindow,
    getOperatingHours,
    hasSlotStarted,
    isValidDateString,
    isValidHourTime,
    isWithinBookingWindow,
    parseHour
} from "../lib/bookingRules.js";

const router = express.Router();

const SLOT_BLOCKED_MESSAGE =
    "this time slot is not available";

const BOOKING_WINDOW_MESSAGE =
    "bookings can only be made up to 30 days in advance";

// Collisions in a 32^8 ID space are extremely unlikely; a few retries
// is plenty and keeps a pathological case from looping forever.
const MAX_ID_ATTEMPTS = 5;

// create
router.post("/", authenticate, asyncHandler(async (req, res) => {
    const {
        courtId,
        date,
        startTime,
        endTime
    } = req.body ?? {};

    // userId always comes from the verified token, never the body.
    const userId = req.user.userId;

    // Validate courtId
    if (
        typeof courtId !== "number" ||
        !Number.isInteger(courtId) ||
        courtId <= 0
    ) {
        return res.status(400).json({
            message: "invalid courtId"
        });
    }

    // Validate date
    if (!isValidDateString(date)) {
        return res.status(400).json({
            message: "invalid date format"
        });
    }

    // Validate times
    if (
        !isValidHourTime(startTime) ||
        !isValidHourTime(endTime)
    ) {
        return res.status(400).json({
            message: "invalid time format"
        });
    }

    const startHour = parseHour(startTime);
    const endHour = parseHour(endTime);

    // Check duration
    if (endHour - startHour !== 1) {
        return res.status(400).json({
            message:
                "booking duration must be exactly 1 hour"
        });
    }

    // Check operating hours for the requested calendar date
    const { openingHour, closingHour } = getOperatingHours(date);

    if (
        startHour < openingHour ||
        endHour > closingHour
    ) {
        return res.status(400).json({
            message: "booking is outside operating hours"
        });
    }

    // Check past booking using India time
    const now = new Date();

    if (hasSlotStarted(date, startTime, now)) {
        return res.status(400).json({
            message: "cannot book a past time"
        });
    }

    // Check one-month booking limit
    if (!isWithinBookingWindow(date, now)) {
        return res.status(400).json({
            message: BOOKING_WINDOW_MESSAGE
        });
    }

    // Find active court
    const existingCourt =
        await db.orm.public.Court.first({
            id: courtId,
            isActive: true
        });

    if (!existingCourt) {
        return res.status(404).json({
            message: "court not found"
        });
    }

    // Check court availability
    if (!existingCourt.available) {
        return res.status(400).json({
            message: "court is not available"
        });
    }

    // Check whether an admin has blocked this hour
    if (await isSlotBlocked(courtId, date, startTime)) {
        return res.status(409).json({
            message: SLOT_BLOCKED_MESSAGE
        });
    }

    // Slot already confirmed for someone
    const confirmedBooking = await db.orm.public.Booking.first({
        courtId,
        date,
        startTime,
        status: BOOKING_STATUS.confirmed
    });

    if (confirmedBooking) {
        throw new BookingConflictError();
    }

    // One open request per player per slot
    const ownRequest = await db.orm.public.Booking.first({
        courtId,
        date,
        startTime,
        userId,
        status: BOOKING_STATUS.pending
    });

    if (ownRequest) {
        return res.status(409).json({
            message: "you have already requested this slot",
            booking: ownRequest
        });
    }

    // Get authoritative price from court
    const price = existingCourt.pricePerHour;

    // Create a booking *request*. Payment is taken by phone for now; the
    // slot is only reserved once an admin confirms the request
    // (PATCH /api/admin/bookings/:id/confirm). Pending requests are not
    // covered by the booking_confirmed_slot_unique index, so several
    // players may request the same slot.
    for (let attempt = 1; attempt <= MAX_ID_ATTEMPTS; attempt++) {
        try {
            const booking =
                await db.orm.public.Booking.create({
                    id: generateBookingId(now),
                    courtId,
                    price,
                    date,
                    startTime,
                    endTime,
                    userId,
                    status: BOOKING_STATUS.pending
                });

            return res.status(201).json({
                message: "booking request received",
                booking
            });
        } catch (error) {
            // Booking ID collision: generate a new ID and retry
            if (
                isUniqueViolation(error, "booking_pkey") &&
                attempt < MAX_ID_ATTEMPTS
            ) {
                continue;
            }

            // Send unexpected errors to global errorHandler
            throw error;
        }
    }

    throw new Error("failed to generate a unique booking ID");
}));

// get all
router.get("/", authenticate, asyncHandler(async (req, res) => {

    const bookings =
        await db.orm.public.Booking
            .where({
                userId: req.user.userId
            })
            .include("court", court => court.select("id", "name", "type", "color"))
            .orderBy([
                booking => booking.date.desc(),
                booking => booking.startTime.desc()
            ])
            .all();

    res.status(200).json({ bookings });
}));

// get availability
router.get("/availability", asyncHandler(async (req, res) => {
    const courtId = Number(req.query.courtId);
    const date = req.query.date;

    // Validate courtId
    if (
        !Number.isInteger(courtId) ||
        courtId <= 0
    ) {
        return res.status(400).json({
            message: "invalid courtId"
        });
    }

    // Validate date
    if (!isValidDateString(date)) {
        return res.status(400).json({
            message: "invalid date format"
        });
    }

    // Use the same one-month horizon as booking creation
    const now = new Date();

    if (!isWithinBookingWindow(date, now)) {
        return res.status(400).json({
            message: BOOKING_WINDOW_MESSAGE,
            bookingWindow: getBookingWindow(now)
        });
    }

    // Find active court
    const existingCourt =
        await db.orm.public.Court.first({
            id: courtId,
            isActive: true
        });

    if (!existingCourt) {
        return res.status(404).json({
            message: "court not found"
        });
    }

    // Check court availability
    if (!existingCourt.available) {
        return res.status(400).json({
            message: "court is not available"
        });
    }

    // Get confirmed bookings
    const bookings =
        await db.orm.public.Booking
            .where({
                courtId,
                date,
                status: "confirmed"
            })
            .all();

    const bookedStartTimes = new Set(
        bookings.map(booking => booking.startTime)
    );

    const blockedStartTimes =
        await getBlockedStartTimes(courtId, date);

    // Slots that have already started are returned (not omitted) with
    // status "past", so clients can render the full day consistently.
    // Admin-blocked hours are reported as "blocked".
    const slots = buildDaySlots(date, bookedStartTimes, blockedStartTimes, now)
        .map(slot => {
            const status = slot.isPast ? "past" : slot.state;

            return {
                startTime: slot.startTime,
                endTime: slot.endTime,
                status,
                available: status === "available"
            };
        });

    return res.status(200).json({
        courtId,
        date,
        pricePerHour: existingCourt.pricePerHour,
        slots
    });
}));
// get one
router.get("/:id", authenticate, asyncHandler(async (req, res) => {
    const bookingId = req.params.id;

    if (typeof bookingId !== "string") {
        return res.status(400).json({
            message: "invalid id"
        });
    }

    const booking =
        await db.orm.public.Booking.first({
            id: bookingId
        });

    if (!booking) {
        return res.status(404).json({
            message: "booking not found"
        });
    }

    if (booking.userId !== req.user.userId) {
        return res.status(403).json({
            message: "you are not allowed to view this booking"
        });
    }

    res.status(200).json({ booking });
}));

// cancel one
router.patch(
    "/:id",
    authenticate,
    asyncHandler(async (req, res) => {
        const bookingId = req.params.id;

        // Validate booking ID
        if (typeof bookingId !== "string") {
            return res.status(400).json({
                message: "invalid id"
            });
        }

        // Find booking
        const booking =
            await db.orm.public.Booking.first({
                id: bookingId
            });

        if (!booking) {
            return res.status(404).json({
                message: "booking not found"
            });
        }

        // Check ownership
        if (booking.userId !== req.user.userId) {
            return res.status(403).json({
                message: "you are not allowed to cancel this booking"
            });
        }

        // Check whether booking is already cancelled
        if (booking.status === "cancelled") {
            return res.status(409).json({
                message: "booking is already cancelled"
            });
        }

        // Check whether booking has already started (India time)
        if (hasSlotStarted(booking.date, booking.startTime)) {
            return res.status(400).json({
                message:
                    "cannot cancel a booking that has already started"
            });
        }

        // Cancel the booking/request only if it is still pending or
        // confirmed. If another request cancelled it between the read
        // above and this update, nothing matches. (cancelActiveBooking
        // uses updateAll, so the status condition is atomic.)
        const updatedBooking = await cancelActiveBooking({
            id: bookingId,
            userId: req.user.userId
        });

        if (!updatedBooking) {
            return res.status(409).json({
                message: "booking is already cancelled"
            });
        }

        return res.status(200).json({
            message: "Booking cancelled successfully",
            booking: updatedBooking
        });
    })
);
export default router;
