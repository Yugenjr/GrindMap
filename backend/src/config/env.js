import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment configuration with validation
 */
const config = {
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || (() => {
    throw new Error('JWT_SECRET environment variable is required');
  })(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/grindmap',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Cache Configuration
  CACHE_PLATFORM_TTL: parseInt(process.env.CACHE_PLATFORM_TTL) || 900, // 15 minutes
  CACHE_USER_TTL: parseInt(process.env.CACHE_USER_TTL) || 300, // 5 minutes
  CACHE_ENABLED: process.env.CACHE_ENABLED !== 'false',
};

// Validate critical environment variables
const validateConfig = () => {
  if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  if (config.NODE_ENV === 'production' && config.JWT_SECRET === 'your-super-secure-jwt-secret-key-here-minimum-32-characters') {
    throw new Error('Default JWT_SECRET cannot be used in production');
  }
};

validateConfig();

export default config;