const SENSITIVE_PATTERNS = [
  // API Keys and Tokens
  /api[_-]?key[s]?[\s]*[:=][\s]*['"]*([a-zA-Z0-9_-]{20,})['"]*\s*/gi,
  /token[s]?[\s]*[:=][\s]*['"]*([a-zA-Z0-9_.-]{20,})['"]*\s*/gi,
  /secret[s]?[\s]*[:=][\s]*['"]*([a-zA-Z0-9_.-]{20,})['"]*\s*/gi,
  
  // Database URLs and Passwords
  /mongodb:\/\/[^:]+:([^@]+)@/gi,
  /mysql:\/\/[^:]+:([^@]+)@/gi,
  /postgres:\/\/[^:]+:([^@]+)@/gi,
  /password[\s]*[:=][\s]*['"]*([^'"\\s]+)['"]*\s*/gi,
  /pwd[\s]*[:=][\s]*['"]*([^'"\\s]+)['"]*\s*/gi,
  
  // JWT Tokens
  /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
  
  // Credit Card Numbers
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  
  // Email addresses in sensitive contexts
  /email[\s]*[:=][\s]*['"]*([^'"\\s@]+@[^'"\\s]+)['"]*\s*/gi,
  
  // Authorization headers
  /authorization[\s]*:[\s]*['"]*([^'"\\s]+)['"]*\s*/gi,
  /bearer[\s]+([a-zA-Z0-9_.-]{20,})/gi
];

export const sanitizeSensitiveData = (data) => {
  if (!data) return data;
  
  let sanitized = typeof data === 'string' ? data : JSON.stringify(data);
  
  SENSITIVE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, (match, sensitive) => {
      if (sensitive && sensitive.length > 4) {
        const masked = '*'.repeat(sensitive.length - 4) + sensitive.slice(-4);
        return match.replace(sensitive, masked);
      }
      return match.replace(sensitive || '', '***REDACTED***');
    });
  });
  
  return typeof data === 'string' ? sanitized : JSON.parse(sanitized);
};

export const sanitizeError = (error) => {
  if (!error) return error;
  
  const sanitizedError = {
    ...error,
    message: sanitizeSensitiveData(error.message),
    stack: sanitizeSensitiveData(error.stack)
  };
  
  return sanitizedError;
};

export const sanitizeEnvVars = () => {
  const sensitiveKeys = [
    'API_KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'PWD', 'PRIVATE_KEY',
    'DB_PASSWORD', 'MONGODB_URI', 'DATABASE_URL', 'JWT_SECRET'
  ];
  
  Object.keys(process.env).forEach(key => {
    if (sensitiveKeys.some(sensitive => key.toUpperCase().includes(sensitive))) {
      const original = process.env[key];
      if (original && original.length > 4) {
        console.log(`${key}: ${'*'.repeat(original.length - 4)}${original.slice(-4)}`);
      } else {
        console.log(`${key}: ***REDACTED***`);
      }
    }
  });
};