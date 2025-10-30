# Monitoring & Health Checks - Implementation Guide

## Overview
Comprehensive monitoring, health checks, and observability implementation for the Order Management Service.

## Features Implemented

### 1. Health Checks
#### Database Health
- PostgreSQL connection status
- Query execution performance
- Connection pool health

#### Cache Health
- Redis/In-memory cache connectivity
- Cache operation performance

#### External Services Health
- Auth Service availability (optional)
- Product Service availability (optional)
- Cart Service availability (optional)

#### Order Processing Health
- Recent order volume tracking
- Stuck order detection (orders pending > 24 hours)
- Payment success rate monitoring
- Real-time health status: `healthy`, `degraded`, `unhealthy`

### 2. Metrics Collection

#### Prometheus Metrics Endpoint
**Endpoint**: `GET /api/v1/monitoring/metrics`

**Default Metrics Collected**:
- Node.js process metrics (CPU, memory, event loop)
- HTTP request duration histogram
- Order processing counters (by status)
- Payment processing counters (by status and method)

**Custom Business Metrics**:
- `orders_total{status}` - Total orders by status
- `payments_total{status,method}` - Total payments by status and method
- `http_request_duration_ms{method,route,status_code}` - HTTP latency histogram

#### Business Metrics API
**Endpoint**: `GET /api/v1/monitoring/business-metrics`

Returns real-time business metrics:
```json
{
  "orders": {
    "total": 1000,
    "pending": 50,
    "completed": 900,
    "failed": 50
  },
  "payments": {
    "total": 1000,
    "successful": 950,
    "failed": 50
  },
  "shipments": {
    "total": 900,
    "delivered": 850,
    "inTransit": 50
  }
}
```

### 3. Structured Logging

#### Winston JSON Logging
- Structured JSON log format
- Log levels: error, warn, info, debug
- Correlation IDs for request tracking
- Configurable log level via `LOG_LEVEL` environment variable

#### Correlation IDs
Every request gets a unique correlation ID:
- Header: `X-Correlation-Id`
- Automatically generated or passed from upstream
- Tracked across all logs for the request

#### Audit Logging
Dedicated audit logger for critical business events:
```typescript
auditService.record('ORDER_CREATED', { orderId, userId, amount });
auditService.record('PAYMENT_PROCESSED', { paymentId, orderId, status });
```

### 4. Alerting System

#### Alert Types
- **Critical**: System failures, data corruption, payment failures
- **Warning**: Performance degradation, stuck orders, external service issues
- **Info**: General information and notifications

#### Alert Channels (Hooks for Integration)
- Slack (placeholder)
- PagerDuty (placeholder)
- Email (placeholder)
- Webhook (placeholder)

Example usage:
```typescript
await alertingService.alertCritical('Payment Gateway Failure', {
  gateway: 'stripe',
  errorCount: 10,
  affectedOrders: ['ORD-001', 'ORD-002']
});
```

### 5. Error Tracking

#### Sentry Integration (Optional)
Configure via `SENTRY_DSN` environment variable.

Features:
- Automatic exception capture for 5xx errors
- Request context tracking
- User tracking
- Breadcrumbs for debugging
- Environment and version tracking

## API Endpoints

### Health Endpoints

#### General Health Check
```
GET /api/v1/health
```
Returns overall system health including:
- Database status
- Cache status
- Order processing health
- External services status
- System information (memory, CPU, uptime)

Response:
```json
{
  "status": "healthy",
  "name": "Order Management Service",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600.5,
  "timestamp": "2025-10-30T10:00:00.000Z",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": "5ms"
    },
    "cache": {
      "status": "healthy"
    },
    "orderProcessing": {
      "status": "healthy",
      "recentOrders": 150,
      "stuckOrders": 2,
      "paymentSuccessRate": 98.5
    },
    "external": {
      "auth": { "status": "healthy", "latencyMs": 50 },
      "product": { "status": "healthy", "latencyMs": 45 },
      "cart": { "status": "healthy", "latencyMs": 40 }
    }
  },
  "system": {
    "memory": { "rss": 100000000, "heapTotal": 50000000 },
    "cpu": { "user": 1000, "system": 500 },
    "platform": "linux",
    "nodeVersion": "v20.0.0"
  },
  "responseTime": "15ms"
}
```

#### Readiness Probe
```
GET /api/v1/health/ready
```
Kubernetes-ready readiness probe. Checks:
- Database connectivity
- Cache availability
- External service availability

Returns 200 if ready, 503 if not ready.

#### Liveness Probe
```
GET /api/v1/health/live
```
Kubernetes-ready liveness probe. Simple check if app is alive.

Always returns 200 unless the app is completely dead.

### Monitoring Endpoints

#### Prometheus Metrics
```
GET /api/v1/monitoring/metrics
```
Returns Prometheus-formatted metrics for scraping.

#### Business Metrics
```
GET /api/v1/monitoring/business-metrics
```
Returns JSON business metrics summary.

#### Order Processing Health
```
GET /api/v1/monitoring/order-processing-health
```
Detailed order processing health status.

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development, production, test)

