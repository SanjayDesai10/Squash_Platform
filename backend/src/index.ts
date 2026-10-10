// config must load first: it validates required environment variables.
import { config } from "./config.js";
import express from "express";
import courtRouter from "./routes/courts.js";
import bookingRouter from "./routes/booking.js";
import authRouter from "./routes/auth.js";
import adminRouter from "./routes/admin.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { cors, securityHeaders } from "./middleware/security.js";
import { logger } from "./lib/logger.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/betterAuth.js";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", config.trustProxy);

app.use(requestLogger);
app.use(securityHeaders);
app.use(cors);

// Better Auth (Google OAuth). Must be mounted before express.json():
// it reads the raw request body itself.
app.all(`${config.betterAuth.basePath}/*splat`, toNodeHandler(auth));

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use('/api/courts', courtRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ message: "not found" });
});

// Must be registered after all routes.
app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`Server is running on http://localhost:${config.port}`, {
    env: config.nodeEnv
  });
});

function shutdown(signal: string) {
  logger.info("shutting down", { signal });

  server.close(() => process.exit(0));

  // Force exit if open connections keep the server alive.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (error) => {
  logger.error("unhandled promise rejection", { error });
});
