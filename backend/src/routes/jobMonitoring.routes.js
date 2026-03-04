import express from 'express';
import RobustJobQueue from '../utils/robustJobQueue.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Get job queue statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await RobustJobQueue.getStats();
  
  res.json({
    success: true,
    data: {
      ...stats,
      timestamp: new Date().toISOString()
    }
  });
}));

// Add a new job
router.post('/add', asyncHandler(async (req, res) => {
  const { type, data, options } = req.body;
  
  if (!type || !data) {
    return res.status(400).json({
      success: false,
      error: 'Job type and data are required'
    });
  }
  
  const jobId = await RobustJobQueue.addJob(type, data, options);
  
  res.json({
    success: true,
    data: { jobId },
    message: 'Job added to queue'
  });
}));

// Retry dead letter jobs
router.post('/retry-dead-letter', asyncHandler(async (req, res) => {
  const { limit = 10 } = req.body;
  
  await RobustJobQueue.retryDeadLetterJobs(limit);
  
  res.json({
    success: true,
    message: `Retried up to ${limit} dead letter jobs`
  });
}));

export default router;