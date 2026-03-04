import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  type: {
    type: String,
    required: true,
    enum: ['scraping', 'cache_warmup', 'analytics', 'notification', 'cleanup', 'export']
  },
  priority: {
    type: Number,
    default: 5,
    min: 1,
    max: 10 // 1 = highest priority, 10 = lowest
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'retrying', 'cancelled'],
    default: 'pending'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  error: {
    message: String,
    stack: String,
    code: String
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  delay: {
    type: Number,
    default: 0 // Delay in milliseconds
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  startedAt: Date,
  completedAt: Date,
  failedAt: Date,
  nextRetryAt: Date,
  processingTime: Number,
  workerId: String,
  tags: [String],
  metadata: {
    userId: String,
    correlationId: String,
    source: String
  }
}, {
  timestamps: true
});

// Indexes for performance
jobSchema.index({ status: 1, priority: 1, scheduledAt: 1 });
jobSchema.index({ type: 1, status: 1 });
jobSchema.index({ workerId: 1 });
jobSchema.index({ scheduledAt: 1 });
jobSchema.index({ nextRetryAt: 1 });
jobSchema.index({ 'metadata.userId': 1 });

// Methods
jobSchema.methods.markAsProcessing = function(workerId) {
  this.status = 'processing';
  this.startedAt = new Date();
  this.workerId = workerId;
  this.attempts += 1;
};

jobSchema.methods.markAsCompleted = function(result) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.result = result;
  this.processingTime = this.completedAt - this.startedAt;
};

jobSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.error = {
    message: error.message,
    stack: error.stack,
    code: error.code
  };
  this.processingTime = this.failedAt - this.startedAt;
};

jobSchema.methods.scheduleRetry = function(delay = null) {
  if (this.attempts >= this.maxAttempts) {
    this.markAsFailed(new Error('Max retry attempts exceeded'));
    return false;
  }
  
  this.status = 'retrying';
  const retryDelay = delay || Math.min(1000 * Math.pow(2, this.attempts), 300000); // Exponential backoff, max 5 minutes
  this.nextRetryAt = new Date(Date.now() + retryDelay);
  this.delay = retryDelay;
  
  return true;
};

jobSchema.methods.canProcess = function() {
  if (this.status !== 'pending' && this.status !== 'retrying') {
    return false;
  }
  
  const now = new Date();
  return now >= this.scheduledAt && (!this.nextRetryAt || now >= this.nextRetryAt);
};

// Static methods
jobSchema.statics.getNextJob = function(workerId, types = []) {
  const query = {
    status: { $in: ['pending', 'retrying'] },
    $or: [
      { scheduledAt: { $lte: new Date() } },
      { nextRetryAt: { $lte: new Date() } }
    ]
  };
  
  if (types.length > 0) {
    query.type = { $in: types };
  }
  
  return this.findOneAndUpdate(
    query,
    {
      $set: {
        status: 'processing',
        startedAt: new Date(),
        workerId: workerId
      },
      $inc: { attempts: 1 }
    },
    {
      sort: { priority: 1, scheduledAt: 1 }, // Lower priority number = higher priority
      new: true
    }
  );
};

jobSchema.statics.getJobStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' }
      }
    }
  ]);
};

export default mongoose.model('Job', jobSchema);