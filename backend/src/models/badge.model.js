import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, required: true }, // URL or icon identifier
    category: {
      type: String,
      enum: ["problems", "streak", "rating", "speed", "consistency"],
      required: true
    },
    criteria: {
      type: { type: String, required: true }, // "count", "rating", "streak", "time"
      value: { type: Number, required: true }, // threshold value
      platform: { type: String, default: null } // specific platform or null for all
    },
    rarity: {
      type: String,
      enum: ["common", "rare", "epic", "legendary"],
      default: "common"
    },
    points: { type: Number, default: 10 }, // points awarded for earning this badge
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Badge = mongoose.model("Badge", badgeSchema);
export default Badge;