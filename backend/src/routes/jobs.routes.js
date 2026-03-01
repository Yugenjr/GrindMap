import express from 'express';
import JobQueue from '../services/jobQueue.service.js';
import CronScheduler from '../services/cronScheduler.service.js';
import Job from '../models/job.model.js';
import { verifyJWT } from '../middlewares/jwtManager.middleware.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// Add job to queue
router.post('/add', verifyJWT, async (req, res) => {
  try {
    const { type, data, priority = 5, delay = 0, maxAttempts = 3, tags = [] } = req.body;
    
    if (!type || !data) {
      return res.status(400).json({
        success: false,
        error: 'Job type and data are required'
      });
    }
    
    const job = await JobQueue.add(type, data, {
      priority,
      delay,
      maxAttempts,
      tags,
      metadata: {
        userId: req.user.id,
        source: 'api_request'
      }
    });
    
    res.json({
      success: true,
      data: {
        jobId: job.id,
        type: job.type,
        status: job.status,
        priority: job.priority,
        scheduledAt: job.scheduledAt
      },
      message: 'Job added to queue'
    });
  } catch (error) {
    Logger.error('Add job failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to add job'
    });
  }
});

// Get job status
router.get('/status/:jobId', verifyJWT, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await Job.findOne({ id: jobId });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: job.id,
        type: job.type,
        status: job.status,
        priority: job.priority,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        scheduledAt: job.scheduledAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        processingTime: job.processingTime,
        result: job.result,
        error: job.error,
        workerId: job.workerId
      }
    });
  } catch (error) {
    Logger.error('Get job status failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get job status'
    });
  }
});

// Get job queue statistics
router.get('/stats', verifyJWT, async (req, res) => {
  try {
    const stats = await JobQueue.getStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Get job stats failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get job statistics'
    });
  }
});

// List jobs with filtering
router.get('/list', verifyJWT, async (req, res) => {
  try {
    const {
      status,
      type,
      limit = 50,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    
    // Non-admin users can only see their own jobs
    if (req.user.role !== 'admin') {
      query['metadata.userId'] = req.user.id;
    }
    
    const jobs = await Job.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-data -result'); // Exclude potentially large fields
    
    const total = await Job.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    Logger.error('List jobs failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to list jobs'
    });
  }
});

// Cancel job
router.post('/cancel/:jobId', verifyJWT, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await JobQueue.cancelJob(jobId);
    
    res.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status
      },
      message: 'Job cancelled successfully'
    });
  } catch (error) {
    Logger.error('Cancel job failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Retry failed job
router.post('/retry/:jobId', verifyJWT, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await JobQueue.retryJob(jobId);
    
    res.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        attempts: job.attempts
      },
      message: 'Job scheduled for retry'
    });
  } catch (error) {
    Logger.error('Retry job failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get scheduled jobs (cron)
router.get('/schedules', verifyJWT, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const schedules = CronScheduler.getSchedules();
    
    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    Logger.error('Get schedules failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get schedules'
    });
  }
});

// Toggle schedule
router.post('/schedules/:name/toggle', verifyJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { name } = req.params;
    const { enabled } = req.body;
    
    const schedule = CronScheduler.toggleSchedule(name, enabled);
    
    res.json({
      success: true,
      data: {
        name: schedule.name,
        enabled: schedule.enabled
      },
      message: `Schedule ${enabled ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    Logger.error('Toggle schedule failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Trigger schedule manually
router.post('/schedules/:name/trigger', verifyJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { name } = req.params;
    await CronScheduler.triggerSchedule(name);
    
    res.json({
      success: true,
      message: `Schedule '${name}' triggered successfully`
    });
  } catch (error) {
    Logger.error('Trigger schedule failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Bulk operations (admin only)
router.post('/bulk/:action', verifyJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { action } = req.params;
    const { jobIds = [], status, type } = req.body;
    
    let result;
    
    switch (action) {
      case 'cancel':
        result = await Job.updateMany(
          { 
            id: { $in: jobIds },
            status: { $in: ['pending', 'retrying'] }
          },
          { status: 'cancelled' }
        );
        break;
        
      case 'retry':
        result = await Job.updateMany(
          {
            id: { $in: jobIds },
            status: 'failed'
          },
          {
            status: 'pending',
            attempts: 0,
            error: null,
            scheduledAt: new Date(),
            nextRetryAt: null
          }
        );
        break;
        
      case 'delete':
        result = await Job.deleteMany({
          id: { $in: jobIds },
          status: { $in: ['completed', 'failed', 'cancelled'] }
        });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid bulk action'
        });
    }
    
    res.json({
      success: true,
      data: {
        action,
        affected: result.modifiedCount || result.deletedCount,
        jobIds: jobIds.length
      },
      message: `Bulk ${action} completed`
    });
  } catch (error) {
    Logger.error('Bulk operation failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Bulk operation failed'
    });
  }
});

export default router;