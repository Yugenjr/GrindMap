import { EventEmitter } from 'events';
import os from 'os';

class CPUMonitor extends EventEmitter {
  constructor() {
    super();
    this.thresholds = {
      warning: 70,    // 70% CPU usage
      critical: 85,   // 85% CPU usage
      emergency: 95   // 95% CPU usage
    };
    
    this.isMonitoring = false;
    this.interval = null;
    this.cpuHistory = [];
    this.maxHistorySize = 60; // 5 minutes at 5s intervals
    this.lastCpuUsage = process.cpuUsage();
    this.lastCheck = Date.now();
  }

  start(intervalMs = 5000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🖥️ CPU monitoring started');
    
    this.interval = setInterval(() => {
      this.checkCPU();
    }, intervalMs);
    
    // Initial check
    this.checkCPU();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isMonitoring = false;
    console.log('🖥️ CPU monitoring stopped');
  }

  checkCPU() {
    const now = Date.now();
    const currentUsage = process.cpuUsage();
    const timeDiff = now - this.lastCheck;
    
    // Calculate CPU percentage
    const userDiff = currentUsage.user - this.lastCpuUsage.user;
    const systemDiff = currentUsage.system - this.lastCpuUsage.system;
    const totalDiff = userDiff + systemDiff;
    
    // Convert to percentage (cpuUsage is in microseconds)
    const cpuPercent = (totalDiff / (timeDiff * 1000)) * 100;
    
    // Get system load average
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    const loadPercent = (loadAvg[0] / cpuCount) * 100;
    
    // Use the higher of process CPU or system load
    const effectiveCPU = Math.max(cpuPercent, loadPercent);
    
    // Store in history
    this.cpuHistory.push({
      timestamp: now,
      cpuPercent: effectiveCPU,
      loadAvg: loadAvg[0],
      userTime: currentUsage.user,
      systemTime: currentUsage.system
    });
    
    // Trim history
    if (this.cpuHistory.length > this.maxHistorySize) {
      this.cpuHistory.shift();
    }
    
    // Check thresholds
    if (effectiveCPU >= this.thresholds.emergency) {
      this.handleEmergency(effectiveCPU);
    } else if (effectiveCPU >= this.thresholds.critical) {
      this.handleCritical(effectiveCPU);
    } else if (effectiveCPU >= this.thresholds.warning) {
      this.handleWarning(effectiveCPU);
    }
    
    // Update for next check
    this.lastCpuUsage = currentUsage;
    this.lastCheck = now;
  }

  handleWarning(cpuPercent) {
    console.warn(`⚠️ CPU warning: ${cpuPercent.toFixed(1)}% usage`);
    this.emit('warning', { cpuPercent });
  }

  handleCritical(cpuPercent) {
    console.error(`🚨 CPU critical: ${cpuPercent.toFixed(1)}% usage`);
    this.emit('critical', { cpuPercent });
  }

  handleEmergency(cpuPercent) {
    console.error(`💥 CPU emergency: ${cpuPercent.toFixed(1)}% usage`);
    this.emit('emergency', { cpuPercent });
  }

  getCurrentCPU() {
    if (this.cpuHistory.length === 0) return 0;
    return this.cpuHistory[this.cpuHistory.length - 1].cpuPercent;
  }

  getAverageCPU(minutes = 5) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentHistory = this.cpuHistory.filter(entry => entry.timestamp > cutoff);
    
    if (recentHistory.length === 0) return 0;
    
    const sum = recentHistory.reduce((acc, entry) => acc + entry.cpuPercent, 0);
    return sum / recentHistory.length;
  }

  getStats() {
    const current = this.getCurrentCPU();
    const avg5min = this.getAverageCPU(5);
    const loadAvg = os.loadavg();
    
    return {
      current: {
        cpuPercent: current.toFixed(1),
        loadAvg: loadAvg.map(load => load.toFixed(2)),
        cpuCount: os.cpus().length
      },
      averages: {
        last5min: avg5min.toFixed(1),
        last1min: this.getAverageCPU(1).toFixed(1)
      },
      thresholds: this.thresholds,
      monitoring: this.isMonitoring,
      historySize: this.cpuHistory.length
    };
  }
}

export const cpuMonitor = new CPUMonitor();