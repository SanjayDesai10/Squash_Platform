// Postgres unique_violation SQLSTATE.
const UNIQUE_VIOLATION = "23505";

/**
 * True when `error` is a Postgres unique violation on the named
 * constraint/index. Matching the constraint name keeps unrelated
 * unique violations from being misreported.
 */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
    return (
        typeof error === "object" &&
        error !== null &&
        "sqlState" in error &&
        error.sqlState === UNIQUE_VIOLATION &&
        "constraint" in error &&
        error.constraint === constraint
    );
}
