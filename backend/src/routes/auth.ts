import express from "express";
import { db } from "../prisma/db.js";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { signToken } from "../lib/tokens.js";
import { isUniqueViolation } from "../lib/pgErrors.js";
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
}) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}

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
            passwordHash
        });

        return res.status(201).json({
            message: "user registered successfully",
            user: toPublicUser(user)
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

    if (!user) {
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
export default router;
