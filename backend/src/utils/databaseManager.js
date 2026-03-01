import mongoose from 'mongoose';
import Logger from '../utils/logger.js';
import CircuitBreaker from '../utils/circuitBreaker.js';

class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
    this.healthCheckInterval = 30000; // 30 seconds
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 30000
    });
    
    this.setupEventHandlers();
    this.startHealthCheck();
  }

  async connect() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grindmap';
    
    const options = {
      // Connection pooling
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      
      // Timeouts
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      
      // Resilience
      retryWrites: true,
      retryReads: true,
      
      // Monitoring
      heartbeatFrequencyMS: 10000
    };

    return this.circuitBreaker.execute(async () => {
      await this.connectWithRetry(mongoUri, options);
    });
  }

  async connectWithRetry(uri, options) {
    while (this.connectionAttempts < this.maxRetries) {
      try {
        this.connectionAttempts++;
        Logger.info('Attempting database connection', { 
          attempt: this.connectionAttempts,
          maxRetries: this.maxRetries 
        });

        await mongoose.connect(uri, options);
        
        this.isConnected = true;
        this.connectionAttempts = 0;
        Logger.info('Database connected successfully', {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          database: mongoose.connection.name
        });
        
        return;
      } catch (error) {
        Logger.error('Database connection failed', {
          attempt: this.connectionAttempts,
          error: error.message,
          willRetry: this.connectionAttempts < this.maxRetries
        });

        if (this.connectionAttempts >= this.maxRetries) {
          throw new Error(`Failed to connect after ${this.maxRetries} attempts: ${error.message}`);
        }

        await this.delay(this.retryDelay * this.connectionAttempts);
      }
    }
  }

  setupEventHandlers() {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      Logger.info('Database connection established');
    });

    mongoose.connection.on('error', (error) => {
      this.isConnected = false;
      if (!error.message.includes('buffermaxentries')) {
        Logger.error('Database connection error', { error: error.message });
      }
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      Logger.warn('Database disconnected');
      this.handleDisconnection();
    });

    mongoose.connection.on('reconnected', () => {
      this.isConnected = true;
      Logger.info('Database reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
  }

  async handleDisconnection() {
    if (!this.isConnected && this.connectionAttempts === 0) {
      Logger.info('Attempting to reconnect to database');
      this.connectionAttempts = 0;
      
      try {
        await this.connect();
      } catch (error) {
        Logger.error('Auto-reconnection failed', { error: error.message });
      }
    }
  }

  startHealthCheck() {
    setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        Logger.error('Health check failed', { error: error.message });
      }
    }, this.healthCheckInterval);
  }

  async healthCheck() {
    if (!this.isConnected) {
      return { status: 'disconnected' };
    }

    try {
      await this.circuitBreaker.execute(async () => {
        await mongoose.connection.db.admin().ping();
      });

      const stats = {
        status: 'healthy',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        database: mongoose.connection.name,
        circuitBreakerState: this.circuitBreaker.getState()
      };

      // Only log if status changed or on errors
      if (this.lastHealthStatus !== 'healthy') {
        Logger.info('Database health restored', { status: 'healthy' });
      }
      this.lastHealthStatus = 'healthy';
      
      return stats;
    } catch (error) {
      if (this.lastHealthStatus !== 'unhealthy') {
        Logger.warn('Database health check failed', { error: error.message });
      }
      this.lastHealthStatus = 'unhealthy';
      
      return { status: 'unhealthy', error: error.message };
    }
  }

  async executeOperation(operation, context = '') {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    return this.circuitBreaker.execute(async () => {
      try {
        return await operation();
      } catch (error) {
        Logger.error('Database operation failed', {
          context,
          error: error.message
        });
        throw error;
      }
    });
  }

  async gracefulShutdown(signal) {
    Logger.info(`${signal} received, closing database connection`);
    
    try {
      await mongoose.connection.close();
      Logger.info('Database connection closed');
      process.exit(0);
    } catch (error) {
      Logger.error('Error during database shutdown', { error: error.message });
      process.exit(1);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getConnectionStats() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      connectionAttempts: this.connectionAttempts,
      circuitBreaker: this.circuitBreaker.getState(),
      poolSize: mongoose.connection?.db?.serverConfig?.poolSize || 0
    };
  }
}

// Singleton instance
const dbManager = new DatabaseManager();

export default dbManager;