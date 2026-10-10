import express from "express";
import { db } from "../prisma/db.js";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { signToken } from "../lib/tokens.js";
import { isUniqueViolation } from "../lib/pgErrors.js";
import { APIError } from "better-auth/api";
import { fromNodeHeaders } from "better-auth/node";
import { auth, hasGoogleAccount, revokeBetterAuthSession } from "../lib/betterAuth.js";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";
const router = express.Router();

const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BCRYPT_ROUNDS = 10;

// bcrypt only uses the first 72 bytes of a password.
const MAX_PASSWORD_BYTES = 72;

function isPasswordTooLong(password: string) {
    return Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES;
}

function toPublicUser(user: {
    id: number;
    name: string;
    email: string;
    role: string;
    image: string | null;
    passwordHash: string | null;
}) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        // false for Google-only accounts (no password set)
        hasPassword: user.passwordHash !== null
    };
}

// ─── Email verification codes (Better Auth emailOTP + Resend) ───

// Minimum gap between code emails to the same address. Server-side
// auth.api calls bypass Better Auth's own HTTP rate limiter.
const RESEND_COOLDOWN_MS = 60_000;
const lastCodeSentAt = new Map<string, number>();

/**
 * Emails a fresh 6-digit code. Returns false when the previous code was
 * sent less than RESEND_COOLDOWN_MS ago.
 */
async function sendVerificationCode(email: string) {
    const now = Date.now();
    const last = lastCodeSentAt.get(email);

    if (last && now - last < RESEND_COOLDOWN_MS) {
        return false;
    }

    lastCodeSentAt.set(email, now);

    // "sign-in" codes can be issued for any address; the public route is
    // disabled (lib/betterAuth.ts), so only this server can request them.
    await auth.api.sendVerificationOTP({
        body: { email, type: "sign-in" }
    });

    return true;
}

const OTP_ERROR_MESSAGES: Record<string, string> = {
    INVALID_OTP: "that code is incorrect",
    OTP_EXPIRED: "that code has expired, request a new one",
    TOO_MANY_ATTEMPTS: "too many attempts, request a new code"
};

/**
 * Checks a code with Better Auth (expiry, attempt limit, single use).
 * Better Auth opens a session of its own on success; we end it straight
 * away because our app uses its own JWTs.
 */
async function verifyCode(email: string, otp: string) {
    try {
        const result = await auth.api.signInEmailOTP({
            body: { email, otp }
        });
        await revokeBetterAuthSession(result.token);
        return { ok: true as const };
    } catch (error) {
        if (error instanceof APIError) {
            const code = String((error.body as { code?: string } | undefined)?.code ?? "");
            return { ok: false as const, message: OTP_ERROR_MESSAGES[code] ?? "that code is incorrect" };
        }
        throw error;
    }
}

// which sign-in options the frontend should show
router.get("/providers", (req, res) => {
    res.status(200).json({
        google: config.google.enabled
    });
});

