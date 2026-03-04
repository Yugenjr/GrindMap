# Process Resource Limits & CPU Protection

## Overview
Comprehensive CPU monitoring and process resource limits to prevent server freezing from infinite loops, heavy computations, and resource exhaustion attacks.

## CPU Monitoring

### Real-Time Monitoring
- **Interval**: 5-second CPU usage checks
- **History**: 60 readings (5-minute rolling window)
- **Metrics**: Process CPU + System load average
- **Thresholds**: Warning (70%), Critical (85%), Emergency (95%)

### CPU Thresholds
| Level | Threshold | Action |
|-------|-----------|--------|
| **Normal** | < 70% | Continue monitoring |
| **Warning** | 70-84% | Log warning, emit event |
| **Critical** | 85-94% | Force garbage collection |
| **Emergency** | ≥ 95% | Block new requests, emergency cleanup |

## Request Protection

### 1. **CPU-Based Request Blocking**
```javascript
// Blocks new requests when CPU > 90%
if (currentCPU > 90) {
  return res.status(503).json({
    error: 'Service temporarily unavailable - high CPU usage',
    cpuUsage: '92.5%',
    retryAfter: 30
  });
}
```

### 2. **Heavy Operation Monitoring**
- **Real-time Tracking**: Monitors CPU during request processing
- **Termination**: Kills requests causing >95% CPU usage
- **Performance Headers**: `X-CPU-Time`, `X-Duration`
- **Heavy Operation Alerts**: Logs operations >1s CPU time

### 3. **Process Resource Limits**
- **Memory Limit**: 2GB maximum RSS
- **CPU Time Limit**: 5 minutes maximum per process
- **File Descriptors**: 1024 maximum open files
- **Process Count**: 100 maximum child processes

## Implementation

### Automatic Protection
```javascript
// Applied to all routes
app.use(cpuProtection);

// Heavy operation monitoring for scraping endpoints
app.use('/api/leetcode/*', heavyOperationProtection);
app.use('/api/codeforces/*', heavyOperationProtection);
app.use('/api/codechef/*', heavyOperationProtection);
```

### Process Limits (Unix/Linux)
```bash
# Automatically set on startup
ulimit -v 2097152    # 2GB virtual memory
ulimit -t 300        # 5 minutes CPU time
ulimit -n 1024       # 1024 file descriptors
ulimit -u 100        # 100 processes
```

## Monitoring Integration

### Health Metrics
```bash
GET /health/metrics
```
```json
{
  "cpu": {
    "current": {
      "cpuPercent": "45.2",
      "loadAvg": ["0.85", "0.92", "1.05"],
      "cpuCount": 4
    },
    "averages": {
      "last5min": "42.8",
      "last1min": "48.1"
    },
    "thresholds": {
      "warning": 70,
      "critical": 85,
      "emergency": 95
    }
  },
  "process": {
    "limits": {
      "maxMemory": 2147483648,
      "maxCPUTime": 300,
      "maxFileDescriptors": 1024
    },
    "current": {
      "memory": {
        "rss": 134217728,
        "percentage": "6.3"
      },
      "cpu": {
        "userTime": 1250.5,
        "systemTime": 890.2
      }
    }
  }
}
```

## Emergency Response

### Automatic Actions
1. **Warning (70% CPU)**: Log warning, continue monitoring
2. **Critical (85% CPU)**: Force garbage collection
3. **Emergency (95% CPU)**: 
   - Block new requests
   - Clear all caches
   - Double garbage collection
   - Emergency cleanup

### Request Termination
```javascript
// Requests terminated if they cause >95% CPU usage
{
  "success": false,
  "error": "Request terminated - excessive CPU usage",
  "cpuUsage": "96.8%"
}
```

## Performance Headers

### CPU Tracking Headers
```http
HTTP/1.1 200 OK
X-CPU-Time: 125.50ms
X-Duration: 1250.25ms
X-CPU-Usage: 45.2%
```

### Heavy Operation Detection
- **Threshold**: >1000ms CPU time
- **Logging**: Automatic logging of heavy operations
- **Monitoring**: Tracked in health metrics
- **Alerting**: Configurable alerts for heavy operations

## Security Benefits

### DoS Protection
- **CPU Exhaustion**: Prevents CPU-based DoS attacks
- **Infinite Loops**: Terminates runaway processes
- **Resource Limits**: Bounds memory and file usage
- **Fair Scheduling**: Ensures server responsiveness

### Attack Mitigation
- **Algorithmic Complexity**: Protects against O(n²) attacks
- **Heavy Computations**: Limits computational resources
- **Fork Bombs**: Prevents process multiplication attacks
- **Memory Bombs**: Enforces memory limits

## Configuration

### Environment Variables
```bash
CPU_WARNING_THRESHOLD=70
CPU_CRITICAL_THRESHOLD=85
CPU_EMERGENCY_THRESHOLD=95
MAX_MEMORY_LIMIT=2147483648
MAX_CPU_TIME=300
MAX_FILE_DESCRIPTORS=1024
```

### Custom Limits
```javascript
// Set custom process limits
processLimiter.limits.maxMemory = 4 * 1024 * 1024 * 1024; // 4GB
processLimiter.limits.maxCPUTime = 600; // 10 minutes
processLimiter.setLimits();
```

## Production Deployment

### Node.js Flags
```bash
# Enable garbage collection control
node --expose-gc src/server.js

# Set memory limits
node --max-old-space-size=1536 src/server.js

# Enable CPU profiling
node --prof src/server.js
```

### System Limits (systemd)
```ini
[Service]
MemoryLimit=2G
CPUQuota=200%
TasksMax=100
LimitNOFILE=1024
```

## Monitoring & Alerting

### Prometheus Metrics
- `cpu_usage_percent`
- `cpu_load_average`
- `process_cpu_time_seconds`
- `heavy_operations_total`
- `cpu_blocked_requests_total`

### Alert Thresholds
- **High CPU**: > 80% for 2 minutes
- **CPU Spikes**: > 95% for 30 seconds
- **Heavy Operations**: > 10 per minute
- **Blocked Requests**: > 5% of total requests

## Troubleshooting

### Common CPU Issues
1. **Infinite Loops**: Automatic termination at 95% CPU
2. **Heavy Regex**: Monitored and logged automatically
3. **Large Data Processing**: Chunked processing recommended
4. **External API Delays**: Timeout protection active

### Performance Optimization
- **Async Operations**: Use async/await for I/O
- **Streaming**: Stream large responses
- **Caching**: Cache expensive computations
- **Load Balancing**: Distribute CPU-intensive tasks

## Best Practices

### CPU-Friendly Code
- **Avoid Blocking**: Use non-blocking I/O operations
- **Chunk Processing**: Break large operations into chunks
- **Efficient Algorithms**: Use O(n log n) or better algorithms
- **Resource Cleanup**: Properly close files and connections

### Monitoring
- **Regular Review**: Monitor CPU usage patterns
- **Threshold Tuning**: Adjust limits based on workload
- **Performance Profiling**: Use Node.js profiler for optimization
- **Load Testing**: Test CPU limits under load