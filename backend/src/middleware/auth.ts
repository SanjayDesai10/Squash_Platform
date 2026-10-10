import { Request, Response, NextFunction } from "express";
import { db } from "../prisma/db.js";
import { verifyToken } from "../lib/tokens.js";
import { asyncHandler } from "./asyncHandler.js";

export interface AuthUser {
    userId: number;
    role: string;
    tokenVersion: number;
}

// Wrapped in asyncHandler so database errors reach the global
// error handler instead of becoming unhandled rejections.
export const authenticate = asyncHandler(async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        return res.status(401).json({
            message: "authentication required"
        });
    }

    const payload = verifyToken(authHeader.slice(7));

    if (!payload) {
        return res.status(401).json({
            message: "invalid or expired token"
        });
    }

    const user = await db.orm.public.User.first({
        id: payload.userId
    });

    if (!user) {
        return res.status(401).json({
            message: "user no longer exists"
        });
    }

    // tokenVersion is incremented when the password changes, which
    // invalidates every token issued before the change.
    if (user.tokenVersion !== payload.tokenVersion) {
        return res.status(401).json({
            message: "session is no longer valid, please log in again"
        });
    }

    // Role comes from the database, not the token, so promotions and
    // demotions apply on the user's next request.
    req.user = {
        userId: user.id,
        role: user.role,
        tokenVersion: user.tokenVersion
    };

    next();
});

/** Must run after `authenticate`. */
export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (req.user?.role !== "admin") {
        return res.status(403).json({
            message: "admin access required"
        });
    }

    next();
}
