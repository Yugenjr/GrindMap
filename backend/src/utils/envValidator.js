import Logger from './logger.js';

class EnvValidator {
  static requiredVars = [
    'NODE_ENV',
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  static optionalVars = [
    'REDIS_URL',
    'CORS_ORIGINS'
  ];

  static validate() {
    const missing = [];
    const invalid = [];

    // Check required variables
    for (const varName of this.requiredVars) {
      const value = process.env[varName];
      
      if (!value) {
        missing.push(varName);
        continue;
      }

      // Specific validations
      if (varName === 'PORT' && (isNaN(value) || value < 1 || value > 65535)) {
        invalid.push(`${varName}: must be a valid port number (1-65535)`);
      }
      
      if (varName === 'JWT_SECRET' && value.length < 32) {
        invalid.push(`${varName}: must be at least 32 characters long`);
      }
      
      if (varName === 'MONGODB_URI' && !value.startsWith('mongodb')) {
        invalid.push(`${varName}: must be a valid MongoDB connection string`);
      }
    }

    // Report errors
    if (missing.length > 0) {
      Logger.error('Missing required environment variables', { missing });
      console.error('❌ Missing required environment variables:', missing.join(', '));
      process.exit(1);
    }

    if (invalid.length > 0) {
      Logger.error('Invalid environment variables', { invalid });
      console.error('❌ Invalid environment variables:', invalid.join(', '));
      process.exit(1);
    }

    // Log success
    Logger.info('Environment validation passed', {
      required: this.requiredVars.length,
      optional: this.optionalVars.filter(v => process.env[v]).length
    });
    
    console.log('✅ Environment variables validated');
  }

  static getConfig() {
    return {
      nodeEnv: process.env.NODE_ENV,
      port: parseInt(process.env.PORT),
      mongoUri: process.env.MONGODB_URI,
      jwtSecret: process.env.JWT_SECRET,
      redisUrl: process.env.REDIS_URL || null,
      corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000']
    };
  }
}

export default EnvValidator;