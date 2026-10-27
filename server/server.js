
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";
import Resource from "./models/Resource.js";
import Booking from "./models/Booking.js";

// Use Google's DNS for MongoDB Atlas SRV lookups
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Smart Campus Resource Booking System API is running!",
    database:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
  });
});

// GET all active resources
app.get("/api/resources", async (req, res) => {
  try {
    const resources = await Resource.find({
      isActive: true,
    }).sort({ name: 1 });

    res.json(resources);
  } catch (error) {
    console.error("Fetch resources error:", error);
    res.status(500).json({ message: "Failed to fetch resources." });
  }
});

// GET one active resource
app.get("/api/resources/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid resource ID." });
    }

    const resource = await Resource.findOne({
      _id: id,
      isActive: true,
    });

    if (!resource) {
      return res.status(404).json({ message: "Resource not found." });
    }

    res.json(resource);
  } catch (error) {
    console.error("Fetch resource error:", error);
    res.status(500).json({ message: "Failed to fetch resource." });
  }
});

// GET all bookings
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("resource")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    res.status(500).json({ message: "Failed to fetch bookings." });
  }
});

// CREATE a booking
app.post("/api/bookings", async (req, res) => {
  try {
    const { resource, bookingDate, startTime, endTime } = req.body;

    if (
      !resource ||
      !bookingDate ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        message: "Resource, date, start time, and end time are required.",
      });
    }

    if (!mongoose.isValidObjectId(resource)) {
      return res.status(400).json({ message: "Invalid resource ID." });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        message: "End time must be later than start time.",
      });
    }

    const selectedResource = await Resource.findOne({
      _id: resource,
      isActive: true,
    });

    if (!selectedResource) {
      return res.status(404).json({
        message: "Resource not found or inactive.",
      });
    }

    // Prevent overlapping Pending or Approved bookings
    const conflict = await Booking.findOne({
      resource,
      bookingDate,
      status: { $in: ["Pending", "Approved"] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      return res.status(409).json({
        message:
          "This resource is already booked or has a pending request during that time. Please choose another time.",
      });
    }

    const booking = await Booking.create({
      resource,
      bookingDate,
      startTime,
      endTime,
      status: "Pending",
    });

    const savedBooking = await Booking.findById(booking._id)
      .populate("resource");

    res.status(201).json({
      message: "Booking request submitted successfully! Status: Pending.",
      booking: savedBooking,
    });
  } catch (error) {
    console.error("Create booking error:", error);
    res.status(500).json({ message: "Failed to create booking." });
  }
});

// UPDATE a pending booking
app.put("/api/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { bookingDate, startTime, endTime } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    if (!bookingDate || !startTime || !endTime) {
      return res.status(400).json({
        message: "Date, start time, and end time are required.",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        message: "End time must be later than start time.",
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending bookings can be edited.",
      });
    }

    // Ignore this booking when checking for conflicts
    const conflict = await Booking.findOne({
      _id: { $ne: id },
      resource: booking.resource,
      bookingDate,
      status: { $in: ["Pending", "Approved"] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (conflict) {
      return res.status(409).json({
        message:
          "This resource is already booked during that time. Please choose another time.",
      });
    }

    booking.bookingDate = bookingDate;
    booking.startTime = startTime;
    booking.endTime = endTime;

    await booking.save();

    const updatedBooking = await Booking.findById(id)
      .populate("resource");

    res.json({
      message: "Booking updated successfully.",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Update booking error:", error);
    res.status(500).json({ message: "Failed to update booking." });
  }
});

// DELETE / cancel a pending booking
app.delete("/api/bookings/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid booking ID." });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending bookings can be cancelled.",
      });
    }

    await Booking.findByIdAndDelete(id);

    res.json({ message: "Booking cancelled successfully." });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({ message: "Failed to cancel booking." });
  }
});

// Start server after connecting to MongoDB
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

startServer();
