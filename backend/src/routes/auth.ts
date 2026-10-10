import express from "express";
import { db } from "../prisma/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

// Register
router.post("/register", asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

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
        email.trim().length === 0
    ) {
        return res.status(400).json({
            message: "invalid email"
        });
    }
const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email.trim())) {
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
    const passwordHash = await bcrypt.hash(password, 10);

    try {
        const user = await db.orm.public.User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash
        });

        return res.status(201).json({
            message: "user registered successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        if (
            error &&
            typeof error === "object" &&
            "sqlState" in error &&
            error.sqlState === "23505"
        ) {
            return res.status(409).json({
                message: "email already registered"
            });
        }

        throw error;
    }
}));


// login
router.post("/login", asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate email
    if (
        typeof email !== "string" ||
        email.trim().length === 0
    ) {
        return res.status(400).json({
            message: "invalid email"
        });
    }
const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if (!emailRegex.test(email.trim())) {
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

const token = jwt.sign(
    {
        userId: user.id,
        role: user.role
    },
    process.env.JWT_SECRET!,
    {
        expiresIn: "1h"
    }
);
return res.status(200).json({
    message: "login successful",
    token,
    user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }
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
    user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    }
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
        } = req.body;

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
                10
            );

        // Update password
        await db.orm.public.User
            .where({
                id: req.user.userId
            })
            .update({
                passwordHash: newPasswordHash
            });

        return res.status(200).json({
            message: "password changed successfully"
        });
    })
);
export default router;