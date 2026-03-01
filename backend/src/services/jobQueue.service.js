import Job from '../models/job.model.js';
import { createClient } from 'redis';
import Logger from '../utils/logger.js';

class JobQueue {
  constructor() {
    this.redis = null;
    this.redisConnected = false;
    this.workers = new Map();
    this.isProcessing = false;
    this.processingInterval = null;
    this.workerId = `worker_${process.pid}_${Date.now()}`;
    
    this.jobHandlers = new Map();
    this.init();
  }

  async init() {
    try {
      this.redis = createClient({ 
        url: process.env.REDIS_URL,
        socket: { reconnectStrategy: false }
      });
      
      this.redis.on('connect', () => {
        this.redisConnected = true;
        Logger.info('Job queue connected to Redis');
      });
      
      this.redis.on('error', () => {
        this.redisConnected = false;
      });
      
      await this.redis.connect();
    } catch (error) {
      Logger.warn('Job queue using database-only mode');
      this.redisConnected = false;
    }
  }

  // Add job to queue
  async add(type, data, options = {}) {
    const {
      priority = 5,
      delay = 0,
      maxAttempts = 3,
      tags = [],
      metadata = {}
    } = options;

    const job = new Job({
      type,
      data,
      priority,
      maxAttempts,
      delay,
      scheduledAt: new Date(Date.now() + delay),
      tags,
      metadata
    });

    await job.save();

    // Notify workers via Redis if available
    if (this.redisConnected) {
      try {
        await this.redis.publish('job_added', JSON.stringify({
          jobId: job.id,
          type: job.type,
          priority: job.priority
        }));
      } catch (error) {
        Logger.warn('Failed to publish job notification', { error: error.message });
      }
    }

    Logger.info('Job added to queue', {
      jobId: job.id,
      type: job.type,
      priority: job.priority,
      delay: job.delay
    });

    return job;
  }

  // Register job handler
  registerHandler(type, handler) {
    this.jobHandlers.set(type, handler);
    Logger.info('Job handler registered', { type });
  }

  // Start processing jobs
  startProcessing(options = {}) {
    if (this.isProcessing) {
      Logger.warn('Job processing already started');
      return;
    }

    const {
      concurrency = 5,
      pollInterval = 1000,
      types = []
    } = options;

    this.isProcessing = true;
    this.concurrency = concurrency;
    this.processingTypes = types;

    // Start worker processes
    for (let i = 0; i < concurrency; i++) {
      this.startWorker(`${this.workerId}_${i}`);
    }

    // Start polling for jobs
    this.processingInterval = setInterval(() => {
      this.processJobs();
    }, pollInterval);

    // Subscribe to Redis notifications if available
    if (this.redisConnected) {
      this.subscribeToNotifications();
    }

    Logger.info('Job processing started', {
      workerId: this.workerId,
      concurrency,
      types: types.length > 0 ? types : 'all'
    });
  }

  // Stop processing jobs
  stopProcessing() {
    this.isProcessing = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Stop all workers
    for (const [workerId, worker] of this.workers) {
      worker.stop();
    }
    this.workers.clear();

    Logger.info('Job processing stopped', { workerId: this.workerId });
  }

  // Start individual worker
  async startWorker(workerId) {
    const worker = {
      id: workerId,
      isProcessing: false,
      currentJob: null,
      stop: () => {
        worker.isProcessing = false;
      }
    };

    this.workers.set(workerId, worker);

    while (this.isProcessing && !worker.isProcessing) {
      try {
        worker.isProcessing = true;
        const job = await Job.getNextJob(workerId, this.processingTypes);
        
        if (job) {
          worker.currentJob = job;
          await this.processJob(job, workerId);
          worker.currentJob = null;
        } else {
          // No jobs available, wait a bit
          await this.delay(1000);
        }
      } catch (error) {
        Logger.error('Worker error', { workerId, error: error.message });
        await this.delay(5000); // Wait longer on error
      } finally {
        worker.isProcessing = false;
      }
    }
  }

