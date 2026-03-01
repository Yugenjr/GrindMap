# DDoS Protection & Advanced Rate Limiting

## Overview
Multi-layered protection against DDoS attacks and API abuse with adaptive rate limiting, IP management, and burst detection.

## Protection Layers

### 1. **Adaptive Rate Limiting**
- Normal users: 100 requests/15min
- Suspicious IPs: Reduced to 5-80 requests/15min
- Blocked IPs: 0 requests

### 2. **Burst Protection**
- Max 5 requests per second
- Automatic suspicious activity tracking
- Immediate response to rapid-fire requests

### 3. **DDoS Detection**
- Monitors 50+ requests/second threshold
- Automatic IP blocking for severe abuse
- Real-time request counting per IP

### 4. **IP Management**
- Whitelist for trusted IPs
- Blacklist for malicious IPs
- Auto-unblock after 1 hour for temporary blocks

## Rate Limits

| Endpoint Type | Limit | Window | Notes |
|---------------|-------|---------|-------|
| General API | 100 req | 15 min | Adaptive based on behavior |
| Sensitive endpoints | 10 req | 5 min | Audit, security routes |
| Burst protection | 5 req | 1 sec | Anti-spam protection |
| DDoS threshold | 50 req | 1 sec | Auto-block trigger |

## API Management

### View IP Lists
```bash
GET /api/security/blacklist
GET /api/security/whitelist
```

### Manage IPs
```bash
# Block IP
POST /api/security/blacklist
{"ip": "192.168.1.100", "reason": "Suspicious activity"}

# Unblock IP  
DELETE /api/security/blacklist/192.168.1.100

# Whitelist IP
POST /api/security/whitelist
{"ip": "192.168.1.50"}
```

## Automatic Protection
- **Suspicious Activity**: 5 violations = 1 hour block
- **Burst Detection**: Immediate rate limit reduction
- **DDoS Response**: Instant blocking for extreme abuse
- **Memory Cleanup**: Automatic cleanup of old tracking data

## Security Benefits
- Prevents API abuse and scraping
- Protects against DDoS attacks
- Maintains service availability
- Automatic threat response
- Detailed logging of all security events