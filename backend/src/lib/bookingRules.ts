// All booking dates and times are interpreted in India Standard Time.
// Every route that compares booking times against "now" must go
// through these helpers so availability, creation and cancellation
// agree with each other.

export const INDIA_TIME_ZONE = "Asia/Kolkata";
const INDIA_UTC_OFFSET = "+05:30";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HOUR_TIME_REGEX = /^([01]\d|2[0-3]):00$/;

function daysInMonth(year: number, month: number): number {
    // Day 0 of the following month is the last day of `month`.
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatDate(year: number, month: number, day: number): string {
    return [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-");
}

/** Returns true when `value` is a real calendar date in YYYY-MM-DD form. */
export function isValidDateString(value: unknown): value is string {
    if (typeof value !== "string" || !DATE_REGEX.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);

    return (
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= daysInMonth(year, month)
    );
}

/** Returns true when `value` is an on-the-hour time such as "09:00". */
export function isValidHourTime(value: unknown): value is string {
    return typeof value === "string" && HOUR_TIME_REGEX.test(value);
}

export function formatHour(hour: number): string {
    return `${String(hour).padStart(2, "0")}:00`;
}

export function parseHour(time: string): number {
    return Number(time.slice(0, 2));
}

/** Current calendar date (YYYY-MM-DD) in India. */
export function getIndiaToday(now: Date = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: INDIA_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(now);
}

/** Number of bookable days, counting today. */
export const BOOKING_WINDOW_DAYS = 30;

/**
 * Last bookable date: today plus 29 days, so exactly 30 calendar days
 * (today included) can be booked.
 */
export function getMaxBookingDate(today: string): string {
    const [year, month, day] = today.split("-").map(Number);
    const last = new Date(Date.UTC(year, month - 1, day + BOOKING_WINDOW_DAYS - 1));

    return formatDate(last.getUTCFullYear(), last.getUTCMonth() + 1, last.getUTCDate());
}

/** Inclusive range of dates that can be booked, in India time. */
export function getBookingWindow(now: Date = new Date()) {
    const today = getIndiaToday(now);

    return {
        from: today,
        to: getMaxBookingDate(today)
    };
}

export function isWithinBookingWindow(date: string, now: Date = new Date()): boolean {
    const { from, to } = getBookingWindow(now);

    // YYYY-MM-DD strings compare correctly as plain strings.
    return date >= from && date <= to;
}

/**
 * Operating hours for a calendar date.
 * Monday–Friday 06:00–22:00, Saturday–Sunday 07:00–21:00.
 */
export function getOperatingHours(date: string) {
    const [year, month, day] = date.split("-").map(Number);

    // The weekday of a calendar date does not depend on time zone,
    // so compute it in UTC to stay independent of the server's zone.
    const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const isWeekday = weekday >= 1 && weekday <= 5;

    return isWeekday
        ? { openingHour: 6, closingHour: 22 }
        : { openingHour: 7, closingHour: 21 };
}

/** The instant a slot starts, interpreting date/time in India time. */
export function getSlotStart(date: string, startTime: string): Date {
    return new Date(`${date}T${startTime}:00${INDIA_UTC_OFFSET}`);
}

export function hasSlotStarted(date: string, startTime: string, now: Date = new Date()): boolean {
    return getSlotStart(date, startTime).getTime() <= now.getTime();
}
