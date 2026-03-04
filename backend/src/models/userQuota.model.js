import mongoose from 'mongoose';

const userQuotaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  tier: {
    type: String,
    enum: ['free', 'premium', 'enterprise'],
    default: 'free'
  },
  quotas: {
    daily: {
      limit: { type: Number, default: 100 },
      used: { type: Number, default: 0 },
      resetAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) }
    },
    monthly: {
      limit: { type: Number, default: 2000 },
      used: { type: Number, default: 0 },
      resetAt: { type: Date, default: () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) }
    },
    concurrent: {
      limit: { type: Number, default: 5 },
      current: { type: Number, default: 0 }
    }
  },
  usage: [{
    endpoint: String,
    method: String,
    timestamp: { type: Date, default: Date.now },
    responseTime: Number,
    statusCode: Number,
    userAgent: String,
    ip: String
  }],
  rateLimits: {
    perMinute: { type: Number, default: 60 },
    perHour: { type: Number, default: 1000 },
    burstLimit: { type: Number, default: 10 }
  },
  overages: [{
    date: Date,
    type: String, // 'daily', 'monthly', 'rate'
    amount: Number,
    cost: Number
  }],
  lastActivity: { type: Date, default: Date.now },
  isBlocked: { type: Boolean, default: false },
  blockReason: String,
  blockUntil: Date
}, {
  timestamps: true
});

// Indexes for performance
userQuotaSchema.index({ 'quotas.daily.resetAt': 1 });
userQuotaSchema.index({ 'quotas.monthly.resetAt': 1 });
userQuotaSchema.index({ lastActivity: 1 });

// Methods
userQuotaSchema.methods.resetDailyQuota = function() {
  this.quotas.daily.used = 0;
  this.quotas.daily.resetAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
};

userQuotaSchema.methods.resetMonthlyQuota = function() {
  this.quotas.monthly.used = 0;
  const now = new Date();
  this.quotas.monthly.resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
};

userQuotaSchema.methods.canMakeRequest = function() {
  const now = new Date();
  
  // Check if quotas need reset
  if (now >= this.quotas.daily.resetAt) {
    this.resetDailyQuota();
  }
  if (now >= this.quotas.monthly.resetAt) {
    this.resetMonthlyQuota();
  }
  
  // Check if blocked
  if (this.isBlocked && this.blockUntil && now < this.blockUntil) {
    return { allowed: false, reason: 'blocked', blockUntil: this.blockUntil };
  }
  
  // Check quotas
  if (this.quotas.daily.used >= this.quotas.daily.limit) {
    return { allowed: false, reason: 'daily_quota_exceeded', resetAt: this.quotas.daily.resetAt };
  }
  
  if (this.quotas.monthly.used >= this.quotas.monthly.limit) {
    return { allowed: false, reason: 'monthly_quota_exceeded', resetAt: this.quotas.monthly.resetAt };
  }
  
  if (this.quotas.concurrent.current >= this.quotas.concurrent.limit) {
    return { allowed: false, reason: 'concurrent_limit_exceeded' };
  }
  
  return { allowed: true };
};

userQuotaSchema.methods.incrementUsage = function(endpoint, method, responseTime, statusCode, userAgent, ip) {
  this.quotas.daily.used += 1;
  this.quotas.monthly.used += 1;
  this.lastActivity = new Date();
  
  // Add usage record (keep last 1000)
  this.usage.push({
    endpoint,
    method,
    timestamp: new Date(),
    responseTime,
    statusCode,
    userAgent,
    ip
  });
  
  if (this.usage.length > 1000) {
    this.usage = this.usage.slice(-1000);
  }
};

export default mongoose.model('UserQuota', userQuotaSchema);