# Security Implementation Quick Reference

## 🚀 Quick Start Guide

This guide provides essential information to quickly understand and use the security features.

---

## 📦 Files Created

| File | Purpose |
|------|---------|
| `src/config/security.config.js` | Security configuration and constants |
| `src/utils/security.util.js` | Core security utility functions |
| `src/middlewares/security.middleware.js` | Enhanced security middleware |
| `src/middlewares/auth.middleware.js` | Enhanced authentication |
| `src/middlewares/rateLimiter.middleware.js` | Advanced rate limiting |
| `src/middlewares/validation.middleware.js` | Enhanced input validation |
| `src/__tests__/security.test.js` | Security test suite |
| `SECURITY.md` | Comprehensive security documentation |
| `SECURITY_CHECKLIST.md` | Implementation checklist |

---

## 🛡️ Security Features at a Glance

### ✅ Input Protection
- SQL Injection prevention
- NoSQL Injection prevention
- XSS (Cross-Site Scripting) prevention
- Command Injection prevention
- Path Traversal prevention
- Automatic input sanitization

### ✅ Authentication
- JWT with algorithm whitelisting
- Token format validation
- Brute force protection (5 attempts, 15min block)
- Password strength requirements
- Secure password hashing (bcrypt, 12 rounds)

### ✅ Rate Limiting
- **General API**: 100 req/15min
- **Auth**: 5 req/15min
- **Scraping**: 10 req/min
- **Password Reset**: 3 req/hour
- **Registration**: 5 reg/hour

### ✅ Security Headers
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (production)
- And more...

---

## 📝 Common Usage Patterns

### 1. Protect a Route

```javascript
import { protect } from './middlewares/auth.middleware.js';

app.get('/api/protected', protect, controller);
```

### 2. Add Rate Limiting

```javascript
import { authLimiter } from './middlewares/rateLimiter.middleware.js';

app.post('/api/auth/login', authLimiter, loginController);
```

### 3. Validate Input

```javascript
import { validateRegistration } from './middlewares/validation.middleware.js';

app.post('/api/auth/register', validateRegistration, registerController);
```

### 4. Check Input Security

```javascript
import { checkInputSecurity } from './utils/security.util.js';

const result = checkInputSecurity(userInput, req);
if (!result.safe) {
  throw new AppError('Suspicious input detected', 400);
}
```

### 5. Sanitize Data

```javascript
import { sanitizeString, sanitizeObject } from './utils/security.util.js';

const cleanString = sanitizeString(userInput);
const cleanObj = sanitizeObject(reqBody);
```

### 6. Validate Password

```javascript
import { validatePasswordStrength } from './utils/security.util.js';

const result = validatePasswordStrength(password);
if (!result.valid) {
  return res.status(400).json({ errors: result.errors });
}
```

---

## 🔧 Essential Configuration

### Environment Variables

```env
# Required
JWT_SECRET=your-secret-min-32-characters-long
ALLOWED_ORIGINS=https://yourdomain.com

# Recommended
NODE_ENV=production
BCRYPT_ROUNDS=12
```

### Apply Global Security

```javascript
// In your main server file
import { applySecurity } from './middlewares/security.middleware.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';

app.use(applySecurity);      // All security middlewares
app.use(generalLimiter);     // Rate limiting
```

---

## 🎯 Route Protection Patterns

### Public Route (No Auth)
```javascript
app.get('/api/public', controller);
```

### Protected Route (Auth Required)
```javascript
app.get('/api/profile', protect, getProfile);
```

### Admin Only Route
```javascript
app.get('/api/admin', protect, requireRole('admin'), adminController);
```

### Resource Ownership Check
```javascript
app.put('/api/posts/:id', protect, checkOwnership(), updatePost);
```

### Rate Limited Route
```javascript
app.post('/api/scrape/:platform/:username', 
  scrapingLimiter,
  validatePlatform,
  validateUsername,
  scrapeController
);
```

### Fully Protected Route
```javascript
app.post('/api/sensitive',
  authLimiter,           // Rate limit
  protect,               // Auth required
  validateInput,         // Validate input
  sensitiveController    // Handle request
);
```

---

## 🚨 Available Validators

