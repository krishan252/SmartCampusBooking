
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";

import Resource from "./models/Resource.js";
import Booking from "./models/Booking.js";

// Use Google's DNS for MongoDB SRV lookups
dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    message: "Smart Campus Resource Booking System API is running!",
    database:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
  });
});

// GET: Retrieve all active campus resources
app.get("/api/resources", async (req, res) => {
  try {
    const resources = await Resource.find({
      isActive: true,
    }).sort({ name: 1 });

    res.status(200).json(resources);
  } catch (error) {
    console.error("Error fetching resources:", error);

    res.status(500).json({
      message: "Failed to fetch resources",
    });
  }
});

// GET: Retrieve one active campus resource by ID
app.get("/api/resources/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid resource ID",
      });
    }

    const resource = await Resource.findOne({
      _id: id,
      isActive: true,
    });

    if (!resource) {
      return res.status(404).json({
        message: "Resource not found",
      });
    }

    res.status(200).json(resource);
  } catch (error) {
    console.error("Error fetching resource:", error);

    res.status(500).json({
      message: "Failed to fetch resource",
    });
  }
});

// POST: Create a booking request
app.post("/api/bookings", async (req, res) => {
  try {
    const { resourceId, bookingDate, startTime, endTime } = req.body;

    // Check required fields
    if (!resourceId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({
        message: "Resource, date, start time, and end time are required.",
      });
    }

    // Validate MongoDB resource ID
    if (!mongoose.isValidObjectId(resourceId)) {
      return res.status(400).json({
        message: "Invalid resource ID.",
      });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      return res.status(400).json({
        message: "Booking date must use YYYY-MM-DD format.",
      });
    }

    // Validate that the date is a real calendar date
    const parsedDate = new Date(`${bookingDate}T00:00:00Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== bookingDate
    ) {
      return res.status(400).json({
        message: "Please provide a valid booking date.",
      });
    }

    // Validate 24-hour time format
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      return res.status(400).json({
        message: "Times must use HH:mm format.",
      });
    }

    // End time must be later than start time
    if (startTime >= endTime) {
      return res.status(400).json({
        message: "End time must be later than start time.",
      });
    }

    // Reject past booking dates using the server's local calendar date
    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    if (bookingDate < todayString) {
      return res.status(400).json({
        message: "Past booking dates are not allowed.",
      });
    }

    // Confirm that the resource exists and is active
    const resource = await Resource.findOne({
      _id: resourceId,
      isActive: true,
    });

    if (!resource) {
      return res.status(404).json({
        message: "Active resource not found.",
      });
    }

    // Find overlapping bookings for this resource and date.
    // Existing Pending and Approved bookings both reserve the time.
    const overlappingBooking = await Booking.findOne({
      resource: resourceId,
      bookingDate,
      status: { $in: ["Pending", "Approved"] },
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
    });

    if (overlappingBooking) {
      return res.status(409).json({
        message:
          "This resource is already booked or has a pending request during that time. Please choose another time.",
      });
    }

    // Create the booking with Pending status
    const booking = await Booking.create({
      resource: resourceId,
      bookingDate,
      startTime,
      endTime,
      status: "Pending",
    });

    return res.status(201).json({
      message: "Booking request submitted successfully.",
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);

    // Handle schema validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Failed to create booking.",
    });
  }
});

// GET: Retrieve bookings (for development and testing)
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("resource", "name type location")
      .sort({ bookingDate: 1, startTime: 1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);

    res.status(500).json({
      message: "Failed to fetch bookings.",
    });
  }
});

// Server configuration
const PORT = process.env.PORT || 5000;

// Connect to MongoDB before starting the server
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
