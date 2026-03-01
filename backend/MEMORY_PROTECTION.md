# Memory Leak Protection

## Overview
Comprehensive memory leak protection system with active monitoring, automatic cleanup, and intelligent cache management to prevent memory exhaustion in long-running processes.

## Memory Monitoring

### Real-Time Monitoring
- **Interval**: 5-second memory checks
- **History**: 60 readings (5-minute rolling window)
- **Thresholds**: Warning (80%), Critical (90%), Emergency (95%)
- **Leak Detection**: Automatic detection of consistent memory growth

### Memory Thresholds
| Level | Threshold | Action |
|-------|-----------|--------|
| **Normal** | < 80% | Continue monitoring |
| **Warning** | 80-89% | Log warning, emit event |
| **Critical** | 90-94% | Force garbage collection, cache cleanup |
| **Emergency** | ≥ 95% | Block new requests, aggressive cleanup |

## Automatic Protection

### 1. **Request Blocking**
```javascript
// Blocks new requests when memory > 95%
if (heapUsageRatio > 0.95) {
  return res.status(503).json({
    error: 'Service temporarily unavailable - critical memory usage',
    memoryUsage: '450MB',
    heapUsage: '96%'
  });
}
```

### 2. **Garbage Collection**
- **Automatic GC**: Triggered at critical memory levels
- **Multiple Passes**: Up to 3 GC cycles during emergency
- **Memory Freed**: Tracks and reports freed memory
- **Requires**: `--expose-gc` flag for manual GC

### 3. **Cache Management**
- **TTL-based Expiration**: 30-minute default cache lifetime
- **Size Limits**: 1000 entries per cache maximum
- **LRU Eviction**: Removes least recently used entries
- **Emergency Cleanup**: Clears all caches during memory emergency

## Cache System

### Features
- **Multiple Caches**: Named cache instances
- **Automatic Expiration**: TTL-based cleanup
- **Size Management**: Configurable size limits
- **Hit/Miss Tracking**: Performance monitoring
- **Memory-Aware**: Integrates with memory monitoring

### Usage
```javascript
import { cacheManager } from './utils/cacheManager.js';

// Create cache
cacheManager.createCache('userStats', { maxSize: 500, maxAge: 600000 });

// Store data
cacheManager.set('userStats', 'user123', userData);

// Retrieve data
const data = cacheManager.get('userStats', 'user123');
```

## Leak Detection

### Detection Algorithm
1. **Growth Tracking**: Monitors heap growth over 10 checks
2. **Average Calculation**: Calculates average memory growth
3. **Threshold Check**: Alerts if growth > 5MB per check
4. **Pattern Analysis**: Identifies consistent upward trends

### Leak Response
- **Warning Logs**: Alerts about potential leaks
- **Event Emission**: Triggers leak-detected events
- **Automatic Cleanup**: Initiates cache and module cleanup
- **Monitoring Integration**: Reports to health endpoints

## Monitoring Integration

### Health Endpoints
```bash
GET /health/metrics
```
```json
{
  "memory": {
    "current": {
      "heapUsed": 128,
      "heapTotal": 256,
      "heapUsagePercent": 50
    },
    "thresholds": {
      "warning": 80,
      "critical": 90,
      "emergency": 95
    },
    "monitoring": true,
    "lastGC": "2024-01-23T12:00:00.000Z"
  },
  "caches": {
    "userStats": {
      "size": 245,
      "maxSize": 1000,
      "hits": 1250,
      "misses": 180,
      "hitRate": "87.41%"
    }
  }
}
```

## Production Configuration

### Node.js Flags
```bash
# Enable garbage collection control
node --expose-gc src/server.js

# Set memory limits
node --max-old-space-size=2048 src/server.js

# Enable memory monitoring
node --trace-gc src/server.js
```

### Environment Variables
```bash
MEMORY_WARNING_THRESHOLD=0.8
MEMORY_CRITICAL_THRESHOLD=0.9
MEMORY_EMERGENCY_THRESHOLD=0.95
CACHE_MAX_SIZE=1000
CACHE_TTL=1800000  # 30 minutes
```

## Emergency Procedures

### Automatic Emergency Response
1. **Block New Requests**: Prevent further memory allocation
2. **Force Garbage Collection**: Multiple GC cycles
3. **Clear All Caches**: Free cached data
4. **Clean Module Cache**: Remove non-essential cached modules
5. **Log Emergency**: Record incident for analysis

### Manual Recovery
```bash
# Force garbage collection via health endpoint
curl -X POST /health/gc

# Clear specific cache
curl -X DELETE /health/cache/userStats

# Get memory status
curl /health/metrics
```

## Alerting & Monitoring

### Prometheus Metrics
- `memory_heap_used_bytes`
- `memory_heap_usage_percent`
- `cache_hit_rate`
- `cache_size_entries`
- `memory_gc_count`

### Alert Thresholds
- **Memory Warning**: > 80% heap usage
- **Memory Critical**: > 90% heap usage
- **Cache Miss Rate**: > 50% miss rate
- **Memory Leak**: > 5MB/check growth

## Best Practices

### Prevention
- **Regular Cleanup**: Automatic cache expiration
- **Size Limits**: Bounded cache and data structures
- **Monitoring**: Continuous memory tracking
- **Graceful Degradation**: Service continues with reduced functionality

### Response
- **Immediate**: Block new requests at 95% memory
- **Short-term**: Force GC and cache cleanup
- **Long-term**: Investigate and fix memory leaks
- **Recovery**: Automatic service restoration after cleanup