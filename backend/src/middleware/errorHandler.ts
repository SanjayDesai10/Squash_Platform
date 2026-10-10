import { Request, Response, NextFunction } from "express";

export function errorHandler(
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error(error);

    return res.status(500).json({
        message: "Internal Server Error"
    });
}