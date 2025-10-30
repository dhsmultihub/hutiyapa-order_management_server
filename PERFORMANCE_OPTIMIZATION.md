# Performance Optimization & Caching Guide

## Overview

This document provides a comprehensive guide to the performance optimization and caching strategies implemented in the Order Management System.

## Table of Contents

1. [Redis Caching](#redis-caching)
2. [Response Caching](#response-caching)
3. [Database Query Optimization](#database-query-optimization)
4. [Connection Pooling](#connection-pooling)
5. [Memory Management](#memory-management)
6. [Performance Monitoring](#performance-monitoring)
7. [Configuration](#configuration)
8. [Best Practices](#best-practices)

---

## Redis Caching

### Setup

The system uses Redis for distributed caching. Redis must be running and accessible.

```bash
# Start Redis locally
redis-server

# Or using Docker
docker run -d -p 6379:6379 redis:alpine
```

### Configuration

Add to your `.env` file:

```env
REDIS_URL=redis://localhost:6379
```

### CacheService API

```typescript
// Inject CacheService
constructor(private readonly cache: CacheService) {}

// Get cached data
const data = await this.cache.get<OrderType>('orders', orderId);

// Set cached data with TTL (in milliseconds)
await this.cache.set('orders', orderId, orderData, 60000); // 1 minute

// Delete cached data
await this.cache.del('orders', orderId);

// Delete by pattern
await this.cache.delByPattern('orders:*');

// Reset entire cache
await this.cache.reset();
```

### Cache Prefixes

Use consistent prefixes for different data types:
- `orders:` - Order data
- `users:` - User data
- `analytics:` - Analytics results
- `resp:` - API response cache

---

## Response Caching

### Using @CacheTtl Decorator

Apply caching to controller endpoints:

```typescript
import { CacheTtl } from '../common/decorators/cache-ttl.decorator';

@Get(':id')
@CacheTtl(60000) // Cache for 1 minute
async getOrder(@Param('id') id: string) {
  return this.orderService.findOne(id);
}
```

### Default TTL

If no `@CacheTtl` decorator is provided, the default TTL is **30 seconds**.

### Cache Headers

Responses include cache status headers:
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response generated fresh

### Selective Caching

Only `GET` requests are cached automatically. POST, PUT, DELETE requests bypass caching.

---

## Database Query Optimization

### QueryOptimizerService

Optimized query patterns to avoid N+1 queries and improve performance.

```typescript
// Inject QueryOptimizerService
constructor(private readonly queryOptimizer: QueryOptimizerService) {}

// Optimized order query with selective field loading
const { orders, total } = await this.queryOptimizer.findOrdersOptimized(
  { status: 'PENDING' },
  {
    page: 1,
    limit: 20,
    includeItems: true,
    includePayments: false,
    includeShipments: false,
  }
);

// Batch load to avoid N+1 queries
const orderMap = await this.queryOptimizer.batchLoadOrders(['1', '2', '3']);

// Efficient aggregates
const stats = await this.queryOptimizer.getOrderAggregates({ status: 'COMPLETED' });

// Cursor-based pagination for large datasets
const { orders, nextCursor, hasMore } = await this.queryOptimizer.findOrdersCursor(
  { status: 'PENDING' },
  cursor,
  20
);

// Get query statistics
const stats = this.queryOptimizer.getQueryStats();

// Analyze slow queries
const slowQueries = await this.queryOptimizer.analyzeQueryPerformance();

// Get index suggestions
const suggestions = await this.queryOptimizer.suggestIndexes();
```

### Query Performance Monitoring

All queries are monitored and logged:
- Queries slower than **200ms** are logged as warnings
- Query statistics are tracked (total, slow queries, average time)
- Enable with `PRISMA_LOG_QUERIES=true` in development

---

## Connection Pooling

### PostgreSQL Connection Pool

Configure connection pooling in your `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?connection_limit=10&pool_timeout=20"
```

### Recommended Settings

- **connection_limit**: 10 (default) - Maximum number of connections in the pool
- **pool_timeout**: 20 seconds - Time to wait for an available connection

### Production Tuning

For production environments:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?connection_limit=20&pool_timeout=30&connect_timeout=10"
```

---

## Memory Management

### PerformanceMonitorService

Monitors memory usage, CPU, and system metrics in real-time.

```typescript
// Inject PerformanceMonitorService
constructor(private readonly perfMonitor: PerformanceMonitorService) {}

// Get current metrics
const metrics = this.perfMonitor.getCurrentMetrics();

// Get memory statistics
const memStats = this.perfMonitor.getMemoryStats();

// Get system statistics
const sysStats = this.perfMonitor.getSystemStats();

// Get heap statistics
const heapStats = this.perfMonitor.getHeapStatistics();

// Force garbage collection (requires --expose-gc flag)
const success = this.perfMonitor.forceGarbageCollection();

// Get performance recommendations
const recommendations = this.perfMonitor.getRecommendations();
```

### Automatic Monitoring

Memory is monitored every **5 minutes** automatically:
- Warnings logged when heap usage exceeds **80%**
- Automatic garbage collection triggered at **90%** (if `--expose-gc` enabled)

### Running with Garbage Collection

To enable manual GC:
```bash
node --expose-gc dist/main.js
```

Or in package.json:
```json
{
  "scripts": {
    "start:prod": "node --expose-gc dist/main.js"
  }
}
```

---

## Performance Monitoring

### Available Endpoints

All endpoints require **ADMIN** role:

```
GET  /api/v1/performance/metrics/current     - Current performance metrics
GET  /api/v1/performance/metrics/history     - Metrics history (last 100 entries)
GET  /api/v1/performance/metrics/average     - Average metrics
GET  /api/v1/performance/memory              - Detailed memory statistics
GET  /api/v1/performance/system              - System statistics
GET  /api/v1/performance/recommendations     - Performance recommendations
POST /api/v1/performance/gc/force            - Force garbage collection
POST /api/v1/performance/metrics/clear       - Clear metrics history
```

### Response Compression

All responses are automatically compressed using gzip/deflate:
- Reduces bandwidth usage by 60-80%
- Improves response times for large payloads
- Enabled by default for all endpoints

### Request Performance Logging

All requests are logged with execution time:
```
⚡️ GET /api/v1/orders - 45ms
⚡️ POST /api/v1/orders - 123ms
```

---

## Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_URL=redis://localhost:6379

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/dbname?connection_limit=10&pool_timeout=20

# Query Logging
PRISMA_LOG_QUERIES=true              # Enable query logging (development only)
PRISMA_SLOW_QUERY_MS=200             # Threshold for slow query warnings (ms)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100          # Max requests per window

# CORS
CORS_ORIGIN=http://localhost:3000    # Comma-separated origins
CORS_CREDENTIALS=true

# Application
NODE_ENV=development
PORT=8001
API_PREFIX=api/v1
```

---

## Best Practices

### 1. Cache Strategy

- **Cache frequently accessed data** with appropriate TTL
- **Invalidate cache** when data is updated:
  ```typescript
  await this.cache.del('orders', orderId);
  await this.cache.delByPattern(`orders:${userId}:*`);
  ```
- Use **cache prefixes** consistently
- Avoid caching **sensitive data** (passwords, tokens)

### 2. Query Optimization

- Use **selective field loading** - only fetch needed relations
- Implement **cursor-based pagination** for large datasets
- Use **batch loading** to avoid N+1 queries
- Add **database indexes** on frequently queried fields
- Use **aggregations** instead of loading all records

### 3. Memory Management

- Monitor memory usage in production
- Enable **garbage collection** with `--expose-gc`
- Set appropriate **heap size** for Node.js:
  ```bash
  node --max-old-space-size=4096 dist/main.js
  ```
- Avoid memory leaks by **properly cleaning up** listeners and timers

### 4. Response Optimization

- Use **compression** for all responses (enabled by default)
- Implement **pagination** for list endpoints
- Return **partial data** when appropriate
- Use **HTTP caching headers** (ETag, Last-Modified)

### 5. Database Optimization

- Use **connection pooling** (configured by default)
- Implement **read replicas** for read-heavy workloads
- Use **database indexes** on foreign keys and frequently queried fields
- Monitor **slow queries** and optimize them

### 6. Monitoring & Alerting

- Monitor **memory usage** and set alerts at 80%
- Track **slow queries** and optimize them
- Monitor **cache hit rates** - target 70%+
- Track **response times** - target p95 < 500ms
- Set up **health checks** for Redis and PostgreSQL

---

## Performance Metrics

### Target Metrics

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Response Time (p95) | < 500ms | > 1000ms |
| Cache Hit Rate | > 70% | < 50% |
| Memory Usage | < 70% | > 85% |
| CPU Usage | < 60% | > 80% |
| Database Queries | < 10/request | > 20/request |
| Slow Queries | < 5% | > 10% |

### Measuring Performance

```typescript
// Query statistics
const queryStats = this.queryOptimizer.getQueryStats();
console.log(`Average query time: ${queryStats.averageQueryTime}ms`);
console.log(`Slow queries: ${queryStats.slowQueries} / ${queryStats.totalQueries}`);

// Performance metrics
const perfMetrics = this.perfMonitor.getCurrentMetrics();
console.log(`Heap usage: ${perfMetrics.memory.heapUsagePercent.toFixed(2)}%`);
console.log(`CPU usage: ${perfMetrics.system.cpuUsage.toFixed(2)}%`);
```

---

## Troubleshooting

### High Memory Usage

1. Check current memory usage:
   ```
   GET /api/v1/performance/memory
   ```

2. Force garbage collection:
   ```
   POST /api/v1/performance/gc/force
   ```

3. Review recommendations:
   ```
   GET /api/v1/performance/recommendations
   ```

4. Increase heap size if needed:
   ```bash
   node --max-old-space-size=4096 dist/main.js
   ```

### Slow Queries

1. Analyze slow queries:
   ```typescript
   const slowQueries = await this.queryOptimizer.analyzeQueryPerformance();
   ```

2. Get index suggestions:
   ```typescript
   const suggestions = await this.queryOptimizer.suggestIndexes();
   ```

3. Add indexes to database:
   ```sql
   CREATE INDEX idx_orders_status ON orders(status);
   CREATE INDEX idx_orders_user_id ON orders(user_id);
   CREATE INDEX idx_orders_created_at ON orders(created_at);
   ```

### Cache Issues

1. Check Redis connection:
   ```
   GET /api/v1/health
   ```

2. Clear cache if stale:
   ```typescript
   await this.cache.reset();
   ```

3. Monitor cache hit rates:
   ```typescript
   const stats = this.queryOptimizer.getQueryStats();
   console.log(`Cache hit rate: ${stats.cacheHitRate}%`);
   ```

### Rate Limiting

If rate limit is hit, adjust configuration:
```env
RATE_LIMIT_WINDOW_MS=900000          # 15 minutes
RATE_LIMIT_MAX_REQUESTS=200          # Increase limit
```

---

## Deployment Checklist

- [ ] Redis is running and accessible
- [ ] Database connection pooling is configured
- [ ] Environment variables are set correctly
- [ ] Garbage collection is enabled (`--expose-gc`)
- [ ] Heap size is configured appropriately
- [ ] Response compression is enabled (default)
- [ ] Rate limiting is configured
- [ ] Performance monitoring endpoints are secured
- [ ] Slow query logging is enabled
- [ ] Cache TTLs are appropriate for your use case
- [ ] Health checks are configured
- [ ] Alerts are set up for critical metrics

---

## Additional Resources

- [Redis Documentation](https://redis.io/documentation)
- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Node.js Memory Management](https://nodejs.org/en/docs/guides/simple-profiling/)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)

---

## Support

For issues or questions, refer to:
- Project README
- API Documentation (Swagger UI at `/api/docs`)
- Performance monitoring endpoints
- System logs

