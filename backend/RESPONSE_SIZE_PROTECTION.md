# API Response Size Limits & Compression Bomb Protection

## Overview
Comprehensive protection against memory exhaustion and bandwidth abuse through response size limits, compression bomb detection, and bandwidth monitoring.

## Response Size Limits

### Endpoint-Specific Limits
| Endpoint Type | Response Limit | Purpose |
|---------------|----------------|---------|
| **Health Checks** | 1KB | Fast load balancer responses |
| **Security APIs** | 10KB | Authentication/authorization data |
| **Audit APIs** | 50KB | Log queries and analysis |
| **General APIs** | 500KB | Standard API responses |
| **Scraping APIs** | 1MB | External data with rich content |

### Request Body Limits
| Endpoint Type | Body Limit | Content Types |
|---------------|------------|---------------|
| **Health Checks** | 0B | No body allowed |
| **Audit APIs** | 1KB | JSON queries only |
| **Security APIs** | 2KB | JSON operations |
| **General APIs** | 100KB | JSON data |
| **Upload APIs** | 10MB | Files and large data |

## Compression Bomb Protection

### Detection Patterns
- **Repeated Characters**: 1000+ consecutive identical characters
- **Excessive Whitespace**: Large blocks of spaces/newlines
- **Repeated Null Values**: Suspicious null patterns
- **Empty String Patterns**: Repeated empty strings in JSON

### Compression Ratio Analysis
- **Threshold**: 100:1 compression ratio triggers alert
- **Analysis**: Compares original vs compressed size
- **Response**: Blocks suspicious responses automatically

## Bandwidth Monitoring

### Usage Limits
- **Per IP (Hourly)**: 100MB per IP address
- **Per IP (Minute)**: 10MB per IP address  
- **Global (Hourly)**: 1GB total server bandwidth

### Monitoring Features
- **Real-time Tracking**: Tracks data transfer per IP
- **Usage Statistics**: Top bandwidth consumers
- **Automatic Reset**: Hourly counter reset
- **Limit Enforcement**: Blocks excessive usage

## Implementation

### Automatic Protection
```javascript
// Applied to all routes automatically
app.use(compressionBombProtection);
app.use(responseSizeLimit()); // Default 500KB

// Endpoint-specific limits
app.use('/health', healthSizeLimit);     // 1KB
app.use('/api/audit', auditSizeLimit);   // 50KB
app.use('/api/security', securitySizeLimit); // 10KB
```

### Response Headers
```http
HTTP/1.1 200 OK
X-Response-Size: 245760
X-Response-Limit: 524288
Content-Length: 245760
```

### Error Responses
```json
{
  "success": false,
  "error": "Response too large",
  "limit": "500KB",
  "size": "750KB"
}
```

## Bandwidth Usage Tracking

### Real-time Monitoring
```bash
GET /health/metrics
```
```json
{
  "bandwidth": {
    "global": {
      "usage": "45.2MB",
      "limit": "1024.0MB", 
      "percentage": "4.4"
    },
    "limits": {
      "perIP": "100.0MB",
      "perMinute": "10.0MB",
      "global": "1024.0MB"
    },
    "topUsers": [
      {
        "ip": "192.168.1.100",
        "hourly": "12.5MB",
        "minute": "2.1MB"
      }
    ],
    "activeIPs": 25
  }
}
```

## Security Benefits

### Memory Protection
- **Prevents OOM**: Limits response size to prevent memory exhaustion
- **Resource Control**: Bounded memory usage per request
- **Graceful Degradation**: Service continues with size limits

### Bandwidth Protection  
- **Abuse Prevention**: Stops bandwidth exhaustion attacks
- **Fair Usage**: Ensures equitable resource distribution
- **Cost Control**: Prevents excessive data transfer costs

### Attack Mitigation
- **Compression Bombs**: Detects and blocks malicious payloads
- **Data Exfiltration**: Limits amount of data per request
- **DoS Prevention**: Prevents resource exhaustion attacks

## Configuration

### Environment Variables
```bash
RESPONSE_LIMIT_HEALTH=1024
RESPONSE_LIMIT_API=524288
RESPONSE_LIMIT_SCRAPING=1048576
BANDWIDTH_LIMIT_PER_IP=104857600
BANDWIDTH_LIMIT_GLOBAL=1073741824
```

### Custom Limits
```javascript
// Apply custom response limit
app.use('/api/large-data', responseSizeLimit(2 * 1024 * 1024)); // 2MB

// Custom body size validation
app.use('/api/upload', bodySize(50 * 1024 * 1024)); // 50MB
```

## Monitoring & Alerting

### Metrics Collection
- Response size distribution
- Compression bomb attempts
- Bandwidth usage patterns
- Limit violation frequency

### Alert Thresholds
- **Response Size**: > 90% of limit
- **Bandwidth Usage**: > 80% of hourly limit
- **Compression Bombs**: Any detection
- **Frequent Violations**: > 5 violations per IP

## Streaming for Large Responses

### Automatic Streaming
```javascript
import { streamLargeResponse } from './middlewares/responseLimit.middleware.js';

// Stream responses > 64KB automatically
streamLargeResponse(largeData, res);
```

### Streaming Headers
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Streaming: true
X-Response-Size: 2097152
Transfer-Encoding: chunked
```

## Best Practices

### Response Optimization
- **Pagination**: Break large datasets into pages
- **Compression**: Use gzip for text responses
- **Caching**: Cache frequently requested data
- **Filtering**: Allow clients to filter response fields

### Monitoring
- **Regular Review**: Monitor bandwidth usage patterns
- **Threshold Tuning**: Adjust limits based on usage
- **Performance Impact**: Monitor response time impact
- **User Experience**: Balance security with usability