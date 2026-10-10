type Level = "info" | "warn" | "error";

const isProduction = process.env.NODE_ENV === "production";

function serializeError(error: unknown) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            stack: error.stack
        };
    }

    return error;
}

function write(level: Level, message: string, fields: Record<string, unknown> = {}) {
    const entry: Record<string, unknown> = { ...fields };

    if ("error" in entry) {
        entry.error = serializeError(entry.error);
    }

    const stream = level === "error" ? process.stderr : process.stdout;

    // Production: one JSON object per line for log aggregators.
    // Development: readable single line.
    if (isProduction) {
        stream.write(JSON.stringify({
            time: new Date().toISOString(),
            level,
            message,
            ...entry
        }) + "\n");
        return;
    }

    const extra = Object.keys(entry).length > 0
        ? " " + JSON.stringify(entry)
        : "";

    stream.write(`[${level}] ${message}${extra}\n`);
}

export const logger = {
    info: (message: string, fields?: Record<string, unknown>) => write("info", message, fields),
    warn: (message: string, fields?: Record<string, unknown>) => write("warn", message, fields),
    error: (message: string, fields?: Record<string, unknown>) => write("error", message, fields)
};
