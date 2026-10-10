import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { Pool } from "pg";
import { config } from "../config.js";
import { sendEmail, verificationCodeEmail } from "./email.js";

// ═══════════════════════════════════════════════════════════
// Better Auth — used for two things only:
//
//   1. Google OAuth. The browser goes through Better Auth's
//      /api/better-auth/sign-in/social and /callback/google; afterwards
//      POST /api/auth/google/complete (routes/auth.ts) turns the Better
//      Auth session into our own JWT and ends the Better Auth session.
//
//   2. Email OTP codes for verifying new email/password sign-ups. Codes
//      are generated, stored, expired and attempt-limited by Better
//      Auth's emailOTP plugin and delivered with Resend.
//
// App accounts, roles and our JWT login stay in routes/auth.ts; Better
// Auth's own data lives in the auth_* tables (see contract.prisma).
// ═══════════════════════════════════════════════════════════

export const OTP_EXPIRES_IN_SECONDS = 10 * 60;

// Better Auth talks to Postgres directly (its built-in Kysely adapter).
const pool = new Pool({ connectionString: config.databaseUrl, max: 5 });

export const auth = betterAuth({
    appName: "The Ball Room",
    secret: config.betterAuth.secret,
    baseURL: config.betterAuth.url,
    basePath: config.betterAuth.basePath,
    trustedOrigins: [config.frontendUrl],
    database: pool,

    user: { modelName: "auth_user" },
    session: { modelName: "auth_session" },
    account: {
        modelName: "auth_account",
        // Google confirms email ownership, so link Google to an existing
        // Better Auth identity with the same email.
        accountLinking: { enabled: true, trustedProviders: ["google"] }
    },
    verification: { modelName: "auth_verification" },

    // Email/password login is handled by our own /api/auth routes.
    emailAndPassword: { enabled: false },

    socialProviders: config.google.enabled
        ? {
            google: {
                clientId: config.google.clientId,
                clientSecret: config.google.clientSecret,
                prompt: "select_account"
            }
        }
        : {},

    plugins: [
        emailOTP({
            otpLength: 6,
            expiresIn: OTP_EXPIRES_IN_SECONDS,
            allowedAttempts: 5,
            async sendVerificationOTP({ email, otp }) {
                await sendEmail(verificationCodeEmail(email, otp, OTP_EXPIRES_IN_SECONDS / 60));
            }
        })
    ],

    // Only the Google flow is reachable from the browser. Email codes are
    // sent and checked exclusively through our own routes (server-side
    // auth.api calls are not affected by disabledPaths), so nobody can
    // use these endpoints to sign in or create Better Auth sessions.
    disabledPaths: [
        "/sign-up/email",
        "/sign-in/email",
        "/sign-in/email-otp",
        "/email-otp/send-verification-otp",
        "/email-otp/check-verification-otp",
        "/email-otp/verify-email",
        "/email-otp/request-password-reset",
        "/forget-password/email-otp",
        "/email-otp/reset-password",
        "/email-otp/request-email-change",
        "/email-otp/change-email",
        "/update-user",
        "/delete-user",
        "/link-social",
        "/change-password",
        "/set-password",
        "/change-email"
    ],

    advanced: {
        cookiePrefix: "tbr-auth"
    }
});

/** Ends a Better Auth session once we have handed out our own JWT. */
export async function revokeBetterAuthSession(token: string) {
    const ctx = await auth.$context;
    await ctx.internalAdapter.deleteSession(token);
}

/** True when the Better Auth user has a linked Google account. */
export async function hasGoogleAccount(betterAuthUserId: string) {
    const ctx = await auth.$context;
    const accounts = await ctx.internalAdapter.findAccounts(betterAuthUserId);
    return accounts.some(account => account.providerId === "google");
}
