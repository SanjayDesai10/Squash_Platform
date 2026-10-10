import express from "express";
import courtRouter from "./routes/courts.js";
import bookingRouter from "./routes/booking.js";
import authRouter from "./routes/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
const app = express();
const PORT = 3000;



app.use(express.json());

app.use('/api/courts',courtRouter)
app.use('/api/bookings',bookingRouter)
app.use('/api/auth', authRouter);

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send("Backend is running!");
})


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
})



