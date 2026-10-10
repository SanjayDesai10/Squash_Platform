import "dotenv/config";

function requireEnv(name: string): string {
    const value = process.env[name];

    if (!value || value.trim().length === 0) {
        throw new Error(`${name} environment variable is required`);
    }

    return value;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = requireEnv("JWT_SECRET");

// A short secret makes signed tokens brute-forceable offline.
if (nodeEnv === "production" && jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
}

const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port <= 0) {
    throw new Error("PORT must be a positive integer");
}

export const config = {
    nodeEnv,
    isProduction: nodeEnv === "production",
    port,
    databaseUrl: requireEnv("DATABASE_URL"),
    jwtSecret,
    jwtExpiresIn: "1h" as const,
    // Comma-separated list of browser origins allowed to call the API.
    // Leave empty when the frontend is served from the same origin
    // (or through the Vite dev proxy).
    corsOrigins: (process.env.CORS_ORIGIN ?? "")
        .split(",")
        .map(origin => origin.trim())
        .filter(origin => origin.length > 0),
    // Set when running behind a reverse proxy / load balancer so
    // req.ip and req.protocol reflect the original client.
    trustProxy: process.env.TRUST_PROXY === "true"
};
