class BodyValidationMonitor {
  constructor() {
    this.stats = {
      totalRequests: 0,
      rejectedRequests: 0,
      avgBodySize: 0,
      maxBodySize: 0,
      maliciousAttempts: 0,
      parseTimeouts: 0
    };
    
    this.recentRequests = [];
    this.maxHistory = 1000;
  }

  trackRequest(size, rejected = false, malicious = false, parseTime = 0) {
    this.stats.totalRequests++;
    
    if (rejected) {
      this.stats.rejectedRequests++;
    }
    
    if (malicious) {
      this.stats.maliciousAttempts++;
    }
    
    if (parseTime > 1000) {
      this.stats.parseTimeouts++;
    }
    
    this.stats.maxBodySize = Math.max(this.stats.maxBodySize, size);
    this.stats.avgBodySize = (
      (this.stats.avgBodySize * (this.stats.totalRequests - 1) + size) / 
      this.stats.totalRequests
    );
    
    this.recentRequests.push({
      timestamp: Date.now(),
      size,
      rejected,
      malicious,
      parseTime
    });
    
    if (this.recentRequests.length > this.maxHistory) {
      this.recentRequests.shift();
    }
  }

  getStats() {
    const rejectionRate = this.stats.totalRequests > 0 
      ? (this.stats.rejectedRequests / this.stats.totalRequests * 100).toFixed(2)
      : '0.00';
    
    const maliciousRate = this.stats.totalRequests > 0
      ? (this.stats.maliciousAttempts / this.stats.totalRequests * 100).toFixed(2)
      : '0.00';
    
    return {
      ...this.stats,
      rejectionRate: `${rejectionRate}%`,
      maliciousRate: `${maliciousRate}%`,
      avgBodySizeKB: Math.round(this.stats.avgBodySize / 1024),
      maxBodySizeKB: Math.round(this.stats.maxBodySize / 1024),
      recentRequestsCount: this.recentRequests.length
    };
  }

  getRecentActivity(minutes = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.recentRequests.filter(req => req.timestamp > cutoff);
  }

  reset() {
    this.stats = {
      totalRequests: 0,
      rejectedRequests: 0,
      avgBodySize: 0,
      maxBodySize: 0,
      maliciousAttempts: 0,
      parseTimeouts: 0
    };
    this.recentRequests = [];
  }
}

export const bodyValidationMonitor = new BodyValidationMonitor();