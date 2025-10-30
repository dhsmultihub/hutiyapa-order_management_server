# Architecture Documentation

## System Overview

The Order Management Service is an enterprise-grade microservice built with NestJS, PostgreSQL, and Redis, designed to handle complete order lifecycle management for e-commerce platforms.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway / Load Balancer              │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼────┐          ┌────▼────┐         ┌────▼────┐
    │  Auth   │          │ Product │         │  Cart   │
    │ Service │          │ Service │         │ Service │
    └─────────┘          └─────────┘         └─────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                                         │
    ┌────▼──────────────────────────────┐    ┌────▼────┐
    │   Order Management Service        │◄───┤ Redis   │
    │   (NestJS + TypeScript)           │    │ Cache   │
    └────┬──────────────────────────────┘    └─────────┘
         │
    ┌────▼────┐
    │PostgreSQL│
    │ Database │
    └─────────┘
```

## Technology Stack

### Core Framework
- **NestJS 10.x**: Modern TypeScript framework
- **Node.js 18.x**: Runtime environment
- **TypeScript 5.x**: Type safety and developer experience

### Database & ORM
- **PostgreSQL 14+**: Primary database
- **Prisma 5.x**: Type-safe ORM
- **Redis 6+**: Distributed caching (optional)

### Authentication & Security
- **Passport.js**: Authentication middleware
- **JWT**: Token-based authentication
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling

### Monitoring & Observability
- **Prometheus**: Metrics collection
- **Winston**: Structured logging
- **Sentry**: Error tracking (optional)

### Communication
- **Socket.IO**: WebSocket real-time updates
- **REST API**: HTTP/JSON API

## Module Architecture

### Core Modules

#### 1. Order Module
**Responsibility**: Order lifecycle management

**Sub-modules:**
- `order.controller.ts`: REST API endpoints
- `order.service.ts`: Business logic orchestration
- `order.module.ts`: Module configuration

**Lifecycle Services:**
- `order-state-machine.service.ts`: Status transitions
- `order-processor.service.ts`: Order processing pipeline
- `order-validator.service.ts`: Validation rules

**Operation Services:**
- `order-creator.service.ts`: Order creation
- `order-updater.service.ts`: Order updates
- `order-canceller.service.ts`: Order cancellation

#### 2. Payment Module
**Responsibility**: Payment processing

**Components:**
- Payment gateways (Razorpay, Stripe, PayPal)
- Payment processor
- Refund processor
- Payment validator

#### 3. Shipment Module
**Responsibility**: Fulfillment and shipping

**Components:**
- Carrier integrations (FedEx, DHL, Blue Dart)
- Fulfillment service
- Tracking service
- Delivery service

#### 4. Support Module
**Responsibility**: Customer service

**Components:**
- Ticket management
- Return management
- Communication service
- Analytics service

### Infrastructure Modules

#### 5. Monitoring Module
**Components:**
- Metrics collection (Prometheus)
- Health checks (DB, Cache, External services)
- Order processing health
- Error tracking
- Alerting system

#### 6. Analytics Module
**Components:**
- Order analytics
- Reporting service
- Dashboard service
- Business intelligence

#### 7. Logging Module
**Components:**
- Structured logging (Winston)
- Correlation IDs
- Audit logging

### Supporting Modules

#### 8. Cache Module
- Redis integration
- In-memory fallback
- Cache strategies

#### 9. Database Module
- Prisma service
- Query optimizer
- Transaction management

#### 10. Events Module
- Order events
- Event emitters
- WebSocket gateway

#### 11. Notification Module
- Email notifications
- SMS notifications
- Push notifications
- Notification preferences

#### 12. Search Module
- Full-text search
- Advanced filtering
- Query builder
- Search indexing

## Data Flow

### Order Creation Flow

```
1. Client Request
   │
   ▼
2. API Gateway (Authentication)
   │
   ▼
3. Order Controller
   │
   ▼
4. Order Validator
   │
   ▼
5. Order Creator Service
   │
   ├─► Inventory Check (Product Service)
   ├─► Price Calculation
   ├─► Order Number Generation
   │
   ▼
6. Prisma Service (Database)
   │
   ▼
7. Order Events Service
   │
   ├─► WebSocket Notification
   ├─► Email Notification
   │
   ▼
8. Response to Client
```

### Payment Processing Flow

```
1. Payment Request
   │
   ▼
2. Payment Controller
   │
   ▼
3. Payment Processor
   │
   ├─► Gateway Selection
   ├─► Payment Validation
   │
   ▼
4. Payment Gateway (Stripe/Razorpay/PayPal)
   │
   ▼
5. Gateway Response
   │
   ▼
6. Update Payment Status
   │
   ▼
7. Update Order Status
   │
   ▼
