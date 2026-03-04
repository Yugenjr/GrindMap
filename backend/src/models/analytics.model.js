import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['LEETCODE', 'CODEFORCES', 'CODECHEF', 'ATCODER', 'GITHUB', 'SKILLRACK'],
    required: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  metrics: {
    problemsSolved: { type: Number, default: 0 },
    totalProblems: { type: Number, default: 0 },
    easyCount: { type: Number, default: 0 },
    mediumCount: { type: Number, default: 0 },
    hardCount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    submissions: { type: Number, default: 0 },
    acceptanceRate: { type: Number, default: 0 }
  },
  dailyChange: {
    problemsSolved: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    submissions: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
analyticsSchema.index({ userId: 1, platform: 1, date: -1 });
analyticsSchema.index({ userId: 1, date: -1 });
analyticsSchema.index({ platform: 1, date: -1 });
analyticsSchema.index({ date: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);
export default Analytics;