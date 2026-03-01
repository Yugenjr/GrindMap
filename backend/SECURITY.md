# Security Audit and Fixes Documentation

## Overview

This document outlines the comprehensive security measures implemented in the GrindMap backend to protect against common vulnerabilities and attacks.

## 🛡️ Security Features Implemented

### 1. Input Sanitization and Validation

#### Sanitization Functions
- **String Sanitization**: Removes HTML tags, JavaScript protocols, and event handlers
- **Object Sanitization**: Recursively sanitizes nested objects and arrays
- **MongoDB Query Sanitization**: Prevents NoSQL injection by filtering dangerous operators

#### Validation Functions
- Email validation with RFC compliance
- Username validation (alphanumeric, 3-30 characters)
- Password strength validation (minimum 8 characters, uppercase, lowercase, numbers, special characters)
- URL validation and sanitization

#### Threat Detection
- SQL Injection detection
- NoSQL Injection detection
- XSS (Cross-Site Scripting) detection
- Command Injection detection
- Path Traversal detection

### 2. Authentication Security

#### JWT Token Security
- Algorithm whitelisting (HS256 only)
- Issuer verification
- Token format validation before verification
- Expiration warnings (X-Token-Expiring header)
- Detailed error logging for failed attempts

#### Failed Attempt Tracking
- IP-based tracking of failed authentication attempts
- Automatic IP blocking after 5 failed attempts
- 15-minute block duration (exponentially increasing for repeat offenders)

#### Role-Based Access Control (RBAC)
- `protect` middleware for authenticated routes
- `optionalAuth` for routes that work with or without authentication
- `requireRole` for role-based permissions
- `checkOwnership` for resource ownership verification

### 3. Rate Limiting

#### Multiple Rate Limit Tiers
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **Scraping**: 10 requests per minute
- **Password Reset**: 3 attempts per hour
- **Registration**: 5 accounts per hour per IP

#### Rate Limit Features
- Custom key generation (IP + User ID)
- Violation tracking with escalating penalties
- Detailed logging of rate limit violations
- Health check endpoints exempted from rate limiting

### 4. Security Headers

#### Headers Applied
- **X-Content-Type-Options**: nosniff - Prevents MIME type sniffing
- **X-Frame-Options**: DENY - Prevents clickjacking
- **X-XSS-Protection**: 1; mode=block - XSS protection
- **Content-Security-Policy**: Strict CSP to prevent XSS
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restricts browser features
- **Strict-Transport-Security**: HSTS for HTTPS enforcement (production only)

#### Headers Removed
- **X-Powered-By**: Removed to hide technology stack
- **Server**: Removed to hide server information

### 5. CORS Security

#### CORS Configuration
- Origin whitelist validation
- Credentials support (when needed)
- Pre-flight request handling
- Development vs production origin lists
- Logging of CORS violations

### 6. Request Security

#### Request Validation
- HTTP method validation (only allowed methods)
- Request size limits (10MB max)
- Content type validation
- Suspicious pattern detection

#### Sensitive Data Protection
- Automatic redaction of sensitive fields in logs
- Password, token, API key detection
- Credit card and SSN pattern detection
- Secure logging with PII protection

### 7. Cryptographic Security

#### Secure Functions
- Time-safe string comparison (prevents timing attacks)
- Secure random token generation
- CSRF token generation and verification
- Password hashing with bcrypt (12 rounds)

## 🚨 Common Vulnerabilities Prevented

### OWASP Top 10 Coverage

1. **A01:2021 - Broken Access Control**
   - ✅ JWT-based authentication
   - ✅ Role-based access control
   - ✅ Ownership verification
   - ✅ Token expiration handling

2. **A02:2021 - Cryptographic Failures**
   - ✅ Strong password hashing (bcrypt with 12 rounds)
   - ✅ Secure token generation
   - ✅ HTTPS enforcement in production
   - ✅ Secure cookie configuration

3. **A03:2021 - Injection**
   - ✅ SQL injection detection and prevention
   - ✅ NoSQL injection prevention
   - ✅ Command injection detection
   - ✅ Input sanitization at all entry points

4. **A04:2021 - Insecure Design**
   - ✅ Rate limiting on all sensitive endpoints
   - ✅ IP blocking for repeated violations
   - ✅ Secure by default configuration
   - ✅ Principle of least privilege

5. **A05:2021 - Security Misconfiguration**
   - ✅ Security headers properly configured
   - ✅ Error messages don't expose sensitive info
   - ✅ Unnecessary features disabled
   - ✅ Default passwords and keys not used

6. **A06:2021 - Vulnerable and Outdated Components**
   - ✅ Automated security audits (`npm audit`)
   - ✅ Dependency version pinning
   - ✅ Security audit script
   - ✅ Regular update checks

7. **A07:2021 - Identification and Authentication Failures**
   - ✅ Strong password requirements
   - ✅ Multi-factor authentication ready
   - ✅ Session timeout
   - ✅ Brute force protection

8. **A08:2021 - Software and Data Integrity Failures**
   - ✅ JWT signature verification
   - ✅ Input validation
   - ✅ Secure deserialization
   - ✅ Integrity checks

9. **A09:2021 - Security Logging and Monitoring Failures**
   - ✅ Comprehensive security event logging
   - ✅ Failed attempt tracking
   - ✅ Rate limit violation monitoring
   - ✅ Suspicious activity detection

10. **A10:2021 - Server-Side Request Forgery (SSRF)**
    - ✅ URL validation and sanitization
    - ✅ Whitelist-based URL validation
    - ✅ Request origin verification
    - ✅ Internal IP blocking

## 📋 Security Checklist

