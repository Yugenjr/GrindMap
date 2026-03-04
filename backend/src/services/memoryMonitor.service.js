import { EventEmitter } from 'events';

class MemoryMonitor extends EventEmitter {
  constructor() {
    super();
    this.thresholds = {
      warning: 0.8,    // 80% of heap limit
      critical: 0.9,   // 90% of heap limit
      emergency: 0.95  // 95% of heap limit
    };
    
    this.isMonitoring = false;
    this.interval = null;
    this.lastGC = Date.now();
    this.memoryHistory = [];
    this.maxHistorySize = 60; // Keep 60 readings (5 minutes at 5s intervals)
  }

  start(intervalMs = 5000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🧠 Memory monitoring started');
    
    this.interval = setInterval(() => {
      this.checkMemory();
    }, intervalMs);
    
    // Initial check
    this.checkMemory();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isMonitoring = false;
    console.log('🧠 Memory monitoring stopped');
  }

  checkMemory() {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const heapUsageRatio = usage.heapUsed / usage.heapTotal;
    
    // Store in history
    this.memoryHistory.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss
    });
    
    // Trim history
    if (this.memoryHistory.length > this.maxHistorySize) {
      this.memoryHistory.shift();
    }
    
    // Check thresholds
    if (heapUsageRatio >= this.thresholds.emergency) {
      this.handleEmergency(usage, heapUsageRatio);
    } else if (heapUsageRatio >= this.thresholds.critical) {
      this.handleCritical(usage, heapUsageRatio);
    } else if (heapUsageRatio >= this.thresholds.warning) {
      this.handleWarning(usage, heapUsageRatio);
    }
    
    // Detect memory leaks
    this.detectLeaks();
  }

  handleWarning(usage, ratio) {
    console.warn(`⚠️ Memory warning: ${Math.round(ratio * 100)}% heap usage`);
    this.emit('warning', { usage, ratio });
  }

  handleCritical(usage, ratio) {
    console.error(`🚨 Memory critical: ${Math.round(ratio * 100)}% heap usage`);
    this.emit('critical', { usage, ratio });
    
    // Force garbage collection if available
    this.forceGC();
  }

  handleEmergency(usage, ratio) {
    console.error(`💥 Memory emergency: ${Math.round(ratio * 100)}% heap usage`);
    this.emit('emergency', { usage, ratio });
    
    // Aggressive cleanup
    this.emergencyCleanup();
  }

  forceGC() {
    if (global.gc) {
      const before = process.memoryUsage().heapUsed;
      global.gc();
      const after = process.memoryUsage().heapUsed;
      const freed = Math.round((before - after) / 1024 / 1024);
      
      console.log(`🗑️ Garbage collection freed ${freed}MB`);
      this.lastGC = Date.now();
      
      return freed;
    } else {
      console.warn('⚠️ Garbage collection not available (run with --expose-gc)');
      return 0;
    }
  }

  emergencyCleanup() {
    console.log('🚨 Emergency cleanup initiated');
    
    // Force GC multiple times
    let totalFreed = 0;
    for (let i = 0; i < 3; i++) {
      totalFreed += this.forceGC();
    }
    
    // Clear caches and temporary data
    this.clearCaches();
    
    console.log(`🧹 Emergency cleanup completed, freed ${totalFreed}MB`);
  }

  clearCaches() {
    // Clear require cache for non-core modules (be careful!)
    const cacheKeys = Object.keys(require.cache);
    let cleared = 0;
    
    cacheKeys.forEach(key => {
      if (key.includes('node_modules') && !key.includes('express')) {
        delete require.cache[key];
        cleared++;
      }
    });
    
    console.log(`🗑️ Cleared ${cleared} cached modules`);
  }

  detectLeaks() {
    if (this.memoryHistory.length < 10) return;
    
    // Check for consistent memory growth
    const recent = this.memoryHistory.slice(-10);
    const growth = recent.map((entry, i) => {
      if (i === 0) return 0;
      return entry.heapUsed - recent[i - 1].heapUsed;
    });
    
    const avgGrowth = growth.reduce((sum, g) => sum + g, 0) / growth.length;
    const growthMB = Math.round(avgGrowth / 1024 / 1024);
    
    if (avgGrowth > 5 * 1024 * 1024) { // 5MB average growth
      console.warn(`🔍 Potential memory leak detected: ${growthMB}MB/check average growth`);
      this.emit('leak-detected', { avgGrowth: growthMB });
    }
  }

  getStats() {
    const usage = process.memoryUsage();
    const heapUsageRatio = usage.heapUsed / usage.heapTotal;
    
    return {
      current: {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
        external: Math.round(usage.external / 1024 / 1024),
        rss: Math.round(usage.rss / 1024 / 1024),
        heapUsagePercent: Math.round(heapUsageRatio * 100)
      },
      thresholds: {
        warning: Math.round(this.thresholds.warning * 100),
        critical: Math.round(this.thresholds.critical * 100),
        emergency: Math.round(this.thresholds.emergency * 100)
      },
      monitoring: this.isMonitoring,
      lastGC: new Date(this.lastGC).toISOString(),
      historySize: this.memoryHistory.length
    };
  }
}

export const memoryMonitor = new MemoryMonitor();