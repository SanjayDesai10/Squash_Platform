import { randomInt } from "node:crypto";
import { getIndiaToday } from "./bookingRules.js";

// Crockford base32: no I, L, O or U, so IDs are easy to read aloud
// and hard to mistype.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const SUFFIX_LENGTH = 8;

/**
 * Generates an ID such as `SQ-2026-7K3MZQ9D`.
 *
 * The year is the current year in India (not hardcoded) and the
 * suffix is 8 cryptographically random base32 characters
 * (32^8 ≈ 1.1 × 10^12 combinations). Uniqueness is ultimately
 * enforced by the primary key; callers retry on a collision.
 */
export function generateBookingId(now: Date = new Date()): string {
    const year = getIndiaToday(now).slice(0, 4);

    let suffix = "";

    for (let i = 0; i < SUFFIX_LENGTH; i++) {
        suffix += ALPHABET[randomInt(ALPHABET.length)];
    }

    return `SQ-${year}-${suffix}`;
}
