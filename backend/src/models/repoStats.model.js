import mongoose from "mongoose";

const repoStatsSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['view', 'star', 'fork', 'clone'],
      required: true
    },
    count: {
      type: Number,
      default: 0
    },
    uniqueVisitors: [{
      ip: String,
      userAgent: String,
      timestamp: { type: Date, default: Date.now }
    }],
    dailyStats: [{
      date: { type: Date, required: true },
      count: { type: Number, default: 0 }
    }]
  },
  { timestamps: true }
);

// Index for quick lookups
repoStatsSchema.index({ type: 1 });
repoStatsSchema.index({ 'dailyStats.date': 1 });

const RepoStats = mongoose.model("RepoStats", repoStatsSchema);

export default RepoStats;
