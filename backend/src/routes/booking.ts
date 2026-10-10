import express from "express";
import { db } from "../prisma/db.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { BookingConflictError } from "../errors/BookingConflictError.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// create
router.post("/", authenticate, asyncHandler(async (req, res) => {
    const {
        courtId,
        date,
        startTime,
        endTime
    } = req.body;

    const userId = req.user.userId;

    // Check whether authenticated user still exists
    const existingUser = await db.orm.public.User.first({
        id: userId
    });

    if (!existingUser) {
        return res.status(401).json({
            message: "user no longer exists"
        });
    }

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

    // Validate date type
    if (typeof date !== "string") {
        return res.status(400).json({
            message: "invalid date"
        });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(date)) {
        return res.status(400).json({
            message: "invalid date format"
        });
    }

    // Validate actual calendar date
    const [year, month, dayOfMonth] =
        date.split("-").map(Number);

    // Use UTC for date-only calculations so server timezone
    // does not affect the calendar date.
    const bookingDate = new Date(
        Date.UTC(
            year,
            month - 1,
            dayOfMonth
        )
    );

    if (
        Number.isNaN(bookingDate.getTime()) ||
        bookingDate.getUTCFullYear() !== year ||
        bookingDate.getUTCMonth() !== month - 1 ||
        bookingDate.getUTCDate() !== dayOfMonth
    ) {
        return res.status(400).json({
            message: "invalid date format"
        });
    }

    // Validate startTime
    if (typeof startTime !== "string") {
        return res.status(400).json({
            message: "invalid startTime"
        });
    }

    // Validate endTime
    if (typeof endTime !== "string") {
        return res.status(400).json({
            message: "invalid endTime"
        });
    }

    // Validate time format
const timeRegex =
    /^([01]\d|2[0-3]):00$/;

    if (
        !timeRegex.test(startTime) ||
        !timeRegex.test(endTime)
    ) {
        return res.status(400).json({
            message: "invalid time format"
        });
    }

    // Check past booking using India time
    const bookingDateTime =
        new Date(`${date}T${startTime}:00+05:30`);

    if (bookingDateTime <= new Date()) {
        return res.status(400).json({
            message: "cannot book a past time"
        });
    }

    // Get current date in India
    const now = new Date();

    const indiaTodayString =
        new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(now);

    const [
        indiaYear,
        indiaMonth,
        indiaDay
    ] = indiaTodayString
        .split("-")
        .map(Number);

    // Create today's date using UTC so server timezone
    // does not affect the comparison.
    const today = new Date(
        Date.UTC(
            indiaYear,
            indiaMonth - 1,
            indiaDay
        )
    );

    // Calculate maximum booking date
    const maxBookingDate = new Date(today);

    maxBookingDate.setUTCMonth(
        maxBookingDate.getUTCMonth() + 1
    );

    // Check one-month booking limit
    if (
        bookingDate < today ||
        bookingDate > maxBookingDate
    ) {
        return res.status(400).json({
            message:
                "bookings can only be made up to 1 month in advance"
        });
    }

    // Determine operating hours from the requested calendar date
    const day = bookingDate.getUTCDay();

    let openingHour: number;
    let closingHour: number;

    if (day >= 1 && day <= 5) {
        // Monday - Friday
        openingHour = 6;
        closingHour = 22;
    } else {
        // Saturday - Sunday
        openingHour = 7;
        closingHour = 21;
    }

    // Create time-only values for duration/operating-hour checks
    const start =
        new Date(`1970-01-01T${startTime}:00`);

    const end =
        new Date(`1970-01-01T${endTime}:00`);

    const startHour = start.getHours();
    const endHour = end.getHours();

    if (
        startHour < openingHour ||
        endHour > closingHour
    ) {
        return res.status(400).json({
            message: "booking is outside operating hours"
        });
    }

    // Check duration
    const duration =
        (end.getTime() - start.getTime()) /
        (1000 * 60);

    if (duration !== 60) {
        return res.status(400).json({
            message:
                "booking duration must be exactly 1 hour"
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

    // Check existing confirmed booking
    const existingBooking =
        await db.orm.public.Booking
            .where({
                courtId,
                date,
                startTime,
                status: "confirmed"
            })
            .first();

    if (existingBooking) {
        return res.status(409).json({
            message: "the time slot is already booked"
        });
    }

    // Get authoritative price from court
    const price = existingCourt.pricePerHour;

    // Generate booking ID
    let bookingId: string;

    while (true) {
        const randomNumber =
            Math.floor(
                10000 + Math.random() * 90000
            );

        bookingId =
            `SQ-2026-${randomNumber}`;

        const existingBooking =
            await db.orm.public.Booking.first({
                id: bookingId
            });

        if (!existingBooking) {
            break;
        }
    }

    // Create booking
    try {
        const booking =
            await db.orm.public.Booking.create({
                id: bookingId,
                courtId,
                price,
                date,
                startTime,
                endTime,
                userId
            });

        return res.status(201).json({
            message: "booking created successfully",
            booking
        });

} catch (error) {

    // Race condition / confirmed slot already booked
    if (
        error &&
        typeof error === "object" &&
        "sqlState" in error &&
        error.sqlState === "23505" &&
        "constraint" in error &&
        error.constraint === "booking_confirmed_slot_unique"
    ) {
        throw new BookingConflictError();
    }

    // Send unexpected errors to global errorHandler
    throw error;
}
}));
// get all
router.get("/", authenticate, asyncHandler(async (req, res) => {

    const bookings =
        await db.orm.public.Booking
            .where({
                userId: req.user.userId
            })
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

    // Validate date type
    if (typeof date !== "string") {
        return res.status(400).json({
            message: "invalid date"
        });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(date)) {
        return res.status(400).json({
            message: "invalid date format"
        });
    }

    // Validate actual calendar date
    const [year, month, dayOfMonth] =
        date.split("-").map(Number);

    const bookingDate = new Date(
        year,
        month - 1,
        dayOfMonth
    );

    if (
        Number.isNaN(bookingDate.getTime()) ||
        bookingDate.getFullYear() !== year ||
        bookingDate.getMonth() !== month - 1 ||
        bookingDate.getDate() !== dayOfMonth
    ) {
        return res.status(400).json({
            message: "invalid date format"
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

    // Determine operating hours
    const day = bookingDate.getDay();

    let openingHour: number;
    let closingHour: number;

    if (day >= 1 && day <= 5) {
        // Monday - Friday
        openingHour = 6;
        closingHour = 22;
    } else {
        // Saturday - Sunday
        openingHour = 7;
        closingHour = 21;
    }

    // Get current date and time in India
    const now = new Date();

    const indiaDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(now);

    const indiaTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(now);

    // Generate hourly slots
    const slots = [];

    for (
        let hour = openingHour;
        hour < closingHour;
        hour++
    ) {
        const startTime =
            `${String(hour).padStart(2, "0")}:00`;

        const endTime =
            `${String(hour + 1).padStart(2, "0")}:00`;

        // Check whether the slot has already started
        const isPast =
            date < indiaDate ||
            (date === indiaDate && startTime <= indiaTime);

        // Check whether the slot is already booked
        const isBooked = bookings.some(
            booking =>
                booking.startTime === startTime
        );

        slots.push({
            startTime,
            endTime,
            available: !isPast && !isBooked
        });
    }

    return res.status(200).json({
        courtId,
        date,
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
            return res.status(400).json({
                message: "booking is already cancelled"
            });
        }

        // Check whether booking has already started
        const bookingDateTime =
            new Date(
                `${booking.date}T${booking.startTime}:00+05:30`
            );

        if (bookingDateTime <= new Date()) {
            return res.status(400).json({
                message:
                    "cannot cancel a booking that has already started"
            });
        }

        // Cancel booking only if it is still confirmed
        const updatedBooking =
            await db.orm.public.Booking
                .where({
                    id: bookingId,
                    status: "confirmed"
                })
                .update({
                    status: "cancelled"
                });

        return res.status(200).json({
            message: "Booking cancelled successfully",
            booking: updatedBooking
        });
    })
);
export default router;