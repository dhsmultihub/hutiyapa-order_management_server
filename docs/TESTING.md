# Testing Documentation

## Overview
Comprehensive testing suite for the Order Management Service covering unit tests, integration tests, E2E tests, and load testing.

## Test Structure

```
hutiyapa-order_management_server/
├── src/
│   ├── **/*.spec.ts         # Unit tests (co-located with source)
│   └── **/*.service.spec.ts # Service unit tests
├── test/
│   ├── setup.ts              # Test setup and utilities
│   ├── jest-e2e.json         # E2E test configuration
│   └── *.e2e-spec.ts         # E2E tests
└── scripts/
    └── load-test.js          # Load testing script
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Debug tests
npm run test:debug
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# With specific configuration
npm run test:e2e -- --config=test/jest-e2e.json
```

### Load Tests
```bash
# Run load tests
npm run load-test

# With custom parameters
CONNECTIONS=50 DURATION=60 npm run load-test
```

## Unit Testing

### Test Structure
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let dependency: DependencyMock;

  beforeEach(async () => {
    // Setup test module
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      const input = { ... };
      mockDependency.method.mockResolvedValue(expected);

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toEqual(expected);
      expect(mockDependency.method).toHaveBeenCalledWith(input);
    });
  });
});
```

### Example: Order Service Tests
```typescript
// src/order/order.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  describe('findOne', () => {
    it('should return an order', async () => {
      const result = await service.findOne(BigInt(1));
      expect(result).toBeDefined();
      expect(result.id).toEqual(BigInt(1));
    });

    it('should throw NotFoundException if order not found', async () => {
      await expect(service.findOne(BigInt(999))).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Mocking Best Practices

#### Mock Prisma Service
```typescript
const mockPrismaService = {
  order: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};
```

#### Mock External Services
```typescript
const mockPaymentGateway = {
  processPayment: jest.fn().mockResolvedValue({
    status: 'success',
    transactionId: 'txn_123',
  }),
};
```

## Integration Testing

### Database Integration Tests
```typescript
describe('Order Database Integration', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create and retrieve an order', async () => {
    const order = await prisma.order.create({
      data: mockOrderData,
    });

    const retrieved = await prisma.order.findUnique({
      where: { id: order.id },
    });

    expect(retrieved).toEqual(order);
  });
});
```

### API Integration Tests
```typescript
describe('Order API Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/orders (POST) creates an order', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders')
      .send(mockOrderData)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('orderNumber');
      });
  });
});
```

## E2E Testing

### E2E Test Example
```typescript
// test/order.e2e-spec.ts
describe('Order Management (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // Setup application
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Get auth token (mock or from auth service)
    authToken = 'Bearer test-token';
  });

  describe('Complete Order Flow', () => {
    let orderId: string;

    it('should create an order', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', authToken)
        .send(mockOrderData)
        .expect(201);

      orderId = response.body.id;
      expect(orderId).toBeDefined();
    });

    it('should retrieve the order', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.id).toEqual(orderId);
    });

    it('should process payment', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', authToken)
        .send({
          orderId,
          paymentMethod: 'CREDIT_CARD',
          amount: 1000,
        })
        .expect(201);
    });
  });
});
```

### Test Data Fixtures
```typescript
// test/setup.ts
export const createMockOrder = () => ({
  orderNumber: `ORD-${Date.now()}`,
  userId: BigInt(1),
  status: 'PENDING',
  items: [
    {
      productId: '1',
      sku: 'SKU-001',
      name: 'Test Product',
      quantity: 2,
      unitPrice: 500,
    },
  ],
  shippingAddress: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'IN',
  },
  billingAddress: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'IN',
  },
});
```

## Load Testing

### Running Load Tests
```bash
# Default configuration (30s, 10 connections)
npm run load-test

# Custom configuration
API_URL=https://api.hutiyapa.com \
DURATION=60 \
CONNECTIONS=50 \
PIPELINING=10 \
npm run load-test
```

### Interpreting Results
```
📊 Results for Health Check Endpoint:
   Requests: 45000
   Throughput: 2500000 bytes
   Latency:
     Average: 15ms
     P50: 10ms
     P95: 25ms
     P99: 40ms
   Errors: 0
   Timeouts: 0
```

**Good Performance:**
- P95 latency < 200ms
- P99 latency < 500ms
- Error rate < 0.1%
- Throughput > 1000 req/sec

### Custom Load Tests
```javascript
// scripts/custom-load-test.js
const autocannon = require('autocannon');

async function run() {
  const result = await autocannon({
    url: 'http://localhost:8001/api/v1/orders',
    connections: 50,
    duration: 30,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    body: JSON.stringify({
      // Order data
    }),
  });

  console.log(result);
}

run();
```

## Test Coverage

### Coverage Goals
- **Overall**: 80%+
- **Critical Services**: 90%+
- **Controllers**: 70%+
- **Utilities**: 90%+

### Viewing Coverage
```bash
# Generate coverage report
npm run test:cov

# Open HTML report
open coverage/lcov-report/index.html  # Mac
xdg-open coverage/lcov-report/index.html  # Linux
start coverage\\lcov-report\\index.html  # Windows
```

### Coverage Configuration
```json
// package.json
{
  "jest": {
    "collectCoverageFrom": [
      "**/*.(t|j)s",
      "!**/*.spec.ts",
      "!**/*.e2e-spec.ts",
      "!**/node_modules/**",
      "!**/dist/**",
      "!**/coverage/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## Continuous Integration

### GitHub Actions Workflow
Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests

Workflow includes:
1. Lint and type checking
2. Unit tests
3. E2E tests
4. Security scanning
5. Build Docker image
6. Deploy to staging/production

## Testing Best Practices

### 1. Test Organization
- Co-locate unit tests with source files
- Keep E2E tests in separate `test` directory
- Use descriptive test names
- Group related tests with `describe` blocks

### 2. Test Independence
- Each test should be independent
- Don't rely on test execution order
- Clean up test data after each test
- Use `beforeEach` and `afterEach` hooks

### 3. Mocking
- Mock external dependencies
- Use real database for integration tests
- Mock time-dependent operations
- Avoid over-mocking

### 4. Assertions
- Use specific assertions
- Test both success and error cases
- Verify side effects
- Check error messages

### 5. Test Data
- Use factories for test data
- Keep test data realistic
- Use unique identifiers
- Clean up after tests

## Debugging Tests

### Debug Single Test
```bash
# Run single test file
npm run test -- order.service.spec.ts

# Run single test by name
npm run test -- -t "should create an order"

# Debug mode
npm run test:debug
```

### VS Code Debug Configuration
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--config",
    "jest.config.js"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Performance Testing

### Benchmarking
```typescript
describe('Performance', () => {
  it('should handle 1000 orders in < 10s', async () => {
    const start = Date.now();
    
    const promises = Array.from({ length: 1000 }, () => 
      service.create(mockOrderData)
    );
    
    await Promise.all(promises);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(10000);
  });
});
```

### Memory Leak Detection
```bash
# Run tests with --detect-leaks
npm run test -- --detect-leaks

# Use --expose-gc for garbage collection
node --expose-gc node_modules/.bin/jest
```

## Test Automation

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run test",
      "pre-push": "npm run test:e2e"
    }
  }
}
```

### Test Reports
- HTML coverage reports in `coverage/`
- JUnit XML reports for CI/CD
- JSON reports for custom tooling

## Troubleshooting

### Common Issues

#### Tests Timeout
```typescript
// Increase timeout
jest.setTimeout(30000);

// Or for specific test
it('long running test', async () => {
  // ...
}, 30000);
```

#### Database Connection Issues
```bash
# Check DATABASE_URL
echo $DATABASE_URL

# Run migrations
npm run db:migrate:deploy

# Reset database
npm run db:reset
```

#### Mock Not Working
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Reset mocks completely
beforeEach(() => {
  jest.resetAllMocks();
});
```

## Resources

### Documentation
- Jest: https://jestjs.io/
- Testing Library: https://testing-library.com/
- Supertest: https://github.com/visionmedia/supertest
- Autocannon: https://github.com/mcollina/autocannon

### Examples
- See `src/**/*.spec.ts` for unit test examples
- See `test/**/*.e2e-spec.ts` for E2E examples
- See `scripts/load-test.js` for load testing example

---

**Last Updated:** 2025-10-30  
**Maintainer:** QA Team