// Register
router.post("/register", asyncHandler(async (req, res) => {
    // Only these fields are read from the body. `role` and
    // `tokenVersion` always come from database defaults, so a client
    // cannot register itself as an admin.
    const { name, email, password } = req.body ?? {};

    // Validate name
    if (
        typeof name !== "string" ||
        name.trim().length === 0
    ) {
        return res.status(400).json({
            message: "invalid name"
        });
    }

    // Validate email
    if (
        typeof email !== "string" ||
        !emailRegex.test(email.trim())
    ) {
        return res.status(400).json({
            message: "invalid email"
        });
    }

    // Validate password
    if (
        typeof password !== "string" ||
        password.length < 8
    ) {
        return res.status(400).json({
            message: "password must be at least 8 characters"
        });
    }

    if (isPasswordTooLong(password)) {
        return res.status(400).json({
            message: "password must be at most 72 bytes"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check whether email already exists
    const existingUser = await db.orm.public.User.first({
        email: normalizedEmail
    });

    if (existingUser) {
        return res.status(409).json({
            message: "email already registered"
        });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    try {
        const user = await db.orm.public.User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            // must confirm the emailed code before logging in
            emailVerified: false
        });

        await sendVerificationCode(normalizedEmail);

        return res.status(201).json({
            message: "user registered, check your email for a verification code",
            requiresVerification: true,
            email: user.email
        });
    } catch (error) {
        // Two concurrent registrations for the same email
        if (isUniqueViolation(error, "user_email_key")) {
            return res.status(409).json({
                message: "email already registered"
            });
        }

        throw error;
    }
}));


// login
router.post("/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};

    // Validate email
    if (
        typeof email !== "string" ||
        !emailRegex.test(email.trim())
    ) {
        return res.status(400).json({
            message: "invalid email"
        });
    }

    // Validate password
    if (
        typeof password !== "string" ||
        password.length === 0
    ) {
        return res.status(400).json({
            message: "invalid password"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await db.orm.public.User.first({
        email: normalizedEmail
    });

    // Google-only accounts have no password to check.
    if (!user || user.passwordHash === null) {
        return res.status(401).json({
            message: "invalid email or password"
        });
    }

    const passwordMatches = await bcrypt.compare(
        password,
        user.passwordHash
    );

    if (!passwordMatches) {
        return res.status(401).json({
            message: "invalid email or password"
        });
    }

    // Correct password, but the email was never confirmed: send a code
    // and let the frontend show the verification step.
    if (!user.emailVerified) {
        await sendVerificationCode(user.email);

        return res.status(403).json({
            message: "please verify your email to continue",
            code: "EMAIL_NOT_VERIFIED",
            email: user.email
        });
    }

    return res.status(200).json({
        message: "login successful",
        token: signToken(user),
        user: toPublicUser(user)
    });
}));

//me
router.get("/me", authenticate, asyncHandler(async (req, res) => {

    const user = await db.orm.public.User.first({
        id: req.user.userId
    });

    if (!user) {
        return res.status(401).json({
            message: "user no longer exists"
        });
    }

    return res.status(200).json({
        user: toPublicUser(user)
    });
}));

// change password
router.patch(
    "/change-password",
    authenticate,
    asyncHandler(async (req, res) => {

        const {
            currentPassword,
            newPassword
        } = req.body ?? {};

        // Validate current password
        if (
            typeof currentPassword !== "string" ||
            currentPassword.length === 0
        ) {
            return res.status(400).json({
                message: "invalid current password"
            });
        }

        // Validate new password
        if (
            typeof newPassword !== "string" ||
            newPassword.length < 8
        ) {
            return res.status(400).json({
                message:
                    "new password must be at least 8 characters"
            });
        }

        if (isPasswordTooLong(newPassword)) {
            return res.status(400).json({
                message: "new password must be at most 72 bytes"
            });
        }

        if (newPassword === currentPassword) {
            return res.status(400).json({
                message:
                    "new password must be different from the current password"
            });
        }

        // Find authenticated user
        const user =
            await db.orm.public.User.first({
                id: req.user.userId
            });

        if (!user) {
            return res.status(401).json({
                message: "user no longer exists"
            });
        }

        if (user.passwordHash === null) {
            return res.status(400).json({
                message: "this account signs in with Google and has no password to change"
            });
        }

        // Verify current password
        const passwordMatches =
            await bcrypt.compare(
                currentPassword,
                user.passwordHash
            );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "current password is incorrect"
            });
        }

        // Hash new password
        const newPasswordHash =
            await bcrypt.hash(
                newPassword,
                BCRYPT_ROUNDS
            );

        // Update the password and bump tokenVersion in one statement,
        // conditioned on the version we read. Bumping the version
        // invalidates every previously issued token; the condition
        // makes concurrent password changes fail instead of silently
        // overwriting each other. updateAll() is used because it keeps
        // the condition in the UPDATE's WHERE clause (update() selects
        // first and then updates by primary key only).
        const [updatedUser] = await db.orm.public.User
            .where({
                id: user.id,
                tokenVersion: user.tokenVersion
            })
            .updateAll({
                passwordHash: newPasswordHash,
                tokenVersion: user.tokenVersion + 1
            });

        if (!updatedUser) {
            return res.status(409).json({
                message:
                    "password was changed by another request, please log in again"
            });
        }

        // Return a fresh token so the current session keeps working
        // while all other sessions are signed out.
        return res.status(200).json({
            message: "password changed successfully",
            token: signToken(updatedUser)
        });
    })
);
// confirm a new account's email with the emailed code; logs the user in
router.post("/verify-email", asyncHandler(async (req, res) => {
    const { email, otp } = req.body ?? {};

    if (typeof email !== "string" || !emailRegex.test(email.trim())) {
        return res.status(400).json({ message: "invalid email" });
    }

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
        return res.status(400).json({ message: "enter the 6-digit code from the email" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await db.orm.public.User.first({ email: normalizedEmail });

    // Same message as a wrong code, so this can't be used to probe emails.
    if (!user) {
        return res.status(400).json({ message: OTP_ERROR_MESSAGES.INVALID_OTP });
    }

    if (user.emailVerified) {
        return res.status(409).json({ message: "this email is already verified, please log in" });
    }

    const result = await verifyCode(normalizedEmail, otp.trim());

    if (!result.ok) {
        return res.status(400).json({ message: result.message });
    }

    const [verifiedUser] = await db.orm.public.User
        .where({ id: user.id, emailVerified: false })
        .updateAll({ emailVerified: true });

    const current = verifiedUser ?? await db.orm.public.User.first({ id: user.id });

    if (!current) {
        return res.status(401).json({ message: "user no longer exists" });
    }

    lastCodeSentAt.delete(normalizedEmail);

    return res.status(200).json({
        message: "email verified",
        token: signToken(current),
        user: toPublicUser(current)
    });
}));

// email a new verification code
router.post("/resend-verification", asyncHandler(async (req, res) => {
    const { email } = req.body ?? {};

    if (typeof email !== "string" || !emailRegex.test(email.trim())) {
        return res.status(400).json({ message: "invalid email" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.orm.public.User.first({ email: normalizedEmail });

    // Only unverified accounts get codes, but the response is the same
    // either way so it can't be used to discover registered emails.
    if (user && !user.emailVerified) {
        const sent = await sendVerificationCode(normalizedEmail);

        if (!sent) {
            return res.status(429).json({
                message: "please wait a minute before requesting another code"
            });
        }
    }

    return res.status(200).json({
        message: "if this email needs verifying, a new code is on its way"
    });
}));

// finish Google sign-in: Better Auth session -> our account + JWT
router.post("/google/complete", asyncHandler(async (req, res) => {
    if (!config.google.enabled) {
        return res.status(404).json({ message: "Google sign-in is not configured" });
    }

    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
    });

    if (!session) {
        return res.status(401).json({
            message: "Google sign-in expired or was cancelled, please try again"
        });
    }

    // Always end the short-lived Better Auth session; from here on the
    // user is authenticated with our own JWT.
    const betterAuthToken = session.session.token;

    try {
        if (!await hasGoogleAccount(session.user.id)) {
            return res.status(401).json({ message: "not a Google sign-in" });
        }

        if (!session.user.emailVerified) {
            return res.status(403).json({
                message: "your Google account's email is not verified"
            });
        }

        const email = session.user.email.trim().toLowerCase();
        const googleName = session.user.name?.trim() || email.split("@")[0];
        const googleImage = session.user.image ?? null;

        let user = await db.orm.public.User.first({ email });

        if (user) {
            // Link to the existing account. Google has proven the email,
            // so an unverified email/password sign-up becomes verified.
            const changes: { emailVerified?: boolean; image?: string } = {};
            if (!user.emailVerified) changes.emailVerified = true;
            if (!user.image && googleImage) changes.image = googleImage;

            if (Object.keys(changes).length > 0) {
                user = await db.orm.public.User.where({ id: user.id }).update(changes) ?? user;
            }
        } else {
            try {
                user = await db.orm.public.User.create({
                    name: googleName,
                    email,
                    passwordHash: null,
                    emailVerified: true,
                    image: googleImage
                });
            } catch (error) {
                // Created concurrently (e.g. double-clicked): use that row.
                if (!isUniqueViolation(error, "user_email_key")) throw error;
                user = await db.orm.public.User.first({ email });
            }
        }

        if (!user) {
            throw new Error("failed to load account after Google sign-in");
        }

        logger.info("google sign-in", { userId: user.id });

        return res.status(200).json({
            message: "login successful",
            token: signToken(user),
            user: toPublicUser(user)
        });
    } finally {
        await revokeBetterAuthSession(betterAuthToken);
    }
}));

export default router;
