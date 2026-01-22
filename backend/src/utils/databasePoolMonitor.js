import mongoose from 'mongoose';
import Logger from './logger.js';

class DatabasePoolMonitor {
  static getPoolStats() {
    const connection = mongoose.connection;
    
    if (!connection.readyState) {
      return { status: 'disconnected' };
    }
    
    return {
      status: 'connected',
      readyState: connection.readyState,
      host: connection.host,
      port: connection.port,
      database: connection.name,
      // Pool statistics (if available)
      poolSize: connection.db?.serverConfig?.poolSize || 'unknown',
      activeConnections: connection.db?.serverConfig?.connections?.length || 'unknown'
    };
  }
  
  static logPoolStats() {
    const stats = this.getPoolStats();
    Logger.info('Database pool status', stats);
    return stats;
  }
  
  static startMonitoring(interval = 60000) {
    setInterval(() => {
      this.logPoolStats();
    }, interval);
    
    Logger.info('Database pool monitoring started', { interval });
  }
}

export default DatabasePoolMonitor;