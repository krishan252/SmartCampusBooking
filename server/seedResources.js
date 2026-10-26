
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";
import Resource from "./models/Resource.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const resources = [
  {
    name: "Study Room A",
    type: "Study Room",
    location: "Library · Floor 1",
    capacity: 6,
    description: "A quiet study room for individual and group study.",
  },
  {
    name: "Computer Lab 01",
    type: "Laboratory",
    location: "Engineering Block",
    capacity: 30,
    description: "A computer laboratory for academic and practical work.",
  },
  {
    name: "Meeting Room B",
    type: "Meeting Room",
    location: "Main Building · Floor 2",
    capacity: 10,
    description: "A meeting space for student discussions and teamwork.",
  },
  {
    name: "Study Room B",
    type: "Study Room",
    location: "Library · Floor 2",
    capacity: 4,
    description: "A small study room for focused learning.",
  },
  {
    name: "Computer Lab 02",
    type: "Laboratory",
    location: "Science Block",
    capacity: 25,
    description: "A computer laboratory for student practical sessions.",
  },
  {
    name: "Project Room",
    type: "Meeting Room",
    location: "Innovation Centre",
    capacity: 8,
    description: "A collaborative space for student projects.",
  },
];

async function seedResources() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from server/.env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");

    for (const resource of resources) {
      await Resource.updateOne(
        { name: resource.name },
        { $set: resource },
        { upsert: true, runValidators: true }
      );
    }

    console.log("Successfully added or updated 6 campus resources.");

    const savedResources = await Resource.find({
      isActive: true,
    }).sort({ name: 1 });

    console.log("\nResources currently in the database:");
    console.table(
      savedResources.map((resource) => ({
        name: resource.name,
        type: resource.type,
        location: resource.location,
        capacity: resource.capacity,
      }))
    );
  } catch (error) {
    console.error("Failed to seed resources:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedResources();
