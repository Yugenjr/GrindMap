import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["problems", "rating", "streak", "time", "consistency", "custom"],
      required: true
    },
    targetValue: { type: Number, required: true },
    targetUnit: { type: String, required: true }, // "problems", "rating", "days", "minutes", etc.
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "expert"],
      default: "medium"
    },
    estimatedDuration: { type: Number, default: 30 }, // days
    isTemplate: { type: Boolean, default: false }, // predefined goal templates
    isActive: { type: Boolean, default: true },
    tags: [{ type: String }],
    reward: {
      points: { type: Number, default: 50 },
      badge: { type: mongoose.Schema.Types.ObjectId, ref: "Badge" }
    }
  },
  { timestamps: true }
);

const Goal = mongoose.model("Goal", goalSchema);
export default Goal;