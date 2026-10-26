
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resource",
      required: [true, "A resource must be selected"],
    },
    bookingDate: {
      type: String,
      required: [true, "Booking date is required"],
      match: [
        /^\d{4}-\d{2}-\d{2}$/,
        "Booking date must use YYYY-MM-DD format",
      ],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: [
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Start time must use HH:mm format",
      ],
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: [
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "End time must use HH:mm format",
      ],
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent overlapping active bookings for the same resource and date.
bookingSchema.index({
  resource: 1,
  bookingDate: 1,
  status: 1,
  startTime: 1,
  endTime: 1,
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
