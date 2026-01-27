import os from 'os';
import fs from 'fs';
import { register, collectDefaultMetrics, Gauge, Counter, Histogram } from 'prom-client';

const startTime = Date.now();
let requestCount = 0;
let errorCount = 0;

// Prometheus metrics
collectDefaultMetrics();

// Custom metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const memoryUsage = new Gauge({
  name: 'memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type']
});

const cpuUsage = new Gauge({
  name: 'cpu_usage_percent',
  help: 'CPU usage percentage'
});

export const incrementRequestCount = (method, route, statusCode) => {
  requestCount++;
  httpRequestsTotal.inc({ method, route, status_code: statusCode });
};

export const incrementErrorCount = () => errorCount++;

export const recordRequestDuration = (method, route, duration) => {
  httpRequestDuration.observe({ method, route }, duration / 1000); // Convert to seconds
};

export const updateActiveConnections = (count) => {
  activeConnections.set(count);
};

export const updateMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  memoryUsage.set({ type: 'heap_used' }, memUsage.heapUsed);
  memoryUsage.set({ type: 'heap_total' }, memUsage.heapTotal);
  memoryUsage.set({ type: 'external' }, memUsage.external);
};

export const updateCpuUsage = () => {
  const cpu = process.cpuUsage();
  const total = cpu.user + cpu.system;
  const usage = (total / 1000000) / os.cpus().length; // Rough percentage
  cpuUsage.set(usage);
};

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

export const getPrometheusMetrics = async () => {
  updateMemoryUsage();
  updateCpuUsage();
  return register.metrics();
};