import { sanitizeEnvVars } from '../utils/sanitizer.js';

export const validateEnvironment = () => {
  const requiredVars = ['NODE_ENV'];
  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    process.exit(1);
  }
  
  // Check for exposed secrets in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Environment variables (sanitized):');
    sanitizeEnvVars();
  }
  
  // Validate sensitive vars are not empty in production
  if (process.env.NODE_ENV === 'production') {
    const sensitiveVars = ['JWT_SECRET', 'DB_PASSWORD'];
    const emptySensitive = sensitiveVars.filter(key => 
      process.env[key] && (process.env[key] === 'your_secret_here' || process.env[key].length < 8)
    );
    
    if (emptySensitive.length > 0) {
      console.error('Weak or default sensitive environment variables detected:', emptySensitive);
      process.exit(1);
    }
  }
};