  // Process individual job
  async processJob(job, workerId) {
    Logger.info('Processing job', {
      jobId: job.id,
      type: job.type,
      workerId,
      attempt: job.attempts
    });

    const handler = this.jobHandlers.get(job.type);
    if (!handler) {
      const error = new Error(`No handler registered for job type: ${job.type}`);
      job.markAsFailed(error);
      await job.save();
      return;
    }

    try {
      const result = await Promise.race([
        handler(job.data, job),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Job timeout')), 300000) // 5 minute timeout
        )
      ]);

      job.markAsCompleted(result);
      await job.save();

      Logger.info('Job completed', {
        jobId: job.id,
        type: job.type,
        processingTime: job.processingTime
      });

    } catch (error) {
      Logger.error('Job failed', {
        jobId: job.id,
        type: job.type,
        error: error.message,
        attempt: job.attempts
      });

      // Try to retry the job
      if (job.scheduleRetry()) {
        job.status = 'retrying';
        await job.save();
        
        Logger.info('Job scheduled for retry', {
          jobId: job.id,
          nextRetryAt: job.nextRetryAt,
          attempt: job.attempts
        });
      } else {
        job.markAsFailed(error);
        await job.save();
        
        Logger.error('Job failed permanently', {
          jobId: job.id,
          maxAttempts: job.maxAttempts
        });
      }
    }
  }

  // Process jobs (polling method)
  async processJobs() {
    if (!this.isProcessing) return;

    try {
      // Clean up old completed jobs
      await this.cleanupOldJobs();
      
      // Reset stuck jobs
      await this.resetStuckJobs();
      
    } catch (error) {
      Logger.error('Job processing error', { error: error.message });
    }
  }

  // Subscribe to Redis notifications
  async subscribeToNotifications() {
    try {
      const subscriber = this.redis.duplicate();
      await subscriber.connect();
      
      await subscriber.subscribe('job_added', (message) => {
        try {
          const jobInfo = JSON.parse(message);
          Logger.debug('Job notification received', jobInfo);
          // Trigger immediate processing check
          this.processJobs();
        } catch (error) {
          Logger.warn('Invalid job notification', { message });
        }
      });
      
    } catch (error) {
      Logger.warn('Failed to subscribe to job notifications', { error: error.message });
    }
  }

  // Clean up old completed jobs
  async cleanupOldJobs() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const result = await Job.deleteMany({
      status: { $in: ['completed', 'failed'] },
      updatedAt: { $lt: cutoff }
    });

    if (result.deletedCount > 0) {
      Logger.info('Cleaned up old jobs', { count: result.deletedCount });
    }
  }

  // Reset stuck jobs (processing for too long)
  async resetStuckJobs() {
    const stuckThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    
    const stuckJobs = await Job.find({
      status: 'processing',
      startedAt: { $lt: stuckThreshold }
    });

    for (const job of stuckJobs) {
      Logger.warn('Resetting stuck job', { jobId: job.id, workerId: job.workerId });
      
      if (job.scheduleRetry()) {
        await job.save();
      } else {
        job.markAsFailed(new Error('Job stuck in processing state'));
        await job.save();
      }
    }
  }

  // Get job statistics
  async getStats() {
    const stats = await Job.getJobStats();
    const queueStats = await Job.aggregate([
      {
        $group: {
          _id: '$type',
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          processing: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      }
    ]);

    return {
      overall: stats,
      byType: queueStats,
      workers: {
        active: this.workers.size,
        processing: Array.from(this.workers.values()).filter(w => w.isProcessing).length
      }
    };
  }

  // Cancel job
  async cancelJob(jobId) {
    const job = await Job.findOne({ id: jobId });
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'processing') {
      throw new Error('Cannot cancel job that is currently processing');
    }

    job.status = 'cancelled';
    await job.save();

    Logger.info('Job cancelled', { jobId });
    return job;
  }

  // Retry failed job
  async retryJob(jobId) {
    const job = await Job.findOne({ id: jobId });
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'failed') {
      throw new Error('Only failed jobs can be retried');
    }

    job.status = 'pending';
    job.attempts = 0;
    job.error = null;
    job.scheduledAt = new Date();
    job.nextRetryAt = null;

    await job.save();

    Logger.info('Job scheduled for retry', { jobId });
    return job;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new JobQueue();