class BandwidthMonitor {
  constructor() {
    this.usage = new Map(); // IP -> usage data
    this.limits = {
      perIP: 100 * 1024 * 1024,    // 100MB per IP per hour
      perMinute: 10 * 1024 * 1024,  // 10MB per IP per minute
      global: 1024 * 1024 * 1024    // 1GB global per hour
    };
    this.globalUsage = 0;
    this.resetInterval = null;
    this.startTime = Date.now();
  }

  start() {
    // Reset counters every hour
    this.resetInterval = setInterval(() => {
      this.reset();
    }, 60 * 60 * 1000);
    
    console.log('📊 Bandwidth monitoring started');
  }

  stop() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
      this.resetInterval = null;
    }
    console.log('📊 Bandwidth monitoring stopped');
  }

  trackUsage(ip, bytes) {
    const now = Date.now();
    
    if (!this.usage.has(ip)) {
      this.usage.set(ip, {
        hourly: 0,
        minute: 0,
        lastMinute: now
      });
    }
    
    const ipUsage = this.usage.get(ip);
    
    // Reset minute counter if needed
    if (now - ipUsage.lastMinute > 60000) {
      ipUsage.minute = 0;
      ipUsage.lastMinute = now;
    }
    
    ipUsage.hourly += bytes;
    ipUsage.minute += bytes;
    this.globalUsage += bytes;
  }

  checkLimits(ip, bytes) {
    const ipUsage = this.usage.get(ip);
    
    if (!ipUsage) return { allowed: true };
    
    // Check minute limit
    if (ipUsage.minute + bytes > this.limits.perMinute) {
      return {
        allowed: false,
        reason: 'Per-minute bandwidth limit exceeded',
        limit: this.formatBytes(this.limits.perMinute),
        usage: this.formatBytes(ipUsage.minute)
      };
    }
    
    // Check hourly limit
    if (ipUsage.hourly + bytes > this.limits.perIP) {
      return {
        allowed: false,
        reason: 'Hourly bandwidth limit exceeded',
        limit: this.formatBytes(this.limits.perIP),
        usage: this.formatBytes(ipUsage.hourly)
      };
    }
    
    // Check global limit
    if (this.globalUsage + bytes > this.limits.global) {
      return {
        allowed: false,
        reason: 'Global bandwidth limit exceeded',
        limit: this.formatBytes(this.limits.global),
        usage: this.formatBytes(this.globalUsage)
      };
    }
    
    return { allowed: true };
  }

  formatBytes(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  reset() {
    this.usage.clear();
    this.globalUsage = 0;
    this.startTime = Date.now();
    console.log('📊 Bandwidth counters reset');
  }

  getStats() {
    const topUsers = Array.from(this.usage.entries())
      .sort(([,a], [,b]) => b.hourly - a.hourly)
      .slice(0, 10)
      .map(([ip, usage]) => ({
        ip,
        hourly: this.formatBytes(usage.hourly),
        minute: this.formatBytes(usage.minute)
      }));

    return {
      global: {
        usage: this.formatBytes(this.globalUsage),
        limit: this.formatBytes(this.limits.global),
        percentage: ((this.globalUsage / this.limits.global) * 100).toFixed(1)
      },
      limits: {
        perIP: this.formatBytes(this.limits.perIP),
        perMinute: this.formatBytes(this.limits.perMinute),
        global: this.formatBytes(this.limits.global)
      },
      topUsers,
      activeIPs: this.usage.size,
      uptime: Date.now() - this.startTime
    };
  }
}

export const bandwidthMonitor = new BandwidthMonitor();