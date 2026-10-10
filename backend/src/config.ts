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

// Better Auth (Google OAuth + email codes). Its secret signs Better
// Auth's own cookies/state; keep it separate from JWT_SECRET.
const betterAuthSecret = process.env.BETTER_AUTH_SECRET?.trim() || (nodeEnv === "production" ? "" : "dev-only-better-auth-secret-change-me");

if (nodeEnv === "production" && betterAuthSecret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters in production");
}

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim() ?? "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "";

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
    trustProxy: process.env.TRUST_PROXY === "true",

    // Public URL of the website. Browser-facing redirects (Google
    // callback, post-login pages) go through this origin; in development
    // that's the Vite dev server, which proxies /api to this backend.
    frontendUrl: (process.env.FRONTEND_URL?.trim() || "http://localhost:5173").replace(/\/$/, ""),

    betterAuth: {
        secret: betterAuthSecret,
        // Where Better Auth is reachable from the browser. Defaults to the
        // frontend URL because /api is served (or proxied) from there.
        url: (process.env.BETTER_AUTH_URL?.trim() || process.env.FRONTEND_URL?.trim() || "http://localhost:5173").replace(/\/$/, ""),
        basePath: "/api/better-auth"
    },

    google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        enabled: googleClientId.length > 0 && googleClientSecret.length > 0
    },

    email: {
        resendApiKey: process.env.RESEND_API_KEY?.trim() ?? "",
        // Resend's test sender works without a verified domain, but only
        // delivers to the address your Resend account was created with.
        from: process.env.EMAIL_FROM?.trim() || "The Ball Room <onboarding@resend.dev>"
    }
};
