import { db } from "../prisma/db.js";
import { formatHour, getOperatingHours, hasSlotStarted } from "./bookingRules.js";

// Slots are generated from operating hours; only exceptions are stored:
//   - confirmed bookings (booking table)
//   - admin-blocked hours (timeslot table, one row per blocked slot,
//     `available = false`). Unblocking deletes the row.

export type SlotState = "available" | "booked" | "blocked";

export interface DaySlot {
    startTime: string;
    endTime: string;
    state: SlotState;
    isPast: boolean;
}

/** Hourly slots for a date, before applying bookings / blocks. */
export function getSlotTimes(date: string) {
    const { openingHour, closingHour } = getOperatingHours(date);
    const times = [];

    for (let hour = openingHour; hour < closingHour; hour++) {
        times.push({
            startTime: formatHour(hour),
            endTime: formatHour(hour + 1)
        });
    }

    return times;
}

export function buildDaySlots(
    date: string,
    bookedStartTimes: Set<string>,
    blockedStartTimes: Set<string>,
    now: Date = new Date()
): DaySlot[] {
    return getSlotTimes(date).map(({ startTime, endTime }) => ({
        startTime,
        endTime,
        // A blocked hour cannot hold a confirmed booking (blocking
        // cancels it), but blocked wins if both ever appear.
        state: blockedStartTimes.has(startTime)
            ? "blocked"
            : bookedStartTimes.has(startTime)
                ? "booked"
                : "available",
        isPast: hasSlotStarted(date, startTime, now)
    }));
}

export function isWithinOperatingHours(date: string, startTime: string) {
    return getSlotTimes(date).some(slot => slot.startTime === startTime);
}

/** Start times blocked by an admin for one court on one date. */
export async function getBlockedStartTimes(courtId: number, date: string) {
    const rows = await db.orm.public.Timeslot
        .where({ courtId, date, available: false })
        .all();

    return new Set(rows.map(row => row.startTime));
}

export async function isSlotBlocked(courtId: number, date: string, startTime: string) {
    const row = await db.orm.public.Timeslot.first({
        courtId,
        date,
        startTime,
        available: false
    });

    return row !== null;
}
