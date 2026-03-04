import dotenv from 'dotenv';
import { ENVIRONMENTS } from '../constants/app.constants.js';

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 */
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGODB_URI',
];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }
};

/**
 * Secure environment configuration
 */
export const config = {
  // Server configuration
  port: parseInt(process.env.PORT) || 8080,
  nodeEnv: process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT,
  
  // Database configuration
  mongoUri: process.env.MONGODB_URI,
  
  // Security configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Rate limiting
  redisUrl: process.env.REDIS_URL,
  
  // CORS origins
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  
  // Security settings
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  lockoutTime: parseInt(process.env.LOCKOUT_TIME) || 15 * 60 * 1000, // 15 minutes
  
  // API configuration
  apiVersion: process.env.API_VERSION || 'v1',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Feature flags
  enableRegistration: process.env.ENABLE_REGISTRATION !== 'false',
  enableEmailVerification: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  
  // External services
  emailService: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};\n\n// Validate environment on startup\nif (config.nodeEnv === ENVIRONMENTS.PRODUCTION) {\n  validateEnvironment();\n}\n\nexport default config;