# Audit Trail System

## Overview
Comprehensive logging and audit trail system for GrindMap backend that captures all API requests, responses, and security events.

## Features
- **Request/Response Logging**: Every API call is logged with full details
- **Security Monitoring**: Automatic detection of suspicious patterns
- **Audit Trail**: Complete trace of user actions and system events
- **Log Viewer**: API and CLI tools for accessing logs

## Log Types

### 1. REQUEST Logs
```json
{
  "type": "REQUEST",
  "requestId": "1704067200000-abc123def",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "method": "GET",
  "url": "/api/leetcode/username",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "headers": {...},
  "query": {...}
}
```

### 2. RESPONSE Logs
```json
{
  "type": "RESPONSE",
  "requestId": "1704067200000-abc123def",
  "timestamp": "2024-01-01T00:00:00.500Z",
  "statusCode": 200,
  "responseTime": "500ms",
  "contentLength": 1024
}
```

### 3. SECURITY_EVENT Logs
```json
{
  "type": "SECURITY_EVENT",
  "requestId": "1704067200000-abc123def",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "WARNING",
  "statusCode": 404,
  "ip": "192.168.1.1",
  "threatType": "XSS_ATTEMPT"
}
```

## API Endpoints

### Get Audit Logs
```
GET /api/audit/logs?type=REQUEST&limit=100
```

### Get Security Events
```
GET /api/audit/security?hours=24
```

### Get Request Trace
```
GET /api/audit/trace/:requestId
```

## CLI Usage

```bash
# View recent logs
npm run audit:logs logs

# View security events
npm run audit:logs security

# Trace specific request
npm run audit:logs trace <requestId>
```

## Log Files
- `logs/audit.log` - All requests and responses
- `logs/security.log` - Security events and threats

## Security Monitoring
Automatically detects:
- Path traversal attempts (`../`)
- XSS attempts (`<script>`)
- SQL injection (`union select`)
- Code injection (`eval(`, `javascript:`)

## Compliance
Logs include all necessary information for:
- Security incident investigation
- Debugging production issues
- Compliance audit trails
- Performance monitoring