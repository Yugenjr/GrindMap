import { createClient } from 'redis';
import Logger from './logger.js';

class MetricsCollector {
  constructor() {
    this.redis = null;
    this.redisConnected = false;
    this.metrics = new Map();
    this.counters = new Map();
    this.histograms = new Map();
    this.gauges = new Map();
    
    this.init();
    this.startCollection();
  }

  async init() {
    try {
      this.redis = createClient({ 
        url: process.env.REDIS_URL,
        socket: { reconnectStrategy: false }
      });
      
      this.redis.on('connect', () => {
        this.redisConnected = true;
        Logger.info('Metrics collector connected to Redis');
      });
      
      this.redis.on('error', () => {
        this.redisConnected = false;
      });
      
      await this.redis.connect();
    } catch (error) {
      Logger.warn('Metrics collector using memory-only mode');
      this.redisConnected = false;
    }
  }

  // Increment counter metric
  increment(name, value = 1, tags = {}) {
    const key = this.buildKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
    
    this.persistMetric('counter', name, current + value, tags);
  }

  // Set gauge metric
  gauge(name, value, tags = {}) {
    const key = this.buildKey(name, tags);
    this.gauges.set(key, {
      value,
      timestamp: Date.now()
    });
    
    this.persistMetric('gauge', name, value, tags);
  }

