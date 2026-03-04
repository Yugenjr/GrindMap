# Security Sanitization System

## Overview
Prevents sensitive data leaks in logs, error messages, and API responses by automatically detecting and masking sensitive information.

## Features
- **Automatic Detection**: Identifies API keys, passwords, tokens, database URLs
- **Smart Masking**: Shows last 4 characters for identification while hiding sensitive parts
- **Environment Protection**: Validates and sanitizes environment variables
- **Error Sanitization**: Cleans error messages and stack traces

## Protected Data Types
- API keys and tokens
- Database passwords and connection strings
- JWT tokens
- Credit card numbers
- Email addresses in sensitive contexts
- Authorization headers

## Usage

### Automatic Protection
All logs and error messages are automatically sanitized:

```javascript
// Before: API_KEY=sk_live_1234567890abcdef
// After:  API_KEY=************cdef
```

### Manual Sanitization
```javascript
import { sanitizeSensitiveData } from './utils/sanitizer.js';

const cleanData = sanitizeSensitiveData(userData);
```

### Environment Validation
```javascript
// Validates on server startup
validateEnvironment();
```

## Configuration
Add to `.env`:
```
NODE_ENV=production
JWT_SECRET=your_strong_secret_here
DB_PASSWORD=your_secure_password
```

## Security Benefits
- Prevents credential exposure in logs
- Protects against accidental data leaks
- Maintains audit trail without sensitive data
- Validates environment security on startup