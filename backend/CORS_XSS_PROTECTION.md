# CORS & XSS Protection

## Overview
Comprehensive protection against cross-origin attacks and XSS vulnerabilities with strict CORS policies and multi-layer XSS filtering.

## CORS Configuration

### Strict Origin Control
- **Development**: Only `localhost:3000`, `127.0.0.1:3000`, `localhost:3001`
- **Production**: Only `https://grindmap.vercel.app`, `https://www.grindmap.com`
- **Origin Required**: Production blocks requests without origin header

### Security Features
- Credentials disabled for security
- Limited HTTP methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- Controlled headers: `Content-Type`, `Authorization`, `X-Requested-With`
- Rate limit headers exposed: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## XSS Protection

### Multi-Layer Defense
1. **Pattern Detection**: Blocks `<script>`, `<iframe>`, `javascript:`, `vbscript:`
2. **Event Handler Blocking**: Prevents `onclick`, `onload`, `onerror`, etc.
3. **Content Filtering**: Sanitizes HTML entities and dangerous content
4. **Header Validation**: Checks User-Agent, Referer for XSS attempts

### Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

### Production Enhancements
- **HSTS**: `Strict-Transport-Security` with preload
- **Server Hiding**: Removes `X-Powered-By` and `Server` headers
- **DNS Protection**: Disables DNS prefetching

## Blocked Attacks

### XSS Attempts
```javascript
// These will be blocked:
<script>alert('xss')</script>
<img src="x" onerror="alert('xss')">
javascript:alert('xss')
<iframe src="javascript:alert('xss')"></iframe>
```

### CORS Violations
```javascript
// Blocked origins:
https://malicious-site.com
http://localhost:4000 (not whitelisted)
null (no origin in production)
```

## API Response
Blocked requests return:
```json
{
  "success": false,
  "error": "XSS attempt detected in params.username",
  "requestId": "req_123456"
}
```

## Security Benefits
- Prevents cross-site scripting attacks
- Blocks unauthorized cross-origin requests
- Protects against clickjacking
- Prevents MIME type confusion
- Enforces HTTPS in production
- Comprehensive content security policy