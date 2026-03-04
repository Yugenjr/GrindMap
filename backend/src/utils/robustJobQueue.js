import Logger from './logger.js';

class RobustJobQueue {
  constructor() {
    this.handlers = new Map();
    this.processing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000;
    this.jobs = [];
    this.completed = [];
    this.deadLetter = [];
  }

  registerHandler(type, handler) {
    this.handlers.set(type, handler);
  }

  async addJob(type, data, options = {}) {
    const job = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      attempts: 0,
      maxRetries: options.maxRetries || this.maxRetries,
      createdAt: new Date().toISOString(),
      priority: options.priority || 0
    };

    this.jobs.push(job);
    Logger.info('Job added to queue', { jobId: job.id, type });
    return job.id;
  }

  async startProcessing() {
    if (this.processing) return;
    this.processing = true;

    Logger.info('Job queue processing started');

    while (this.processing) {
      try {
        if (this.jobs.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        const job = this.jobs.shift();
        await this.processJob(job);
      } catch (error) {
        Logger.error('Job processing error', { error: error.message });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async processJob(job) {
    const handler = this.handlers.get(job.type);
    if (!handler) {
      Logger.error('No handler for job type', { jobId: job.id, type: job.type });
      this.moveToDeadLetter(job, 'No handler found');
      return;
    }

    job.attempts++;
    job.startedAt = new Date().toISOString();

    try {
      Logger.info('Processing job', { jobId: job.id, type: job.type, attempt: job.attempts });
      
      await handler(job.data);
      
      job.completedAt = new Date().toISOString();
      this.completed.push(job);
      
      Logger.info('Job completed successfully', { jobId: job.id, type: job.type });
    } catch (error) {
      Logger.error('Job failed', { 
        jobId: job.id, 
        type: job.type, 
        attempt: job.attempts, 
        error: error.message 
      });

      if (job.attempts < job.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, job.attempts - 1);
        setTimeout(() => {
          this.jobs.push(job);
        }, delay);
        
        Logger.info('Job scheduled for retry', { 
          jobId: job.id, 
          attempt: job.attempts, 
          delay 
        });
      } else {
        this.moveToDeadLetter(job, error.message);
      }
    }
  }

  moveToDeadLetter(job, error) {
    job.failedAt = new Date().toISOString();
    job.error = error;
    
    this.deadLetter.push(job);
    Logger.error('Job moved to dead letter queue', { 
      jobId: job.id, 
      type: job.type, 
      error 
    });
  }

  async getStats() {
    return { 
      pending: this.jobs.length, 
      completed: this.completed.length, 
      deadLetter: this.deadLetter.length 
    };
  }

  async retryDeadLetterJobs(limit = 10) {
    const toRetry = this.deadLetter.splice(0, limit);
    
    for (const job of toRetry) {
      job.attempts = 0;
      delete job.error;
      delete job.failedAt;
      this.jobs.push(job);
      Logger.info('Dead letter job requeued', { jobId: job.id, type: job.type });
    }
  }

  stopProcessing() {
    this.processing = false;
    Logger.info('Job queue processing stopped');
  }
}

export default new RobustJobQueue();