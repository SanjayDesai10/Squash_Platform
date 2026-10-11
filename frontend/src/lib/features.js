// Feature switches, set at build time through Vite env vars.

/**
 * Email/password sign-in and sign-up (with emailed verification codes).
 * Off until email delivery (Resend) is set up; Google sign-in is used
 * instead. Set VITE_ENABLE_EMAIL_AUTH=true and rebuild to bring the
 * forms back — the backend endpoints are still in place.
 */
export const EMAIL_AUTH_ENABLED = import.meta.env.VITE_ENABLE_EMAIL_AUTH === 'true';