8. Send Notification
```

## Database Schema

### Core Tables

#### orders
- Primary order information
- Status tracking
- Address information
- Pricing details

#### order_items
- Individual items in order
- Product references
- Quantity and pricing

#### payments
- Payment transactions
- Gateway information
- Transaction IDs

#### shipments
- Shipping information
- Carrier details
- Tracking numbers

#### returns
- Return requests
- Return status
- Refund information

#### refunds
- Refund transactions
- Refund status

### Indexes
Strategic indexes for:
- order_number lookups
- user_id queries
- status filtering
- date range queries

## Design Patterns

### 1. Repository Pattern
Prisma service acts as repository, abstracting database operations.

### 2. Service Layer Pattern
Business logic separated into dedicated service classes.

### 3. Dependency Injection
NestJS DI container manages dependencies.

### 4. Factory Pattern
Payment gateways use factory pattern for selection.

### 5. State Machine Pattern
Order status transitions managed by state machine.

### 6. Observer Pattern
Event-driven architecture for notifications.

### 7. Strategy Pattern
Different payment gateways implemented as strategies.

### 8. Interceptor Pattern
Cross-cutting concerns (logging, caching, metrics).

## Security Architecture

### Authentication Flow
```
1. Client → Auth Service (Login)
2. Auth Service → JWT Token
3. Client → Order Service (Token in header)
4. JWT Guard → Validate Token
5. Roles Guard → Check Permissions
6. Controller → Process Request
```

### Security Layers
1. **Network**: HTTPS/TLS, Firewall
2. **Application**: JWT, RBAC, Rate limiting
3. **Data**: Encryption at rest, Input validation
4. **Infrastructure**: K8s Network Policies, Secrets

## Scalability

### Horizontal Scaling
- Stateless application design
- Load balancer distribution
- Session-less architecture

### Caching Strategy
- **L1**: In-memory cache (per instance)
- **L2**: Redis distributed cache
- **TTL**: Configurable per endpoint

### Database Optimization
- Connection pooling
- Query optimization
- Selective field loading
- Cursor-based pagination

### Performance Targets
- **Response Time**: < 200ms (p95)
- **Throughput**: 10,000+ req/sec
- **Concurrent Users**: 100,000+
- **Uptime**: 99.9%

## Monitoring Architecture

### Metrics Collection
```
Application Metrics (Prometheus)
         │
         ▼
  Prometheus Server
         │
         ▼
    Grafana Dashboard
```

### Logging Pipeline
```
Application Logs (Winston)
         │
         ▼
    JSON Structured
         │
         ▼
   Log Aggregator (ELK/Datadog)
         │
         ▼
      Dashboards
```

### Health Checks
- **Liveness**: Is app alive?
- **Readiness**: Can app serve traffic?
- **Dependency Health**: DB, Cache, External services

## Error Handling

### Error Flow
```
Error Occurs
     │
     ▼
Exception Filter
     │
     ├─► Log Error
     ├─► Track in Sentry
     ├─► Send Alert (if critical)
     │
     ▼
Formatted Response
```

### Error Categories
1. **4xx**: Client errors (validation, not found)
2. **5xx**: Server errors (internal, gateway errors)
3. **Critical**: Payment failures, data corruption
4. **Warning**: Performance degradation, external service issues

## Deployment Architecture

### Development
- Local Node.js server
- Local PostgreSQL
- Hot reload enabled

### Staging
- Docker containers
- Staging database
- Realistic data

### Production
- Kubernetes cluster
- Multiple replicas
- Auto-scaling
- Load balancing
- CDN integration

## Integration Points

### External Services

#### 1. Auth Service
- JWT token validation
- User information
- Role management

#### 2. Product Service
- Inventory check
- Product information
- Pricing data

#### 3. Cart Service
- Cart data for order creation
- Cart cleanup after order

#### 4. Payment Gateways
- Razorpay
- Stripe
- PayPal

#### 5. Shipping Carriers
- FedEx
- DHL
- Blue Dart

## Future Enhancements

### Phase 1 (Completed)
- ✅ Core order management
- ✅ Payment processing
- ✅ Fulfillment tracking
- ✅ Real-time updates
- ✅ Monitoring & health checks

### Phase 2 (Planned)
- [ ] GraphQL API
- [ ] Advanced analytics with ML
- [ ] Fraud detection
- [ ] Multi-currency support
- [ ] International shipping

### Phase 3 (Planned)
- [ ] Multi-tenant architecture
- [ ] Advanced inventory management
- [ ] Subscription orders
- [ ] Marketplace integration

## Performance Optimization

### Applied Optimizations
1. **Connection Pooling**: Database connections
2. **Query Optimization**: Selective field loading
3. **Caching**: Redis + In-memory
4. **Compression**: Gzip/deflate responses
5. **Pagination**: Cursor-based for large datasets
6. **Indexing**: Strategic database indexes

### Monitoring Performance
- Response time tracking
- Slow query detection
- Memory usage monitoring
- CPU profiling

## Testing Strategy

### Unit Tests
- Service layer
- Controllers
- Utilities
- **Target**: 80%+ coverage

### Integration Tests
- Database operations
- External API calls
- End-to-end flows

### E2E Tests
- Complete user journeys
- API contract testing

### Load Tests
- Concurrent user simulation
- Performance benchmarking
- Scalability validation

## Documentation

### API Documentation
- Swagger/OpenAPI spec
- Interactive API docs
- Code examples

### Developer Documentation
- Setup guides
- Architecture diagrams
- Code comments

### Operations Documentation
- Deployment guides
- Runbooks
- Troubleshooting guides

---

**Architect:** Hutiyapa Team  
**Last Updated:** 2025-10-30  
**Version:** 1.0.0

