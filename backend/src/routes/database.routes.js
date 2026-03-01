import express from 'express';
import dbManager from '../utils/databaseManager.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// Database health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await dbManager.healthCheck();
    const stats = dbManager.getConnectionStats();
    
    const response = {
      database: health,
      connection: stats,
      timestamp: new Date().toISOString()
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    Logger.error('Health check endpoint failed', { error: error.message });
    res.status(503).json({
      database: { status: 'error', error: error.message },
      timestamp: new Date().toISOString()
    });
  }
});

// Database statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    const stats = dbManager.getConnectionStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Database stats endpoint failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Force reconnection endpoint (admin only)
router.post('/reconnect', async (req, res) => {
  try {
    await dbManager.handleDisconnection();
    res.json({
      success: true,
      message: 'Reconnection initiated'
    });
  } catch (error) {
    Logger.error('Manual reconnection failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;