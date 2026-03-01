# Health Check & Monitoring System

## Overview
Comprehensive health monitoring system for load balancers, Kubernetes probes, and system monitoring with real-time metrics.

## Health Check Endpoints

### 1. Basic Health Check
```
GET /health
```
**Purpose**: Load balancer health checks
**Response**: 200 (healthy) or 503 (unhealthy)
```json
{
  "status": "healthy",
  "timestamp": "2024-01-23T12:00:00.000Z",
  "uptime": "3600s",
  "memory": {
    "used": "45MB",
    "total": "128MB",
    "external": "12MB"
  },
  "requests": {
    "total": 1250,
    "errors": 5,
    "errorRate": "0.40%"
  },
  "dependencies": [
    {"name": "filesystem", "status": "healthy"},
    {"name": "memory", "status": "healthy", "usage": "35%"}
  ]
}
```

### 2. Detailed Metrics
```
GET /health/metrics
```
**Purpose**: Monitoring systems (Prometheus, DataDog)
```json
{
  "status": "healthy",
  "process": {
    "pid": 12345,
    "nodeVersion": "v18.17.0"
  },
  "system": {
    "platform": "linux",
    "loadAvg": [0.5, 0.3, 0.2]
  },
  "cpu": {
    "user": 123456,
    "system": 78901
  }
}
```

### 3. Kubernetes Probes

#### Readiness Probe
```
GET /health/ready
```
**Purpose**: Kubernetes readiness check
**Response**: 200 (ready) or 503 (not ready)

#### Liveness Probe  
```
GET /health/live
```
**Purpose**: Kubernetes liveness check
**Response**: Always 200 if server is running

## Monitoring Features

### Request Tracking
- Total request count
- Error count and rate
- Response time tracking
- Performance headers (`X-Response-Time`)

### System Metrics
- Memory usage (heap, external)
- CPU usage (user, system)
- System load average
- Process information
- Uptime tracking

### Dependency Checks
- **Filesystem**: Write access to logs directory
- **Memory**: Heap usage under 90%
- **Custom**: Extensible for database, external APIs

## Load Balancer Integration

### AWS ALB/ELB
```yaml
HealthCheckPath: /health
HealthCheckIntervalSeconds: 30
HealthyThresholdCount: 2
UnhealthyThresholdCount: 3
```

### Nginx Upstream
```nginx
upstream backend {
    server app1:5001;
    server app2:5001;
}

location /health {
    access_log off;
    proxy_pass http://backend/health;
}
```

## Kubernetes Configuration

### Deployment with Probes
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: grindmap-backend
        livenessProbe:
          httpGet:
            path: /health/live
            port: 5001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 5001
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Monitoring Integration

### Prometheus Metrics
The `/health/metrics` endpoint provides data compatible with monitoring systems:
- Request rate and error rate
- Memory and CPU usage
- System load metrics
- Custom application metrics

### Alerting Thresholds
- **Memory Usage**: > 90% (Warning)
- **Error Rate**: > 5% (Critical)
- **Response Time**: > 5s (Warning)
- **Dependency Failure**: Any unhealthy (Critical)

## Security
- Health endpoints bypass rate limiting for load balancers
- No sensitive information exposed in health checks
- Monitoring data sanitized for security
- Access logging disabled for health endpoints