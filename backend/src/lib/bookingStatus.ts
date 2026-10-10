import { db } from "../prisma/db.js";

// Booking lifecycle (payment is collected by phone for now):
//
//   pending   - requested online, awaiting payment. Does NOT hold the
//               slot: several players may request the same hour.
//   confirmed - an admin confirmed it after payment. Holds the slot
//               (enforced by the booking_confirmed_slot_unique index).
//   cancelled - cancelled by the player or an admin, or rejected.
//
// A pending request whose slot has already started is shown as
// expired; it is not stored as a separate status.
export const BOOKING_STATUS = {
    pending: "pending",
    confirmed: "confirmed",
    cancelled: "cancelled"
} as const;

/**
 * Cancels a pending or confirmed booking matching `where`, atomically
 * (single UPDATE ... WHERE status = ... RETURNING). Returns the updated
 * row, or undefined if nothing matched (e.g. already cancelled).
 */
export async function cancelActiveBooking(where: { id: string; userId?: number }) {
    for (const status of [BOOKING_STATUS.confirmed, BOOKING_STATUS.pending]) {
        const [updated] = await db.orm.public.Booking
            .where({ ...where, status })
            .updateAll({ status: BOOKING_STATUS.cancelled });

        if (updated) return updated;
    }

    return undefined;
}
