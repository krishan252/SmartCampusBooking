
import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Resource name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Resource type is required"],
      enum: ["Study Room", "Laboratory", "Meeting Room"],
    },
    location: {
      type: String,
      required: [true, "Resource location is required"],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, "Resource capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
