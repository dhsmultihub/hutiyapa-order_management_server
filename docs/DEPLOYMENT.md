# Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Cloud Deployment](#cloud-deployment)
7. [Database Migrations](#database-migrations)
8. [Monitoring Setup](#monitoring-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 6.x (optional, for caching)
- Docker >= 20.x (for containerized deployment)
- Kubernetes >= 1.24 (for K8s deployment)

### Required Services
- PostgreSQL database (Neon, AWS RDS, or self-hosted)
- Redis (optional, for distributed caching)
- Auth Service (for JWT validation)
- Product Service (for inventory management)
- Cart Service (for order creation)

---

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd order-management-service
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create `.env` file from template:
```bash
cp env.example .env
```

**Required Variables:**
```env
# Application
NODE_ENV=production
PORT=8001
API_PREFIX=api/v1

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# JWT Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# CORS
CORS_ORIGIN=https://your-frontend.com
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Optional Variables:**
```env
# Redis Cache
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info

# Error Tracking
SENTRY_DSN=https://your-sentry-dsn

# External Services
AUTH_SERVICE_URL=https://auth-service.com
PRODUCT_SERVICE_URL=https://product-service.com
CART_SERVICE_URL=https://cart-service.com

# Performance
CACHE_TTL_MS=30000
PRISMA_SLOW_QUERY_MS=200
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

---

## Local Development

### Start Development Server
```bash
npm run start:dev
```

Server will be available at `http://localhost:8001`

### Development Features
- Hot reload enabled
- Swagger UI at `http://localhost:8001/api/docs`
- Health check at `http://localhost:8001/api/v1/health`

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

---

## Docker Deployment

### 1. Build Docker Image
```bash
docker build -t order-management-service:latest .
```

### 2. Run Container
```bash
docker run -d \
  --name order-management \
  -p 8001:8001 \
  --env-file .env \
  order-management-service:latest
```

### 3. Docker Compose
Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8001:8001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

Start services:
```bash
docker-compose up -d
```

---

## Kubernetes Deployment

### 1. Create Namespace
```bash
kubectl create namespace order-management
```

### 2. Create ConfigMap
```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: order-management-config
  namespace: order-management
data:
  NODE_ENV: "production"
  PORT: "8001"
  API_PREFIX: "api/v1"
  LOG_LEVEL: "info"
```

### 3. Create Secrets
```bash
kubectl create secret generic order-management-secrets \
  --from-literal=DATABASE_URL='your-database-url' \
  --from-literal=JWT_SECRET='your-jwt-secret' \
  --from-literal=SENTRY_DSN='your-sentry-dsn' \
  -n order-management
```

### 4. Deployment Manifest
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-management
  namespace: order-management
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-management
  template:
    metadata:
      labels:
        app: order-management
    spec:
      containers:
      - name: order-management
        image: order-management-service:latest
        ports:
        - containerPort: 8001
        envFrom:
        - configMapRef:
            name: order-management-config
        - secretRef:
            name: order-management-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/v1/health/live
            port: 8001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health/ready
            port: 8001
          initialDelaySeconds: 10
          periodSeconds: 5
```

### 5. Service Manifest
```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: order-management-service
  namespace: order-management
spec:
  selector:
    app: order-management
  ports:
  - port: 80
    targetPort: 8001
  type: LoadBalancer
```

### 6. Ingress (Optional)
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: order-management-ingress
  namespace: order-management
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.yourdomain.com
    secretName: order-management-tls
  rules:
  - host: api.yourdomain.com
    http:
      paths:
      - path: /api/v1
        pathType: Prefix
        backend:
          service:
            name: order-management-service
            port:
              number: 80
```

### 7. Deploy to Kubernetes
```bash
kubectl apply -f configmap.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
```

### 8. Verify Deployment
```bash
kubectl get pods -n order-management
kubectl get services -n order-management
kubectl logs -f deployment/order-management -n order-management
```

---

## Cloud Deployment

### AWS (ECS/Fargate)

1. **Create ECR Repository**
```bash
aws ecr create-repository --repository-name order-management-service
```

2. **Build and Push Image**
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker build -t order-management-service .
docker tag order-management-service:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/order-management-service:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/order-management-service:latest
```

3. **Create ECS Task Definition**
4. **Create ECS Service**
5. **Configure ALB**

### Google Cloud (Cloud Run)

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT-ID/order-management-service

# Deploy to Cloud Run
gcloud run deploy order-management-service \
  --image gcr.io/PROJECT-ID/order-management-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### Azure (Container Instances)

```bash
az container create \
  --resource-group myResourceGroup \
  --name order-management \
  --image order-management-service:latest \
  --cpu 2 --memory 4 \
  --ports 8001 \
  --environment-variables \
    NODE_ENV=production \
    DATABASE_URL=<database-url>
```

---

## Database Migrations

### Development
```bash
# Create migration
npm run db:migrate

# Deploy migrations
npm run db:migrate:deploy

# Reset database (caution!)
npm run db:reset
```

### Production
```bash
# Run migrations in production
DATABASE_URL=<production-url> npm run db:migrate:deploy
```

### Migration Strategy
1. Always test migrations in staging first
2. Backup database before migrations
3. Use transactions for data migrations
4. Plan for rollback strategy

---

## Monitoring Setup

### Prometheus
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'order-management'
    static_configs:
      - targets: ['order-management-service:8001']
    metrics_path: '/api/v1/monitoring/metrics'
    scrape_interval: 15s
```

### Grafana Dashboards
Import dashboard from `monitoring/grafana-dashboard.json`

### Sentry Setup
1. Create Sentry project
2. Get DSN
3. Set `SENTRY_DSN` environment variable

### Log Aggregation
Configure log shipping to:
- ELK Stack
- Datadog
- CloudWatch
- Google Cloud Logging

---

## SSL/TLS Configuration

### Let's Encrypt with Cert-Manager
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

---

## Scaling

### Horizontal Scaling
```bash
# Kubernetes
kubectl scale deployment/order-management --replicas=5 -n order-management

# Docker Swarm
docker service scale order-management=5
```

### Auto-scaling (K8s)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-management-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-management
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## Backup & Recovery

### Database Backups
```bash
# Automated backups with pg_dump
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore
psql $DATABASE_URL < backup-file.sql
```

### Disaster Recovery Plan
1. Regular automated backups
2. Off-site backup storage
3. Tested restore procedures
4. RTO: 1 hour
5. RPO: 15 minutes

---

## Security Checklist

- [ ] Enable HTTPS/TLS
- [ ] Set strong JWT secrets
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Use secrets management
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Database encryption
- [ ] Network policies
- [ ] WAF configuration

---

## Post-Deployment

### 1. Smoke Tests
```bash
# Health check
curl https://api.yourdomain.com/api/v1/health

# Readiness
curl https://api.yourdomain.com/api/v1/health/ready

# Metrics
curl https://api.yourdomain.com/api/v1/monitoring/metrics
```

### 2. Load Testing
```bash
node scripts/load-test.js
```

### 3. Monitor Dashboards
- Check Grafana dashboards
- Verify Prometheus scraping
- Review error rates in Sentry

### 4. Documentation
- Update runbook
- Document any custom configuration
- Update team wiki

---

## Rollback Procedure

### Kubernetes
```bash
# Rollback to previous revision
kubectl rollout undo deployment/order-management -n order-management

# Rollback to specific revision
kubectl rollout undo deployment/order-management --to-revision=2 -n order-management
```

### Docker
```bash
# Stop current version
docker stop order-management

# Start previous version
docker run -d --name order-management order-management-service:previous
```

---

## Support

**DevOps Team:** devops@hutiyapa.com  
**On-call:** +91-XXXX-XXXXXX  
**Slack:** #order-management-support

---

Last Updated: 2025-10-30  
Version: 1.0.0

