import { spawn } from 'child_process';

class ProcessLimiter {
  constructor() {
    this.limits = {
      maxMemory: 2 * 1024 * 1024 * 1024, // 2GB
      maxCPUTime: 300, // 5 minutes
      maxFileDescriptors: 1024,
      maxProcesses: 100
    };
    
    this.isActive = false;
  }

  setLimits() {
    try {
      // Set memory limit (if supported)
      if (process.setrlimit) {
        process.setrlimit('rss', this.limits.maxMemory);
        console.log(`📊 Memory limit set: ${this.limits.maxMemory / (1024 * 1024)}MB`);
      }
      
      // Set CPU time limit
      if (process.setrlimit) {
        process.setrlimit('cpu', this.limits.maxCPUTime);
        console.log(`⏱️ CPU time limit set: ${this.limits.maxCPUTime}s`);
      }
      
      // Set file descriptor limit
      if (process.setrlimit) {
        process.setrlimit('nofile', this.limits.maxFileDescriptors);
        console.log(`📁 File descriptor limit set: ${this.limits.maxFileDescriptors}`);
      }
      
      this.isActive = true;
    } catch (error) {
      console.warn('⚠️ Could not set process limits:', error.message);
      
      // Fallback: Use ulimit command (Unix-like systems)
      this.setUlimits();
    }
  }

  setUlimits() {
    try {
      const commands = [
        `ulimit -v ${Math.floor(this.limits.maxMemory / 1024)}`, // Virtual memory in KB
        `ulimit -t ${this.limits.maxCPUTime}`, // CPU time in seconds
        `ulimit -n ${this.limits.maxFileDescriptors}`, // File descriptors
        `ulimit -u ${this.limits.maxProcesses}` // Max processes
      ];
      
      commands.forEach(cmd => {
        spawn('sh', ['-c', cmd], { stdio: 'ignore' });
      });
      
      console.log('📊 Process limits set via ulimit');
      this.isActive = true;
    } catch (error) {
      console.warn('⚠️ Could not set ulimits:', error.message);
    }
  }

  monitorLimits() {
    const usage = process.resourceUsage();
    const memUsage = process.memoryUsage();
    
    const stats = {
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        limit: this.limits.maxMemory,
        percentage: (memUsage.rss / this.limits.maxMemory * 100).toFixed(1)
      },
      cpu: {
        userTime: usage.userCPUTime / 1000, // Convert to ms
        systemTime: usage.systemCPUTime / 1000,
        limit: this.limits.maxCPUTime * 1000
      },
      fileDescriptors: {
        used: usage.fsRead + usage.fsWrite,
        limit: this.limits.maxFileDescriptors
      }
    };
    
    // Check for limit violations
    if (memUsage.rss > this.limits.maxMemory * 0.9) {
      console.warn(`⚠️ Memory usage near limit: ${stats.memory.percentage}%`);
    }
    
    const totalCPUTime = usage.userCPUTime + usage.systemCPUTime;
    if (totalCPUTime > this.limits.maxCPUTime * 1000 * 0.9) {
      console.warn(`⚠️ CPU time near limit: ${(totalCPUTime / 1000).toFixed(1)}s`);
    }
    
    return stats;
  }

  getStats() {
    return {
      limits: this.limits,
      active: this.isActive,
      current: this.isActive ? this.monitorLimits() : null
    };
  }
}

export const processLimiter = new ProcessLimiter();