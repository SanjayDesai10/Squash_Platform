import { Request, Response, NextFunction } from "express";
import { config } from "../config.js";

/** Conservative security headers for a JSON API. */
export function securityHeaders(
    req: Request,
    res: Response,
    next: NextFunction
) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

    if (config.isProduction) {
        res.setHeader(
            "Strict-Transport-Security",
            "max-age=31536000; includeSubDomains"
        );
    }

    next();
}

/**
 * Allows the origins listed in CORS_ORIGIN. Auth uses a bearer token
 * (not cookies), so credentials are not enabled.
 */
export function cors(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const origin = req.headers.origin;

    if (origin && config.corsOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader(
            "Access-Control-Allow-Methods",
            "GET,POST,PATCH,DELETE,OPTIONS"
        );
        res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type,Authorization"
        );
        res.setHeader("Access-Control-Max-Age", "600");
    }

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
}
