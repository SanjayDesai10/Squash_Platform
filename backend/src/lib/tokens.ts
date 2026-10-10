import jwt from "jsonwebtoken";
import { config } from "../config.js";

export interface TokenPayload {
    userId: number;
    tokenVersion: number;
}

/**
 * Signs a session token. Role is intentionally not included: it is
 * read from the database on every request, so a role change takes
 * effect immediately instead of when the token expires.
 */
export function signToken(user: { id: number; tokenVersion: number }): string {
    const payload: TokenPayload = {
        userId: user.id,
        tokenVersion: user.tokenVersion
    };

    return jwt.sign(payload, config.jwtSecret, {
        algorithm: "HS256",
        expiresIn: config.jwtExpiresIn
    });
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, config.jwtSecret, {
            algorithms: ["HS256"]
        });

        if (
            typeof decoded !== "object" ||
            decoded === null ||
            typeof decoded.userId !== "number" ||
            typeof decoded.tokenVersion !== "number"
        ) {
            return null;
        }

        return {
            userId: decoded.userId,
            tokenVersion: decoded.tokenVersion
        };
    } catch {
        return null;
    }
}
