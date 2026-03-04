# Request Body Size Validation & Parsing Limits

## Overview
Comprehensive request body validation with granular size limits, JSON structure validation, malicious payload detection, and parsing time limits to prevent various attack vectors.

## Granular Size Limits

### Endpoint-Specific Body Limits
| Endpoint Type | Body Limit | Purpose |
|---------------|------------|---------|
| **Health Checks** | 0B | No request body allowed |
| **Audit APIs** | 1KB | Small query parameters |
| **Security APIs** | 2KB | Authentication data |
| **General APIs** | 100KB | Standard API operations |
| **Scraping APIs** | 50KB | Platform usernames and filters |
| **Upload APIs** | 10MB | File uploads and large data |

### Global Express Limit
- **Express JSON Parser**: 10MB maximum (fallback limit)
- **Content-Type Validation**: Only `application/json` allowed
- **Early Rejection**: Oversized requests blocked before parsing

## JSON Structure Validation

### Parsing Limits
| Limit Type | Threshold | Purpose |
|------------|-----------|---------|
| **Max Depth** | 10 levels | Prevent deeply nested objects |
| **Max Keys** | 100 per object | Limit object complexity |
| **Max Array Length** | 1000 items | Prevent large arrays |
| **Max String Length** | 10,000 chars | Limit string size |

### Structure Validation
```javascript
// These will be rejected:
{
  "deep": {"nested": {"object": {"too": {"many": {"levels": true}}}}} // > 10 levels
}

{
  "largeArray": [1, 2, 3, ...] // > 1000 items
}

{
  "tooManyKeys": { "key1": 1, "key2": 2, ... } // > 100 keys
}
```

## Malicious Payload Detection

### Attack Pattern Detection
- **Billion Laughs**: XML entity expansion patterns
- **Zip Bombs**: Suspicious base64 patterns
- **Repetition Attacks**: Excessive character repetition
- **Nested Bombs**: Deeply nested bracket structures
- **Unicode Bombs**: Control character sequences

### JSON Bomb Protection
```javascript
// Blocked patterns:
"aaaaaaaaaa..." // 100+ repeated characters
"[[[[[[[[[[" // 20+ nested brackets
"\u0000\u0001\u0002..." // 10+ control characters
```

## Parsing Time Limits

### Performance Protection
- **Parse Timeout**: 1 second maximum JSON parsing time
- **Size Tracking**: Total request size monitoring
- **Performance Headers**: Parse time tracking
- **Large Request Logging**: Automatic logging of >100KB requests

### Parse Time Monitoring
```http
HTTP/1.1 200 OK
X-Parse-Time: 125ms
X-Request-Size: 45KB
X-Body-Size: 12KB
```

## Implementation

### Automatic Validation
```javascript
// Applied to all routes automatically
app.use(requestSizeTracker);
app.use(maliciousPayloadDetection);
app.use(parseTimeLimit()); // 1 second limit
app.use(validateJSONStructure);

// Endpoint-specific limits
app.use('/health', healthBodyLimit);        // 0B
app.use('/api/audit', auditBodyLimit);      // 1KB
app.use('/api/security', securityBodyLimit); // 2KB
app.use('/api/*', scrapingBodyLimit);       // 50KB
```

### Error Responses
```json
{
  "success": false,
  "error": "Request body too large. Limit: 50KB",
  "received": "75KB"
}

{
  "success": false,
  "error": "Invalid JSON structure: Max depth exceeded at data.nested.deep"
}

{
  "success": false,
  "error": "Malicious payload detected"
}
```

## Monitoring & Statistics

### Body Validation Metrics
```bash
GET /health/metrics
```
```json
{
  "bodyValidation": {
    "totalRequests": 15420,
    "rejectedRequests": 45,
    "rejectionRate": "0.29%",
    "maliciousAttempts": 12,
    "maliciousRate": "0.08%",
    "avgBodySizeKB": 8,
    "maxBodySizeKB": 95,
    "parseTimeouts": 3
  }
}
```

### Request Size Tracking
- **Total Request Size**: URL + Headers + Body
- **Large Request Alerts**: >100KB requests logged
- **Size Distribution**: Average and maximum sizes tracked
- **Performance Impact**: Parse time monitoring

## Security Benefits

### Attack Prevention
- **DoS Protection**: Prevents large payload attacks
- **Memory Exhaustion**: Limits memory usage per request
- **CPU Protection**: Prevents slow parsing attacks
- **Structure Attacks**: Blocks malformed JSON bombs

### Resource Protection
- **Bandwidth Saving**: Rejects oversized requests early
- **Memory Efficiency**: Bounded memory usage
- **CPU Efficiency**: Fast rejection of malicious payloads
- **Parser Protection**: Prevents JSON parser exploitation

## Configuration

### Environment Variables
```bash
BODY_LIMIT_HEALTH=0
BODY_LIMIT_AUDIT=1024
BODY_LIMIT_SECURITY=2048
BODY_LIMIT_API=102400
BODY_LIMIT_SCRAPING=51200
BODY_LIMIT_UPLOAD=10485760

JSON_MAX_DEPTH=10
JSON_MAX_KEYS=100
JSON_MAX_ARRAY_LENGTH=1000
JSON_MAX_STRING_LENGTH=10000

PARSE_TIME_LIMIT=1000
```

### Custom Validation
```javascript
// Custom body size limit
app.use('/api/large-data', bodySize(5 * 1024 * 1024)); // 5MB

// Custom JSON structure limits
const customLimits = {
  maxDepth: 5,
  maxKeys: 50,
  maxArrayLength: 500
};
```

## Best Practices

### Request Optimization
- **Minimize Nesting**: Keep JSON structures flat
- **Batch Operations**: Combine multiple operations
- **Compression**: Use gzip for large requests
- **Pagination**: Split large datasets

### Security Guidelines
- **Input Validation**: Validate all input fields
- **Size Awareness**: Monitor request sizes
- **Structure Limits**: Enforce reasonable JSON limits
- **Early Rejection**: Fail fast on invalid requests

## Troubleshooting

### Common Issues
1. **Body Too Large**: Reduce request size or use pagination
2. **JSON Too Deep**: Flatten nested structures
3. **Too Many Keys**: Group related fields
4. **Parse Timeout**: Simplify JSON structure

### Performance Tips
- **Stream Large Data**: Use streaming for large uploads
- **Validate Early**: Check size before parsing
- **Monitor Patterns**: Track rejection patterns
- **Optimize Structure**: Use efficient JSON structures

## Integration Examples

### Frontend Handling
```javascript
// Handle body size errors
fetch('/api/data', {
  method: 'POST',
  body: JSON.stringify(data)
})
.catch(error => {
  if (error.status === 413) {
    console.log('Request too large, splitting data...');
  }
});
```

### Load Balancer Configuration
```nginx
# Nginx body size limits
client_max_body_size 10M;
client_body_timeout 30s;
client_header_timeout 30s;
```