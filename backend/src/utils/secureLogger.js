import Logger from '../utils/logger.js';

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  /JWT_SECRET/gi,
  /JWT_REFRESH_SECRET/gi,
  /MONGODB_URI/gi,
  /REDIS_URL/gi,
  /password/gi,
  /token/gi,
  /secret/gi,
  /key/gi
];

// Redact sensitive information from logs
const redactSensitiveData = (data) => {
  if (typeof data === 'string') {
    let redacted = data;
    SENSITIVE_PATTERNS.forEach(pattern => {
      redacted = redacted.replace(pattern, '[REDACTED]');
    });
    return redacted;
  }
  
  if (typeof data === 'object' && data !== null) {
    const redacted = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value);
      }
    }
    return redacted;
  }
  
  return data;
};

// Secure logger wrapper
export const secureLog = {
  info: (message, data = {}) => {
    Logger.info(message, redactSensitiveData(data));
  },
  
  warn: (message, data = {}) => {
    Logger.warn(message, redactSensitiveData(data));
  },
  
  error: (message, data = {}) => {
    Logger.error(message, redactSensitiveData(data));
  },
  
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      Logger.debug(message, redactSensitiveData(data));
    }
  }
};

// Override console methods in production
if (process.env.NODE_ENV === 'production') {
  console.log = (...args) => {
    const redacted = args.map(arg => redactSensitiveData(arg));
    Logger.info(redacted.join(' '));
  };

  console.error = (...args) => {
    const redacted = args.map(arg => redactSensitiveData(arg));
    Logger.error(redacted.join(' '));
  };

  console.warn = (...args) => {
    const redacted = args.map(arg => redactSensitiveData(arg));
    Logger.warn(redacted.join(' '));
  };
}
