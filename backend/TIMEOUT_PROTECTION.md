# Request Timeout Protection

## Overview
Comprehensive timeout protection system preventing resource exhaustion from hanging requests with configurable timeouts for different endpoint types.

## Timeout Configuration

### Endpoint-Specific Timeouts
| Endpoint Type | Timeout | Purpose |
|---------------|---------|---------|
| **Health Checks** | 5s | Fast load balancer checks |
| **Security APIs** | 10s | Authentication/authorization |
| **Audit APIs** | 15s | Log queries and analysis |
| **General APIs** | 30s | Standard API operations |
| **Scraping APIs** | 60s | External data fetching |

### Server-Level Timeouts
- **Server Timeout**: 35s (slightly higher than max request timeout)
- **Keep-Alive**: 5s (connection reuse)
- **Headers Timeout**: 10s (header parsing)
- **Socket Timeout**: 40s (individual socket connections)

## Features

### 1. **Request Tracking**
- Unique request ID generation
- Active request monitoring
- Duration tracking
- Automatic cleanup on completion

### 2. **Connection Management**
- Max 1000 concurrent connections
- Connection counting and monitoring
- Graceful connection cleanup
- Socket timeout handling

### 3. **Resource Protection**
- Prevents memory leaks from hanging requests
- Automatic stale request cleanup
- Connection limit enforcement
- Timeout escalation handling

## Implementation

### Automatic Protection
All routes are automatically protected:
```javascript
// Default 30s timeout applied to all routes
app.use(timeoutMiddleware());

// Specific timeouts for endpoint types
app.use('/health', healthTimeout);        // 5s
app.use('/api/audit', auditTimeout);      // 15s
app.use('/api/security', securityTimeout); // 10s
app.get('/api/leetcode/*', scrapingTimeout); // 60s
```

### Timeout Response
When timeout occurs:
```json
{
  "success": false,
  "error": "Request timeout after 30000ms",
  "timeout": 30000,
  "requestId": "1704067200000-abc123def"
}
```

## Monitoring

### Active Requests
```bash
GET /health/metrics
```
```json
{
  "activeRequests": {
    "count": 3,
    "requests": [
      {
        "id": "req_123",
        "duration": 15000,
        "method": "GET",
        "url": "/api/leetcode/user123",
        "ip": "192.168.1.100"
      }
    ]
  }
}
```

### Connection Monitoring
- Real-time connection count tracking
- Connection lifecycle logging
- Socket error handling
- Graceful shutdown support

## Security Benefits

### Resource Exhaustion Prevention
- **Memory Protection**: Prevents accumulation of hanging requests
- **CPU Protection**: Limits long-running operations
- **Connection Protection**: Prevents connection pool exhaustion
- **DoS Mitigation**: Automatic timeout of malicious long requests

### Monitoring Integration
- Active request tracking for anomaly detection
- Timeout pattern analysis for attack identification
- Resource usage monitoring for capacity planning
- Performance metrics for optimization

## Configuration

### Environment Variables
```bash
# Optional: Override default timeouts (milliseconds)
REQUEST_TIMEOUT_DEFAULT=30000
REQUEST_TIMEOUT_SCRAPING=60000
REQUEST_TIMEOUT_HEALTH=5000
MAX_CONNECTIONS=1000
```

### Custom Timeouts
```javascript
// Apply custom timeout to specific routes
app.use('/api/heavy-operation', timeoutMiddleware(120000)); // 2 minutes
```

## Load Balancer Integration

### Health Check Optimization
- 5-second timeout for health checks
- No rate limiting on health endpoints
- Fast failure detection for load balancers
- Automatic cleanup during health checks

### Production Deployment
```yaml
# AWS ALB Configuration
HealthCheckTimeoutSeconds: 4
HealthCheckIntervalSeconds: 30

# Nginx Configuration
proxy_connect_timeout: 5s;
proxy_send_timeout: 35s;
proxy_read_timeout: 35s;
```

## Troubleshooting

### Common Timeout Scenarios
1. **Scraping Timeouts**: External API delays (60s limit)
2. **Database Timeouts**: Slow queries (30s limit)
3. **Network Timeouts**: Connection issues (40s socket limit)
4. **Processing Timeouts**: Heavy computations (configurable)

### Monitoring Alerts
- **High Active Requests**: > 50 concurrent requests
- **Frequent Timeouts**: > 5% timeout rate
- **Long Duration**: Requests > 80% of timeout limit
- **Connection Limit**: > 90% of max connections