### Optional Monitoring Configuration
- `REDIS_URL` - Redis connection string for distributed caching
- `LOG_LEVEL` - Logging level (error, warn, info, debug) - default: info
- `SENTRY_DSN` - Sentry DSN for error tracking
- `AUTH_SERVICE_URL` - Auth service URL for health checks
- `PRODUCT_SERVICE_URL` - Product service URL for health checks
- `CART_SERVICE_URL` - Cart service URL for health checks

## Kubernetes Configuration

### Liveness Probe
```yaml
livenessProbe:
  httpGet:
    path: /api/v1/health/live
    port: 8001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

### Readiness Probe
```yaml
readinessProbe:
  httpGet:
    path: /api/v1/health/ready
    port: 8001
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

### Prometheus Scraping
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/path: "/api/v1/monitoring/metrics"
  prometheus.io/port: "8001"
```

## Integration Examples

### Prometheus Configuration
```yaml
scrape_configs:
  - job_name: 'order-management'
    static_configs:
      - targets: ['order-management:8001']
    metrics_path: '/api/v1/monitoring/metrics'
    scrape_interval: 15s
```

### Grafana Dashboard Queries

#### Request Rate
```promql
rate(http_request_duration_ms_count[5m])
```

#### Request Latency (p95)
```promql
histogram_quantile(0.95, rate(http_request_duration_ms_bucket[5m]))
```

#### Order Processing Rate
```promql
rate(orders_total[5m])
```

#### Payment Success Rate
```promql
rate(payments_total{status="COMPLETED"}[5m]) / rate(payments_total[5m])
```

## Alert Rules Example

### Prometheus Alert Rules
```yaml
groups:
  - name: order_management_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_request_duration_ms_count{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"

      - alert: OrderProcessingStuck
        expr: order_processing_stuck_orders > 10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Multiple orders stuck in pending state"

      - alert: LowPaymentSuccessRate
        expr: payment_success_rate < 90
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Payment success rate below 90%"
```

## Logging Best Practices

### Using the Logger Service
```typescript
import { LoggingService } from './logging/logging.service';

@Injectable()
export class OrderService {
  constructor(private readonly logger: LoggingService) {}

  async createOrder(data) {
    this.logger.info('Creating order', { userId: data.userId, items: data.items.length });
    
    try {
      const order = await this.orderRepository.create(data);
      this.logger.info('Order created successfully', { orderId: order.id });
      return order;
    } catch (error) {
      this.logger.error('Failed to create order', { error: error.message, userId: data.userId });
      throw error;
    }
  }
}
```

### Using the Audit Logger
```typescript
import { AuditService } from './logging/audit.service';

await auditService.record('ORDER_CREATED', {
  orderId: order.id,
  userId: user.id,
  totalAmount: order.totalAmount,
  timestamp: new Date().toISOString()
});
```

## Performance Considerations

1. **Health Checks**: Lightweight checks with caching
2. **Metrics Collection**: Minimal overhead with Prometheus client
3. **Logging**: Asynchronous logging with structured format
4. **Error Tracking**: Only captures 5xx errors to reduce noise

## Security Considerations

1. **Metrics Endpoint**: Can be made public or protected based on needs
2. **Health Endpoints**: Exposed for monitoring but don't leak sensitive data
3. **Error Tracking**: Sanitizes sensitive data before sending to Sentry
4. **Correlation IDs**: Don't include sensitive user information

## Troubleshooting

### High Memory Usage
Check: `GET /api/v1/health` - system.memory section

### Stuck Orders
Check: `GET /api/v1/monitoring/order-processing-health`

### Payment Failures
Check: `GET /api/v1/monitoring/business-metrics` - payments section

### External Service Issues
Check: `GET /api/v1/health` - checks.external section

## Next Steps

1. **Set up Grafana Dashboards** for visualizing metrics
2. **Configure Alert Rules** in Prometheus/AlertManager
3. **Integrate Slack/PagerDuty** for real-time alerts
4. **Set up Sentry** for production error tracking
5. **Configure Log Aggregation** (ELK, Datadog, etc.)
6. **Add Distributed Tracing** (Jaeger, Zipkin) - Optional

## Files Created

### Monitoring Module
- `src/monitoring/monitoring.module.ts` - Module definition
- `src/monitoring/metrics.service.ts` - Prometheus metrics
- `src/monitoring/http-metrics.interceptor.ts` - HTTP metrics collection
- `src/monitoring/alerting.service.ts` - Alert system
- `src/monitoring/external-health.service.ts` - External service health checks
- `src/monitoring/order-health.service.ts` - Order processing health
- `src/monitoring/error-tracking.service.ts` - Sentry integration
- `src/monitoring/monitoring.controller.ts` - Monitoring API endpoints

### Logging Module
- `src/logging/logging.service.ts` - Winston structured logging
- `src/logging/correlation.interceptor.ts` - Correlation ID middleware
- `src/logging/audit.service.ts` - Audit logging

### Types
- `src/types/monitoring.types.ts` - TypeScript types for monitoring

## Support
For issues or questions, refer to the main README or contact the DevOps team.