  // Record histogram metric (for response times, etc.)
  histogram(name, value, tags = {}) {
    const key = this.buildKey(name, tags);
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, {
        values: [],
        count: 0,
        sum: 0,
        min: Infinity,
        max: -Infinity
      });
    }
    
    const hist = this.histograms.get(key);
    hist.values.push(value);
    hist.count++;
    hist.sum += value;
    hist.min = Math.min(hist.min, value);
    hist.max = Math.max(hist.max, value);
    
    // Keep only last 1000 values
    if (hist.values.length > 1000) {
      hist.values = hist.values.slice(-1000);
    }
    
    this.persistMetric('histogram', name, value, tags);
  }

  // Record timing metric
  timing(name, duration, tags = {}) {
    this.histogram(`${name}.duration`, duration, tags);
    this.increment(`${name}.count`, 1, tags);
  }

  // Start system metrics collection
  startCollection() {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect process metrics every 10 seconds
    setInterval(() => {
      this.collectProcessMetrics();
    }, 10000);
  }

  collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      
      // Memory metrics
      this.gauge('system.memory.rss', memUsage.rss);
      this.gauge('system.memory.heap_used', memUsage.heapUsed);
      this.gauge('system.memory.heap_total', memUsage.heapTotal);
      this.gauge('system.memory.external', memUsage.external);
      
      // CPU metrics
      const cpuUsage = process.cpuUsage();
      this.gauge('system.cpu.user', cpuUsage.user);
      this.gauge('system.cpu.system', cpuUsage.system);
      
      // Event loop lag
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
        this.gauge('system.event_loop.lag', lag);
      });
      
    } catch (error) {
      Logger.error('System metrics collection failed', { error: error.message });
    }
  }

  collectProcessMetrics() {
    try {
      // Uptime
      this.gauge('system.uptime', process.uptime());
      
      // Active handles and requests
      this.gauge('system.handles', process._getActiveHandles().length);
      this.gauge('system.requests', process._getActiveRequests().length);
      
    } catch (error) {
      Logger.error('Process metrics collection failed', { error: error.message });
    }
  }

  // HTTP request metrics
  recordHttpRequest(method, path, statusCode, duration, size = 0) {
    const tags = { method, path: this.normalizePath(path), status: statusCode };

    this.increment('http.requests.total', 1, tags);
    this.histogram('http.request.duration', duration, tags);
    this.histogram('http.response.size', size, tags);

    // Error rate tracking
    if (statusCode >= 400) {
      this.increment('http.requests.errors', 1, tags);

      // Track specific error types
      if (statusCode >= 500) {
        this.increment('http.requests.errors.server', 1, tags);
      } else if (statusCode === 429) {
        this.increment('http.requests.errors.rate_limit', 1, tags);
      } else if (statusCode === 404) {
        this.increment('http.requests.errors.not_found', 1, tags);
      } else if (statusCode >= 400 && statusCode < 500) {
        this.increment('http.requests.errors.client', 1, tags);
      }
    }
  }

  // Database metrics
  recordDbOperation(operation, duration, success = true) {
    const tags = { operation, status: success ? 'success' : 'error' };
    
    this.increment('db.operations.total', 1, tags);
    this.histogram('db.operation.duration', duration, tags);
    
    if (!success) {
      this.increment('db.operations.errors', 1, tags);
    }
  }

  // Cache metrics
  recordCacheOperation(operation, hit = false) {
    const tags = { operation };
    
    this.increment('cache.operations.total', 1, tags);
    
    if (operation === 'get') {
      this.increment(hit ? 'cache.hits' : 'cache.misses', 1);
    }
  }

  // Job queue metrics
  recordJobMetrics(type, status, duration = null) {
    const tags = { type, status };
    
    this.increment('jobs.total', 1, tags);
    
    if (duration !== null) {
      this.histogram('jobs.duration', duration, tags);
    }
    
    if (status === 'failed') {
      this.increment('jobs.failures', 1, { type });
    }
  }

  // Get metrics summary
  getMetrics() {
    const summary = {
      counters: Object.fromEntries(this.counters),
      gauges: {},
      histograms: {}
    };
    
    // Process gauges
    for (const [key, data] of this.gauges) {
      summary.gauges[key] = data.value;
    }
    
    // Process histograms
    for (const [key, hist] of this.histograms) {
      if (hist.count > 0) {
        const sorted = [...hist.values].sort((a, b) => a - b);
        summary.histograms[key] = {
          count: hist.count,
          sum: hist.sum,
          avg: hist.sum / hist.count,
          min: hist.min,
          max: hist.max,
          p50: this.percentile(sorted, 0.5),
          p95: this.percentile(sorted, 0.95),
          p99: this.percentile(sorted, 0.99)
        };
      }
    }
    
    return summary;
  }

  // Helper methods
  buildKey(name, tags) {
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    
    return tagStr ? `${name}{${tagStr}}` : name;
  }

  normalizePath(path) {
    // Replace IDs and dynamic segments with placeholders
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9]{24}/g, '/:id') // MongoDB ObjectIds
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid'); // UUIDs
  }

  percentile(sortedArray, p) {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil(sortedArray.length * p) - 1;
    return sortedArray[Math.max(0, index)];
  }

  async persistMetric(type, name, value, tags) {
    if (!this.redisConnected) return;
    
    try {
      const timestamp = Date.now();
      const key = `metrics:${type}:${name}`;
      
      await this.redis.zadd(key, timestamp, JSON.stringify({
        value,
        tags,
        timestamp
      }));
      
      // Keep only last hour of data
      const oneHourAgo = timestamp - 3600000;
      await this.redis.zremrangebyscore(key, 0, oneHourAgo);
      
    } catch (error) {
      Logger.warn('Metric persistence failed', { error: error.message });
    }
  }

  // Scraper metrics
  recordScraperMetrics(platform, username, success, duration, errorType = null, fromCache = false, fromFallback = false) {
    const tags = { platform: platform.toLowerCase() };

    // Increment total scraper requests
    this.increment('scraper.requests.total', 1, tags);

    // Track success/failure
    if (success) {
      this.increment('scraper.requests.success', 1, tags);
    } else {
      this.increment('scraper.requests.errors', 1, tags);

      // Track error types
      if (errorType) {
        this.increment(`scraper.requests.errors.${errorType}`, 1, tags);
      }
    }

    // Track cache usage
    if (fromCache) {
      this.increment('scraper.requests.from_cache', 1, tags);
    }

    if (fromFallback) {
      this.increment('scraper.requests.from_fallback', 1, tags);
    }

    // Track response times
    this.histogram('scraper.request.duration', duration, tags);
  }

  // Reset metrics (for testing)
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

export default new MetricsCollector();