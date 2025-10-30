# Troubleshooting Guide

## Common Issues and Solutions

### Application Won't Start

#### Issue: Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::8001
```

**Solution:**
```bash
# Find process using port
lsof -i :8001  # Mac/Linux
netstat -ano | findstr :8001  # Windows

# Kill process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in .env
PORT=8002
```

#### Issue: Database Connection Failed
```
Error: Can't reach database server
```

**Solution:**
1. Check DATABASE_URL in .env
2. Verify database is running
3. Check network connectivity
4. Verify credentials

```bash
# Test database connection
psql $DATABASE_URL

# Check Prisma connection
npm run db:generate
```

#### Issue: Missing Environment Variables
```
Error: Config validation error
```

**Solution:**
```bash
# Check env file exists
ls -la .env

# Copy from example
cp env.example .env

# Validate required variables
npm run build
```

### Performance Issues

#### Issue: Slow API Responses
**Symptoms:**
- Response times > 1000ms
- Timeout errors
- High CPU usage

**Diagnosis:**
```bash
# Check system resources
top  # Linux/Mac
taskmgr  # Windows

# Check database slow queries
curl http://localhost:8001/api/v1/monitoring/metrics | grep http_request_duration

# Check memory usage
curl http://localhost:8001/api/v1/health
```

**Solutions:**
1. **Enable Redis caching**
```env
REDIS_URL=redis://localhost:6379
```

2. **Optimize database queries**
```bash
# Check slow queries in logs
tail -f logs/app.log | grep SLOW
```

3. **Increase resources**
- Scale horizontally (more instances)
- Scale vertically (more CPU/RAM)

#### Issue: High Memory Usage
**Symptoms:**
- Memory constantly increasing
- Application crashes
- Out of memory errors

**Diagnosis:**
```bash
# Check memory usage
curl http://localhost:8001/api/v1/performance/memory

# Monitor heap usage
node --inspect dist/main.js
```

**Solutions:**
1. **Enable garbage collection**
```bash
node --expose-gc dist/main.js
```

2. **Reduce cache size**
```env
CACHE_TTL_MS=15000  # Reduce from 30000
```

3. **Check for memory leaks**
```bash
npm run test:watch  # Monitor during tests
```

### Database Issues

#### Issue: Migration Failed
```
Error: Migration failed to apply
```

**Solution:**
```bash
# Rollback migration
npm run db:migrate -- --name rollback

# Reset database (development only!)
npm run db:reset

# Manually fix migration
# 1. Edit migration file in prisma/migrations/
# 2. Run migration again
npm run db:migrate:deploy
```

#### Issue: Connection Pool Exhausted
```
Error: Can't reach database server (connection pool exhausted)
```

**Solution:**
Update DATABASE_URL with pool settings:
```env
DATABASE_URL=postgresql://user:pass@host/db?connection_limit=10&pool_timeout=20
```

#### Issue: Slow Queries
**Diagnosis:**
```sql
-- Check slow queries in PostgreSQL
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solutions:**
1. Add indexes
2. Optimize queries
3. Use query optimizer service

### Authentication Issues

#### Issue: JWT Token Invalid
```
Error: 401 Unauthorized
```

**Solutions:**
1. **Check token format**
```
Authorization: Bearer <token>
```

2. **Verify JWT_SECRET matches Auth service**
```env
JWT_SECRET=same-secret-as-auth-service
```

3. **Check token expiration**
```bash
# Decode JWT (use jwt.io)
echo $TOKEN | base64 -d
```

#### Issue: CORS Errors
```
Error: CORS policy blocked
```

**Solution:**
```env
CORS_ORIGIN=https://your-frontend.com,http://localhost:3000
CORS_CREDENTIALS=true
```

### Redis/Cache Issues

#### Issue: Redis Connection Failed
```
Error: Redis connect deferred
```

**Solutions:**
1. **Check Redis is running**
```bash
redis-cli ping  # Should return PONG
```

2. **Verify REDIS_URL**
```env
REDIS_URL=redis://localhost:6379
```

3. **Fallback to in-memory cache**
- Service automatically falls back if Redis unavailable
- Check logs for "using in-memory cache"

### External Service Issues

#### Issue: Payment Gateway Timeout
```
Error: Payment processing timeout
```

**Solutions:**
1. **Check gateway status**
- Stripe: https://status.stripe.com
- Razorpay: https://status.razorpay.com

2. **Increase timeout**
```typescript
// Adjust timeout in gateway config
timeout: 30000  // 30 seconds
```

3. **Implement retry logic**
- Already implemented with exponential backoff
- Check retry attempts in logs

#### Issue: External Service Unavailable
```
Error: Auth service unavailable
```

**Diagnosis:**
```bash
# Check external service health
curl http://localhost:8001/api/v1/health | jq '.checks.external'
```

**Solutions:**
1. **Verify service URLs**
```env
AUTH_SERVICE_URL=https://auth-service.com
PRODUCT_SERVICE_URL=https://product-service.com
```

2. **Check network connectivity**
```bash
curl $AUTH_SERVICE_URL/health
```

3. **Implement circuit breaker** (already implemented)

### Monitoring Issues

#### Issue: Prometheus Not Scraping
**Diagnosis:**
```bash
# Check metrics endpoint
curl http://localhost:8001/api/v1/monitoring/metrics

# Check Prometheus targets
curl http://prometheus:9090/api/v1/targets
```