```javascript
// Import validators
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePagination,
  validateObjectId,
  validateSearchQuery,
  validatePlatform,
} from './middlewares/validation.middleware.js';

// Use in routes
app.post('/api/auth/register', validateRegistration, register);
app.post('/api/auth/login', validateLogin, login);
app.put('/api/users/profile', validateProfileUpdate, updateProfile);
app.get('/api/search', validateSearchQuery, search);
```

---

## 🔍 Security Utilities Quick Reference

```javascript
import {
  // Sanitization
  sanitizeString,           // Clean string input
  sanitizeObject,           // Clean objects recursively
  sanitizeMongoQuery,       // Clean MongoDB queries
  
  // Validation
  isValidEmail,            // Check email format
  isValidUsername,         // Check username format
  validatePasswordStrength, // Check password strength
  
  // Detection
  detectSQLInjection,      // Find SQL injection
  detectNoSQLInjection,    // Find NoSQL injection
  detectXSS,               // Find XSS attempts
  checkInputSecurity,      // Check all threats
  
  // Security
  generateSecureToken,     // Generate secure tokens
  generateCSRFToken,       // Generate CSRF tokens
  redactSensitiveData,     // Remove sensitive data from logs
  escapeHTML,              // Escape HTML entities
  
} from './utils/security.util.js';
```

---

## 📊 Security Event Types

These events are automatically logged:

- `BRUTE_FORCE_ATTEMPT` - Multiple failed auth attempts
- `SUSPICIOUS_INPUT` - Malicious input detected
- `RATE_LIMIT_EXCEEDED` - Rate limit violation
- `INVALID_TOKEN` - Invalid JWT token
- `UNAUTHORIZED_ACCESS` - Unauthorized access attempt
- `SQL_INJECTION_ATTEMPT` - SQL injection detected
- `XSS_ATTEMPT` - XSS attack detected
- `NOSQL_INJECTION_ATTEMPT` - NoSQL injection detected

---

## ⚡ Quick Security Checklist

Before deploying, verify:

- [ ] JWT_SECRET is set (min 32 chars)
- [ ] ALLOWED_ORIGINS configured
- [ ] HTTPS enabled in production
- [ ] Security middleware applied globally
- [ ] Rate limiters on auth routes
- [ ] Input validation on all endpoints
- [ ] Protected routes use `protect` middleware
- [ ] No hardcoded secrets in code
- [ ] npm audit shows no critical issues
- [ ] Security tests pass

---

## 🧪 Testing Security

```bash
# Run security tests
npm test -- security.test.js

# Run security audit
npm run security:audit

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

---

## 📚 Error Codes

Use these in your controllers:

```javascript
import { ERROR_CODES } from './utils/response.util.js';

// Authentication
ERROR_CODES.INVALID_CREDENTIALS
ERROR_CODES.USER_EXISTS
ERROR_CODES.UNAUTHORIZED
ERROR_CODES.TOKEN_EXPIRED
ERROR_CODES.INVALID_TOKEN

// Validation
ERROR_CODES.VALIDATION_ERROR
ERROR_CODES.INVALID_INPUT

// Rate Limiting
ERROR_CODES.RATE_LIMIT_EXCEEDED

// Generic
ERROR_CODES.NOT_FOUND
ERROR_CODES.INTERNAL_SERVER_ERROR
```

---

## 🔒 Password Requirements

Automatically enforced:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## 🛠️ Troubleshooting

### "Token verification failed"
- Check JWT_SECRET is set
- Verify token format (should have 3 parts)
- Check token hasn't expired

### "Rate limit exceeded"
- Wait for the specified duration
- Check if rate limit thresholds are too strict
- Verify IP isn't being blocked

### "Suspicious input detected"
- Input contains malicious patterns
- Check input for SQL/NoSQL/XSS patterns
- Sanitize input before sending

### "CORS violation"
- Add origin to ALLOWED_ORIGINS
- Check CORS middleware configuration
- Verify origin header in request

---

## 📖 More Information

- **Full Documentation**: See `SECURITY.md`
- **Implementation Details**: See `SECURITY_CHECKLIST.md`
- **Configuration Options**: See `src/config/security.config.js`
- **Test Suite**: See `src/__tests__/security.test.js`

---

## 🆘 Getting Help

1. Check `SECURITY.md` for detailed documentation
2. Review `SECURITY_CHECKLIST.md` for implementation guide
3. Look at test files for usage examples
4. For security issues: **Email security@grindmap.com**

---

**Quick Tip**: Always test security features in development before deploying to production!
