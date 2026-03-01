import express from 'express';
import MetricsCollector from '../utils/metricsCollector.js';
import HealthMonitor from '../utils/healthMonitor.js';
import AlertManager from '../utils/alertManager.js';
import { verifyJWT } from '../middlewares/jwtManager.middleware.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// Get system metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = MetricsCollector.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Get metrics failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

// Prometheus-style metrics endpoint
router.get('/metrics/prometheus', (req, res) => {
  try {
    const metrics = MetricsCollector.getMetrics();
    let output = '';
    
    // Convert counters
    for (const [name, value] of Object.entries(metrics.counters)) {
      output += `# TYPE ${name.replace(/[{}]/g, '_')} counter\n`;
      output += `${name.replace(/[{}]/g, '_')} ${value}\n`;
    }
    
    // Convert gauges
    for (const [name, value] of Object.entries(metrics.gauges)) {
      output += `# TYPE ${name.replace(/[{}]/g, '_')} gauge\n`;
      output += `${name.replace(/[{}]/g, '_')} ${value}\n`;
    }
    
    // Convert histograms
    for (const [name, hist] of Object.entries(metrics.histograms)) {
      const baseName = name.replace(/[{}]/g, '_');
      output += `# TYPE ${baseName} histogram\n`;
      output += `${baseName}_count ${hist.count}\n`;
      output += `${baseName}_sum ${hist.sum}\n`;
      output += `${baseName}_bucket{le="0.5"} ${hist.p50}\n`;
      output += `${baseName}_bucket{le="0.95"} ${hist.p95}\n`;
      output += `${baseName}_bucket{le="0.99"} ${hist.p99}\n`;
    }
    
    res.set('Content-Type', 'text/plain');
    res.send(output);
  } catch (error) {
    res.status(500).send('# Error generating metrics');
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await HealthMonitor.runHealthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'warning' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status !== 'critical',
      data: health
    });
  } catch (error) {
    Logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      success: false,
      error: 'Health check failed',
      status: 'unhealthy'
    });
  }
});

// Quick health check (lightweight)
router.get('/health/quick', async (req, res) => {
  try {
    const health = await HealthMonitor.quickHealthCheck();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Get alerts
router.get('/alerts', verifyJWT, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { active = true } = req.query;
    
    const alerts = active ? AlertManager.getActiveAlerts() : 
                   Array.from(AlertManager.alerts.values());
    
    res.json({
      success: true,
      data: {
        alerts,
        stats: AlertManager.getAlertStats()
      }
    });
  } catch (error) {
    Logger.error('Get alerts failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts'
    });
  }
});

// Get alert rules
router.get('/alerts/rules', verifyJWT, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const rules = AlertManager.getRules();
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    Logger.error('Get alert rules failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get alert rules'
    });
  }
});

// Resolve alert
router.post('/alerts/:alertId/resolve', verifyJWT, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { alertId } = req.params;
    AlertManager.resolveAlert(alertId);
    
    res.json({
      success: true,
      message: 'Alert resolved'
    });
  } catch (error) {
    Logger.error('Resolve alert failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert'
    });
  }
});

// Dashboard data endpoint
router.get('/dashboard', verifyJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const metrics = MetricsCollector.getMetrics();
    const health = HealthMonitor.getDetailedHealth();
    const alerts = AlertManager.getActiveAlerts();
    
    // Calculate key performance indicators
    const kpis = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeAlerts: alerts.length,
      healthScore: HealthMonitor.getStatusScore(health.status),
      requestRate: metrics.counters['http.requests.total'] || 0,
      errorRate: metrics.counters['http.requests.errors'] || 0,
      avgResponseTime: metrics.histograms['http.request.duration']?.avg || 0
    };
    
    res.json({
      success: true,
      data: {
        kpis,
        health: health.summary,
        alerts: alerts.slice(0, 10), // Latest 10 alerts
        metrics: {
          requests: metrics.counters,
          performance: metrics.histograms,
          system: metrics.gauges
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Dashboard data failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data'
    });
  }
});

// System status endpoint (public)
router.get('/status', async (req, res) => {
  try {
    const health = HealthMonitor.getHealthStatus();
    const uptime = process.uptime();
    
    res.json({
      success: true,
      data: {
        status: health.status,
        uptime: {
          seconds: uptime,
          human: formatUptime(uptime)
        },
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        lastHealthCheck: health.lastCheck
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get system status'
    });
  }
});

// Performance report
router.get('/performance', verifyJWT, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const metrics = MetricsCollector.getMetrics();
    
    const report = {
      responseTime: {
        avg: metrics.histograms['http.request.duration']?.avg || 0,
        p50: metrics.histograms['http.request.duration']?.p50 || 0,
        p95: metrics.histograms['http.request.duration']?.p95 || 0,
        p99: metrics.histograms['http.request.duration']?.p99 || 0
      },
      throughput: {
        total: metrics.counters['http.requests.total'] || 0,
        errors: metrics.counters['http.requests.errors'] || 0,
        errorRate: ((metrics.counters['http.requests.errors'] || 0) / 
                   Math.max(metrics.counters['http.requests.total'] || 1, 1)) * 100
      },
      resources: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        eventLoopLag: metrics.gauges['system.event_loop.lag'] || 0
      }
    };
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    Logger.error('Performance report failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to generate performance report'
    });
  }
});

// Helper function
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${days}d ${hours}h ${minutes}m`;
}

export default router;