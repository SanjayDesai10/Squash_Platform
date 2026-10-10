export class BookingConflictError extends Error {
    constructor() {
        super("the time slot is already booked");
        this.name = "BookingConflictError";
    }
}