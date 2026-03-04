import os from 'os';
import fs from 'fs';

const startTime = Date.now();
let requestCount = 0;
let errorCount = 0;

export const incrementRequestCount = () => requestCount++;
export const incrementErrorCount = () => errorCount++;

export const getSystemHealth = () => {
  const uptime = Date.now() - startTime;
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 1000)}s`,
    memory: {
      used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      loadAvg: os.loadavg()
    },
    requests: {
      total: requestCount,
      errors: errorCount,
      errorRate: requestCount > 0 ? ((errorCount / requestCount) * 100).toFixed(2) + '%' : '0%'
    }
  };
};

export const checkDependencies = async () => {
  const checks = [];
  
  // Check file system
  try {
    await fs.promises.access('./logs', fs.constants.W_OK);
    checks.push({ name: 'filesystem', status: 'healthy' });
  } catch {
    checks.push({ name: 'filesystem', status: 'unhealthy', error: 'Cannot write to logs directory' });
  }
  
  // Check memory usage
  const memUsage = process.memoryUsage();
  const memoryHealthy = memUsage.heapUsed < (memUsage.heapTotal * 0.9);
  checks.push({ 
    name: 'memory', 
    status: memoryHealthy ? 'healthy' : 'warning',
    usage: `${Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)}%`
  });
  
  return checks;
};

export const getDetailedMetrics = () => {
  const health = getSystemHealth();
  return {
    ...health,
    process: {
      pid: process.pid,
      ppid: process.ppid,
      title: process.title,
      argv: process.argv
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT || 5001
    }
  };
};