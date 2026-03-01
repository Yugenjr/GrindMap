import mongoose from "mongoose";

const userBadgeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    badge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Badge",
      required: true
    },
    earnedAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 100 }, // percentage of completion (100 = earned)
    isNew: { type: Boolean, default: true } // for showing "new" indicator
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

// Compound index to ensure a user can't earn the same badge twice
userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

const UserBadge = mongoose.model("UserBadge", userBadgeSchema);
export default UserBadge;