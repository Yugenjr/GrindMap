# SQL/NoSQL Injection Protection

## Overview
Comprehensive protection against SQL and NoSQL injection attacks through pattern detection, input sanitization, and query validation.

## Protection Features

### 1. Pattern Detection
Automatically detects and blocks:
- SQL keywords: `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `DROP`, `UNION`
- SQL operators: `OR 1=1`, `AND 1=1`, `--`, `/**/`
- NoSQL operators: `$where`, `$ne`, `$gt`, `$regex`, `$or`
- JavaScript injection: `javascript:`, `function(`

### 2. Input Sanitization
- Escapes dangerous characters: `'`, `"`, `\`, `%`
- Removes SQL/NoSQL injection patterns
- XSS protection with HTML entity encoding

### 3. Query Validation
- Whitelist safe MongoDB operators
- Sanitizes database query objects
- Prevents operator injection

## Usage

### Automatic Protection
All routes are automatically protected:
```javascript
// Blocked automatically
GET /api/user?name=admin' OR '1'='1
POST /api/data {"$where": "function() { return true; }"}
```

### Manual Sanitization
```javascript
import { sanitizeQuery, escapeString } from './utils/dbSanitizer.js';

const safeQuery = sanitizeQuery(userQuery);
const safeString = escapeString(userInput);
```

## Security Benefits
- Prevents SQL injection attacks
- Blocks NoSQL operator injection
- Protects against JavaScript injection
- Maintains data integrity
- Logs all blocked attempts for monitoring