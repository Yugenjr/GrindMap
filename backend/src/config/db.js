import mongoose from 'mongoose';
import Logger from '../utils/logger.js';

const connectDB = async () => {
  try {
    const options = {
      // Connection pooling settings
      maxPoolSize: 10, // Maximum connections in pool
      minPoolSize: 2,  // Minimum connections in pool
      maxIdleTimeMS: 30000, // Close connections after 30s idle
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      
      // Connection management
      connectTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      
      // Performance optimizations
      readPreference: 'primary',
      writeConcern: { w: 'majority', j: true }
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      Logger.info('Database connected with pooling', {
        host: mongoose.connection.host,
        poolSize: options.maxPoolSize
      });
    });
    
    mongoose.connection.on('error', (err) => {
      Logger.error('Database connection error', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      Logger.warn('Database disconnected');
    });
    
    console.log('✅ MongoDB Connected:', mongoose.connection.host);
  } catch (error) {
    console.error('Database connection failed FATAL:', error);
    process.exit(1);
  }
};

export default connectDB;
