import express from 'express';
import { getAuditLogs, getSecurityEvents, getRequestTrace } from '../utils/auditViewer.js';

const router = express.Router();

// Get audit logs with filters
router.get('/logs', (req, res) => {
  try {
    const {
      type,
      startDate,
      endDate,
      requestId,
      ip,
      statusCode,
      limit
    } = req.query;
    
    const logs = getAuditLogs({
      type,
      startDate,
      endDate,
      requestId,
      ip,
      statusCode: statusCode ? parseInt(statusCode) : undefined,
      limit: limit ? parseInt(limit) : 100
    });
    
    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get security events
router.get('/security', (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const events = getSecurityEvents(parseInt(hours));
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get request trace by ID
router.get('/trace/:requestId', (req, res) => {
  try {
    const { requestId } = req.params;
    const trace = getRequestTrace(requestId);
    
    res.json({
      success: true,
      requestId,
      trace
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;