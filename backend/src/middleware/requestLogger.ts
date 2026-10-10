import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

export function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const startedAt = process.hrtime.bigint();

    res.on("finish", () => {
        const durationMs =
            Number(process.hrtime.bigint() - startedAt) / 1_000_000;

        // Never log headers or bodies: they carry tokens and passwords.
        logger.info("request", {
            method: req.method,
            // no query string: OAuth callbacks carry one-time codes there
            path: req.originalUrl.split("?")[0],
            status: res.statusCode,
            durationMs: Math.round(durationMs * 10) / 10,
            ip: req.ip
        });
    });

    next();
}
