import { Request, Response, NextFunction } from "express";
import { BookingConflictError } from "../errors/BookingConflictError.js";
import { logger } from "../lib/logger.js";

export function errorHandler(
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof BookingConflictError) {
        return res.status(409).json({
            message: error.message
        });
    }

    // Malformed or oversized JSON bodies from express.json()
    if (
        typeof error === "object" &&
        error !== null &&
        "type" in error
    ) {
        if (error.type === "entity.parse.failed") {
            return res.status(400).json({
                message: "invalid JSON body"
            });
        }

        if (error.type === "entity.too.large") {
            return res.status(413).json({
                message: "request body too large"
            });
        }
    }

    logger.error("unhandled error", {
        method: req.method,
        path: req.originalUrl,
        error
    });

    return res.status(500).json({
        message: "Internal Server Error"
    });
}
