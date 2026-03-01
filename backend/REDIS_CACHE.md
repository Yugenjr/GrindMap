# Redis Caching Implementation

## Overview

GrindMap now includes a comprehensive Redis caching layer that significantly improves API response times and reduces database load. The caching system is designed to be robust, configurable, and fault-tolerant.

## Features

✅ **Multi-Platform Caching**: Caches data for all supported platforms (LeetCode, CodeForces, CodeChef, AtCoder, GitHub, SkillRack)  
✅ **Configurable TTL**: Platform data cached for 15 minutes, user data for 5 minutes  
✅ **Cache Hit/Miss Metrics**: Real-time monitoring of cache performance  
✅ **Graceful Degradation**: API continues to work even when Redis is unavailable  
✅ **Cache Invalidation**: Manual and automatic cache invalidation on data updates  
✅ **Health Monitoring**: Dedicated endpoints for cache health and statistics  

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Cache Configuration
CACHE_ENABLED=true
CACHE_PLATFORM_TTL=900  # 15 minutes
CACHE_USER_TTL=300      # 5 minutes
```

### Default Values

- **Platform Cache TTL**: 900 seconds (15 minutes)
- **User Cache TTL**: 300 seconds (5 minutes)
- **Cache Enabled**: true (can be disabled by setting `CACHE_ENABLED=false`)

## API Endpoints

### Cache Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/cache/stats` | GET | Get cache statistics (hits, misses, hit rate) |
| `/api/cache/health` | GET | Get cache health status and configuration |
| `/api/cache/reset-stats` | POST | Reset cache statistics |
| `/api/cache/platform/:platform/:username` | DELETE | Invalidate specific platform cache |
| `/api/cache/user/:username` | DELETE | Invalidate all caches for a user |
| `/api/cache/all` | DELETE | Clear all cache data |

### Cached Endpoints

All scraping endpoints now include caching:

- `/api/scrape/leetcode/:username` - 15min cache
- `/api/scrape/codeforces/:username` - 15min cache  
- `/api/scrape/codechef/:username` - 15min cache
- `/api/scrape/atcoder/:username` - 15min cache
- `/api/scrape/github/:username` - 15min cache
- `/api/scrape/skillrack/:username` - 15min cache

## Cache Headers

Responses include cache information in headers:

```http
X-Cache: HIT|MISS
X-Cache-Key: platform:LEETCODE:username
```

## Performance Improvements

### Expected Performance Gains

- **API Response Time**: 60% reduction for cached requests
- **Database Load**: Significant reduction in scraping operations
- **User Experience**: Near-instantaneous responses for cached data

### Cache Statistics Example

```json
{
  "success": true,
  "data": {
    "hits": 150,
    "misses": 50,
    "errors": 2,
    "hitRate": "75.00%",
    "total": 200,
    "isConnected": true
  }
}
```

## Testing

### Run Cache Tests

```bash
# Test Redis connection and functionality
npm run test:cache
```

### Manual Testing

```bash
# 1. Get cache health
curl http://localhost:5000/api/cache/health

# 2. Test platform endpoint (first call - cache miss)
curl http://localhost:5000/api/scrape/leetcode/testuser

# 3. Test same endpoint again (should be cache hit)
curl http://localhost:5000/api/scrape/leetcode/testuser

# 4. Check cache statistics
curl http://localhost:5000/api/cache/stats
```

## Cache Key Format

The caching system uses a consistent key format:

- **Platform Data**: `platform:{PLATFORM}:{username}`
- **User Data**: `user:{username}`
- **API Responses**: `api:{METHOD}:{URL}`

Examples:
- `platform:LEETCODE:john_doe`
- `platform:CODEFORCES:jane_smith`
- `user:john_doe`

## Error Handling

### Redis Unavailable

When Redis is unavailable:
- API continues to function normally
- No caching occurs (graceful degradation)
- Logs warnings but doesn't break functionality
- Cache headers show `X-Cache: MISS`

### Cache Errors

- Failed cache operations are logged but don't affect API responses
- Automatic retry logic for transient Redis errors
- Cache statistics track error counts

## Monitoring

### Health Check

```bash
GET /api/cache/health
```

Response includes:
- Redis connection status
- Cache hit rate
- Configuration details
- Performance metrics

### Statistics

```bash
GET /api/cache/stats
```

Provides real-time cache performance data:
- Total requests
- Cache hits/misses
- Hit rate percentage
- Error count

## Cache Invalidation

### Automatic Invalidation

Cache is automatically invalidated when:
- Data is updated through the API
- TTL expires naturally

### Manual Invalidation

```bash
# Invalidate specific platform
DELETE /api/cache/platform/LEETCODE/username

# Invalidate all user data
DELETE /api/cache/user/username

# Clear all cache
DELETE /api/cache/all
```

## Best Practices

1. **Monitor Hit Rate**: Aim for >70% cache hit rate
2. **Adjust TTL**: Modify TTL based on data freshness requirements
3. **Regular Monitoring**: Check cache health regularly
4. **Graceful Degradation**: Ensure API works without Redis
5. **Cache Warming**: Pre-populate cache for frequently accessed data

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server is running
   - Verify `REDIS_URL` in environment variables
   - Check network connectivity

2. **Low Hit Rate**
   - Check if TTL is too short
   - Verify cache keys are consistent
   - Monitor for frequent cache invalidation

3. **High Memory Usage**
   - Monitor Redis memory usage
   - Consider reducing TTL values
   - Implement cache size limits if needed

### Debug Commands

```bash
# Check Redis connection
redis-cli ping

# Monitor Redis operations
redis-cli monitor

# Check memory usage
redis-cli info memory

# List all keys
redis-cli keys "*"
```

## Implementation Details

### Cache Middleware

The caching system uses Express middleware that:
1. Checks cache before processing requests
2. Stores successful responses in cache
3. Adds cache headers to responses
4. Tracks performance metrics

### Redis Client

- Uses `ioredis` for robust Redis connectivity
- Includes automatic reconnection logic
- Handles connection failures gracefully
- Supports Redis Cluster (if needed)

## Future Enhancements

- [ ] Cache warming strategies
- [ ] Distributed cache invalidation
- [ ] Cache compression for large responses
- [ ] Advanced cache analytics
- [ ] Cache partitioning by user/region

---

**Note**: This caching implementation provides significant performance improvements while maintaining system reliability and fault tolerance.