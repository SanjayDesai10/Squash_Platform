// Venue phone number for completing payment by phone (until online
// payments are live). Override with VITE_CONTACT_PHONE in frontend/.env.
export const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || '+91 99163 78416';

/** tel: link for the venue phone number. */
export const CONTACT_PHONE_HREF = `tel:${CONTACT_PHONE.replace(/[^+\d]/g, '')}`;