**Solutions:**
1. **Verify Prometheus config**
```yaml
scrape_configs:
  - job_name: 'order-management'
    static_configs:
      - targets: ['order-management:8001']
    metrics_path: '/api/v1/monitoring/metrics'
```

2. **Check network access**
```bash
# From Prometheus container
wget http://order-management:8001/api/v1/monitoring/metrics
```

#### Issue: Sentry Not Capturing Errors
**Solutions:**
1. **Verify SENTRY_DSN**
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

2. **Test error tracking**
```bash
# Trigger test error
curl -X POST http://localhost:8001/api/v1/test-error
```

3. **Check Sentry logs**
```bash
tail -f logs/app.log | grep Sentry
```

### Kubernetes Issues

#### Issue: Pod Failing Readiness Check
```
Warning  Unhealthy  probe failed: HTTP probe failed
```

**Diagnosis:**
```bash
# Check pod logs
kubectl logs pod-name -n order-management

# Check readiness endpoint
kubectl port-forward pod-name 8001:8001
curl http://localhost:8001/api/v1/health/ready
```

**Solutions:**
1. **Increase initialDelaySeconds**
```yaml
readinessProbe:
  initialDelaySeconds: 30  # Increase from 10
```

2. **Check dependencies**
- Database accessible?
- Redis accessible?
- External services reachable?

#### Issue: Pod OOMKilled
```
State: Terminated
Reason: OOMKilled
```

**Solutions:**
1. **Increase memory limits**
```yaml
resources:
  limits:
    memory: "2Gi"  # Increase from 1Gi
```

2. **Enable garbage collection**
```yaml
command: ["node", "--expose-gc", "dist/main.js"]
```

3. **Check memory leaks**

#### Issue: Service Not Accessible
**Diagnosis:**
```bash
# Check service
kubectl get svc -n order-management

# Check endpoints
kubectl get endpoints -n order-management

# Test from within cluster
kubectl run test --rm -it --image=busybox -- wget http://order-management-service
```

**Solutions:**
1. **Verify selector labels**
2. **Check network policies**
3. **Verify ingress configuration**

### Load Testing Issues

#### Issue: Load Test Fails
```
Error: ECONNREFUSED
```

**Solutions:**
1. **Check application is running**
```bash
curl http://localhost:8001/api/v1/health
```

2. **Reduce concurrent connections**
```bash
CONNECTIONS=5 node scripts/load-test.js
```

3. **Increase timeouts**

### Data Consistency Issues

#### Issue: Order Status Mismatch
**Diagnosis:**
```bash
# Check order in database
npm run db:studio

# Check order events
curl http://localhost:8001/api/v1/orders/:id
```

**Solutions:**
1. **Manual status correction**
```sql
UPDATE orders SET status = 'COMPLETED' WHERE id = 123;
```

2. **Run data reconciliation**
3. **Check event logs**

#### Issue: Payment Not Recorded
**Diagnosis:**
1. Check payment gateway logs
2. Check application logs
3. Check database

**Solutions:**
1. **Retry payment webhook**
2. **Manual payment reconciliation**
3. **Check gateway response logs**

## Diagnostic Commands

### Health Checks
```bash
# Overall health
curl http://localhost:8001/api/v1/health | jq

# Readiness
curl http://localhost:8001/api/v1/health/ready

# Liveness
curl http://localhost:8001/api/v1/health/live

# Business metrics
curl http://localhost:8001/api/v1/monitoring/business-metrics | jq
```

### Performance Metrics
```bash
# Prometheus metrics
curl http://localhost:8001/api/v1/monitoring/metrics

# Performance stats
curl http://localhost:8001/api/v1/performance/metrics/current | jq

# Memory stats
curl http://localhost:8001/api/v1/performance/memory | jq
```

### Logs
```bash
# Follow logs
tail -f logs/app.log

# Search for errors
grep ERROR logs/app.log

# Search by correlation ID
grep "correlation-id-123" logs/app.log

# Get last 100 lines
tail -n 100 logs/app.log
```

### Database
```bash
# Connect to database
psql $DATABASE_URL

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text))
FROM pg_tables WHERE schemaname = 'public';

# Check slow queries
SELECT query, calls, mean_exec_time FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;
```

## Getting Help

### Log Collection
```bash
# Collect all relevant logs
mkdir diagnostic-$(date +%Y%m%d)
cd diagnostic-$(date +%Y%m%d)

# Application logs
cp ../logs/app.log .

# System info
curl http://localhost:8001/api/v1/health > health.json
curl http://localhost:8001/api/v1/monitoring/metrics > metrics.txt

# Create archive
cd ..
tar -czf diagnostic-$(date +%Y%m%d).tar.gz diagnostic-$(date +%Y%m%d)
```

### Support Channels
- **Email:** support@hutiyapa.com
- **Slack:** #order-management-support
- **On-call:** +91-XXXX-XXXXXX
- **Documentation:** https://docs.hutiyapa.com

### Escalation Process
1. **Level 1:** Check this guide
2. **Level 2:** Check runbook
3. **Level 3:** Contact DevOps team
4. **Level 4:** Escalate to architecture team

## Prevention

### Monitoring Setup
- Set up alerts for critical metrics
- Monitor error rates
- Track performance metrics
- Review logs regularly

### Regular Maintenance
- Update dependencies monthly
- Review and optimize slow queries
- Clean up old data
- Test backup/restore procedures

### Documentation
- Keep runbooks updated
- Document all incidents
- Share learnings with team
- Update troubleshooting guide

---

**Last Updated:** 2025-10-30  
**Maintainer:** DevOps Team

