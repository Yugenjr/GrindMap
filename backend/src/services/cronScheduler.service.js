import JobQueue from './jobQueue.service.js';
import Logger from '../utils/logger.js';

class CronScheduler {
  constructor() {
    this.schedules = new Map();
    this.intervals = new Map();
    this.isRunning = false;
  }

  // Add scheduled job
  schedule(name, cronExpression, jobType, jobData, options = {}) {
    const schedule = {
      name,
      cronExpression,
      jobType,
      jobData,
      options,
      lastRun: null,
      nextRun: this.getNextRunTime(cronExpression),
      enabled: true
    };

    this.schedules.set(name, schedule);
    Logger.info('Job scheduled', { name, cronExpression, jobType });
    
    return schedule;
  }

  // Remove scheduled job
  unschedule(name) {
    if (this.intervals.has(name)) {
      clearInterval(this.intervals.get(name));
      this.intervals.delete(name);
    }
    
    this.schedules.delete(name);
    Logger.info('Job unscheduled', { name });
  }

  // Start scheduler
  start() {
    if (this.isRunning) {
      Logger.warn('Cron scheduler already running');
      return;
    }

    this.isRunning = true;
    
    // Check every minute for jobs to run
    const checkInterval = setInterval(() => {
      this.checkScheduledJobs();
    }, 60000);
    
    this.intervals.set('_main', checkInterval);
    
    // Setup default schedules
    this.setupDefaultSchedules();
    
    Logger.info('Cron scheduler started');
  }

  // Stop scheduler
  stop() {
    this.isRunning = false;
    
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
    
    Logger.info('Cron scheduler stopped');
  }

  // Check for jobs that need to run
  async checkScheduledJobs() {
    const now = new Date();
    
    for (const [name, schedule] of this.schedules) {
      if (!schedule.enabled) continue;
      
      if (now >= schedule.nextRun) {
        try {
          await this.runScheduledJob(schedule);
          
          // Update schedule
          schedule.lastRun = now;
          schedule.nextRun = this.getNextRunTime(schedule.cronExpression, now);
          
        } catch (error) {
          Logger.error('Scheduled job failed', {
            name: schedule.name,
            error: error.message
          });
        }
      }
    }
  }

  // Run scheduled job
  async runScheduledJob(schedule) {
    Logger.info('Running scheduled job', {
      name: schedule.name,
      type: schedule.jobType
    });

    // Add job to queue with high priority
    await JobQueue.add(schedule.jobType, schedule.jobData, {
      priority: 2, // High priority for scheduled jobs
      tags: ['scheduled', schedule.name],
      metadata: {
        source: 'cron_scheduler',
        scheduleName: schedule.name
      },
      ...schedule.options
    });
  }

  // Parse cron expression and get next run time
  getNextRunTime(cronExpression, fromTime = new Date()) {
    // Simple cron parser for basic expressions
    // Format: "minute hour day month dayOfWeek"
    // Examples: "0 0 * * *" (daily at midnight), "*/15 * * * *" (every 15 minutes)
    
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression format');
    }

    const [minute, hour, day, month, dayOfWeek] = parts;
    const next = new Date(fromTime);
    next.setSeconds(0);
    next.setMilliseconds(0);

    // Handle simple cases
    if (cronExpression === '0 0 * * *') {
      // Daily at midnight
      next.setHours(0, 0, 0, 0);
      next.setDate(next.getDate() + 1);
      return next;
    }

    if (cronExpression === '0 * * * *') {
      // Every hour
      next.setMinutes(0);
      next.setHours(next.getHours() + 1);
      return next;
    }

    if (cronExpression === '*/15 * * * *') {
      // Every 15 minutes
      const currentMinute = next.getMinutes();
      const nextMinute = Math.ceil((currentMinute + 1) / 15) * 15;
      
      if (nextMinute >= 60) {
        next.setHours(next.getHours() + 1);
        next.setMinutes(0);
      } else {
        next.setMinutes(nextMinute);
      }
      return next;
    }

    if (cronExpression === '*/5 * * * *') {
      // Every 5 minutes
      const currentMinute = next.getMinutes();
      const nextMinute = Math.ceil((currentMinute + 1) / 5) * 5;
      
      if (nextMinute >= 60) {
        next.setHours(next.getHours() + 1);
        next.setMinutes(0);
      } else {
        next.setMinutes(nextMinute);
      }
      return next;
    }

    // Default: add 1 hour for unknown expressions
    next.setHours(next.getHours() + 1);
    return next;
  }

  // Setup default scheduled jobs
  setupDefaultSchedules() {
    // Daily cache cleanup
    this.schedule('daily_cache_cleanup', '0 2 * * *', 'cleanup', {
      type: 'cache',
      olderThan: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Hourly analytics aggregation
    this.schedule('hourly_analytics', '0 * * * *', 'analytics', {
      type: 'aggregate_hourly'
    });

    // Daily user activity summary
    this.schedule('daily_user_summary', '0 1 * * *', 'analytics', {
      type: 'daily_summary'
    });

    // Every 15 minutes: cache warmup for popular users
    this.schedule('cache_warmup', '*/15 * * * *', 'cache_warmup', {
      type: 'popular_users',
      limit: 50
    });

    // Every 5 minutes: process pending notifications
    this.schedule('notification_processor', '*/5 * * * *', 'notification', {
      type: 'process_pending'
    });

    // Daily database cleanup
    this.schedule('database_cleanup', '0 3 * * *', 'cleanup', {
      type: 'database',
      tables: ['jobs', 'logs', 'sessions']
    });

    // Every 15 minutes: integrity check for active users
    this.schedule('integrity_check_active', '*/15 * * * *', 'integrity', {
      type: 'check_active_users',
      timeWindow: 60,
      maxUsers: 100,
      minActivityCount: 5
    });

    // Daily: cleanup expired integrity reports
    this.schedule('integrity_cleanup_expired', '0 4 * * *', 'integrity', {
      type: 'cleanup_expired'
    });

    Logger.info('Default schedules setup', { count: this.schedules.size });
  }

  // Get schedule status
  getSchedules() {
    const schedules = {};
    
    for (const [name, schedule] of this.schedules) {
      schedules[name] = {
        cronExpression: schedule.cronExpression,
        jobType: schedule.jobType,
        enabled: schedule.enabled,
        lastRun: schedule.lastRun,
        nextRun: schedule.nextRun,
        timeUntilNext: schedule.nextRun ? schedule.nextRun.getTime() - Date.now() : null
      };
    }
    
    return schedules;
  }

  // Enable/disable schedule
  toggleSchedule(name, enabled) {
    const schedule = this.schedules.get(name);
    if (schedule) {
      schedule.enabled = enabled;
      Logger.info('Schedule toggled', { name, enabled });
      return schedule;
    }
    throw new Error('Schedule not found');
  }

  // Trigger scheduled job manually
  async triggerSchedule(name) {
    const schedule = this.schedules.get(name);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    await this.runScheduledJob(schedule);
    Logger.info('Schedule triggered manually', { name });
    return schedule;
  }
}

export default new CronScheduler();