### Development Phase
- [x] Input validation on all endpoints
- [x] Output encoding for all user data
- [x] Parameterized queries / ORM usage
- [x] Secure password storage (bcrypt)
- [x] HTTPS enforcement in production
- [x] Security headers configured
- [x] CORS properly configured
- [x] Rate limiting on all endpoints
- [x] Authentication on protected routes
- [x] Authorization checks
- [x] Sensitive data encryption
- [x] Error handling without info leakage
- [x] Logging without sensitive data
- [x] Dependency vulnerability scanning

### Pre-Deployment
- [ ] Security audit completed
- [ ] Penetration testing performed
- [ ] Code review with security focus
- [ ] Environment variables secured
- [ ] Secrets not in version control
- [ ] Database access restricted
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates valid
- [ ] Backup strategy in place
- [ ] Incident response plan ready

### Production
- [ ] Security monitoring enabled
- [ ] Automated alerts configured
- [ ] Regular security audits scheduled
- [ ] Dependency updates automated
- [ ] Log aggregation set up
- [ ] DDoS protection enabled
- [ ] WAF (Web Application Firewall) configured
- [ ] Regular backups verified

## 🔧 Configuration

### Environment Variables Required

```env
# JWT Configuration
JWT_SECRET=your-secure-jwt-secret-min-32-chars
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
NODE_ENV=production
BCRYPT_ROUNDS=12

# Database
MONGODB_URI=mongodb://localhost:27017/grindmap

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

### Security Configuration File

See `src/config/security.config.js` for detailed configuration options.

## 🛠️ Usage Examples

### Using Security Middleware

```javascript
import { 
  applySecurity, 
  securityHeaders, 
  sanitizeInputs,
  detectThreats 
} from './middlewares/security.middleware.js';

// Apply all security middlewares at once
app.use(applySecurity);

// Or apply individually
app.use(securityHeaders);
app.use(sanitizeInputs);
app.use(detectThreats);
```

### Using Authentication Middleware

```javascript
import { protect, requireRole, checkOwnership } from './middlewares/auth.middleware.js';

// Protected route (requires authentication)
app.get('/api/profile', protect, getProfile);

// Admin only route
app.get('/api/admin/users', protect, requireRole('admin'), getAllUsers);

// User can only access their own data
app.put('/api/profile/:id', protect, checkOwnership(), updateProfile);
```

### Using Rate Limiters

```javascript
import { 
  authLimiter, 
  scrapingLimiter, 
  passwordResetLimiter 
} from './middlewares/rateLimiter.middleware.js';

// Apply to authentication routes
app.post('/api/auth/login', authLimiter, login);
app.post('/api/auth/register', registrationLimiter, register);

// Apply to scraping routes
app.get('/api/scrape/:platform/:username', scrapingLimiter, scrape);

// Apply to password reset
app.post('/api/auth/reset-password', passwordResetLimiter, resetPassword);
```

### Using Security Utilities

```javascript
import { 
  sanitizeString,
  checkInputSecurity,
  validatePasswordStrength,
  sanitizeMongoQuery 
} from './utils/security.util.js';

// Sanitize user input
const sanitizedInput = sanitizeString(req.body.comment);

// Check for security threats
const result = checkInputSecurity(req.body.search, req);
if (!result.safe) {
  throw new AppError('Suspicious input detected', 400);
}

// Validate password
const passwordCheck = validatePasswordStrength(password);
if (!passwordCheck.valid) {
  return res.status(400).json({ errors: passwordCheck.errors });
}

// Sanitize MongoDB query
const safeQuery = sanitizeMongoQuery(req.query);
const results = await Model.find(safeQuery);
```

## 📊 Security Monitoring

### Logged Security Events
- Failed authentication attempts
- Rate limit violations
- Suspicious input detection
- SQL/NoSQL injection attempts
- XSS attempts
- CORS violations
- IP blocking events
- Token expiration warnings

### Log Locations
- **Security logs**: `logs/security-audit-*.log`
- **Application logs**: `logs/app-*.log`
- **Error logs**: `logs/error-*.log`

## 🚀 Running Security Audits

### Automated Security Audit

```bash
# Run comprehensive security audit
npm run security:audit

# Run audit with automatic fixes
npm run security:fix

# Generate security report only
npm run security:report
```

### Manual Security Checks

```bash
# Check for npm vulnerabilities
npm audit

# Check with fix suggestions
npm audit fix

# Check for outdated dependencies
npm outdated

# Run linter with security rules
npm run lint
```

## 🔍 Vulnerability Response Process

### If a Vulnerability is Discovered

1. **Assess Severity**: Determine CVSS score and impact
2. **Isolate**: Identify affected components
3. **Patch**: Apply fixes or updates
4. **Test**: Verify fix doesn't break functionality
5. **Deploy**: Roll out fix to production
6. **Monitor**: Watch for exploitation attempts
7. **Document**: Update security documentation
8. **Notify**: Inform stakeholders if necessary

## 📚 Additional Resources

### OWASP Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

### Security Best Practices
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security Checklist](https://docs.mongodb.com/manual/administration/security-checklist/)

## 🤝 Contributing to Security

If you discover a security vulnerability, please:

1. **DO NOT** open a public issue
2. Email security concerns to: security@grindmap.com
3. Include detailed steps to reproduce
4. Allow time for patching before disclosure
5. Follow responsible disclosure practices

## 📝 Changelog

### Version 1.0.0 (March 2026)
- Initial security implementation
- Comprehensive input sanitization
- Enhanced authentication and authorization
- Multi-tier rate limiting
- Security headers and CORS configuration
- Threat detection and logging
- Security utilities and helpers
- Complete documentation

---

**Security is an ongoing process. Stay vigilant, keep dependencies updated, and regularly review security measures.**
