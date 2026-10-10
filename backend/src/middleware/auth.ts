import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface JwtPayload {
    userId: number;
    role: string;
    tokenVersion: number;
}

export function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        return res.status(401).json({
            message: "authentication required"
        });
    }

    const token = authHeader.slice(7);

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return next(
            new Error("JWT_SECRET is not configured")
        );
    }

    try {
        const decoded = jwt.verify(token, secret);

        if (
            typeof decoded !== "object" ||
            decoded === null ||
            typeof decoded.userId !== "number" ||
            typeof decoded.role !== "string" ||
            typeof decoded.tokenVersion !== "number"
        ) {
            return res.status(401).json({
                message: "invalid token"
            });
        }

        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            tokenVersion: decoded.tokenVersion
        };

        next();

    } catch {
        return res.status(401).json({
            message: "invalid or expired token"
        });
    }
}