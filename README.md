# Order Management Microservice

A comprehensive order management microservice built with NestJS, PostgreSQL, and Prisma ORM.

## 🚀 Features

- **Order Management**: Complete order lifecycle management
- **Payment Processing**: Multiple payment gateway integration
- **Shipment Tracking**: Real-time shipment tracking
- **Returns & Refunds**: Comprehensive return and refund management
- **Analytics**: Order analytics and reporting
- **Real-time Updates**: WebSocket-based real-time notifications
- **Health Monitoring**: Comprehensive health checks and monitoring

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Redis (optional, for caching)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hutiyapa-order_management_server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # Seed the database (optional)
   npm run db:seed
   ```

## 🚀 Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## 📊 Database Schema

The application uses PostgreSQL with the following main entities:

- **Orders**: Core order information
- **Order Items**: Individual items within orders
- **Payments**: Payment transactions
- **Shipments**: Shipping and tracking information
- **Returns**: Return requests and processing
- **Refunds**: Refund transactions

## 🔧 API Documentation

Once the application is running, you can access:

- **Swagger UI**: `http://localhost:8001/api/docs`
- **Health Check**: `http://localhost:8001/api/v1/health`
- **API Base URL**: `http://localhost:8001/api/v1`

## 📁 Project Structure

```
src/
├── app.module.ts              # Main application module
├── main.ts                    # Application entry point
├── database/                  # Database configuration
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── order/                     # Order management
│   ├── order.module.ts
│   ├── order.controller.ts
│   └── order.service.ts
├── payment/                   # Payment processing
├── shipment/                  # Shipment tracking
├── return/                    # Return management
├── refund/                    # Refund processing
├── analytics/                 # Analytics and reporting
├── health/                    # Health monitoring
├── auth/                      # Authentication
├── notification/              # Notifications
├── cache/                     # Caching
├── logging/                   # Logging
├── websocket/                 # Real-time updates
├── common/                    # Shared utilities
│   ├── filters/
│   ├── interceptors/
│   └── pipes/
├── models/                    # Data models
│   ├── order.model.ts
│   ├── order-item.model.ts
│   ├── payment.model.ts
│   ├── shipment.model.ts
│   └── refund.model.ts
└── types/                     # TypeScript types
    └── order.types.ts
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Available Scripts

- `npm run build` - Build the application
- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start in production mode
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run e2e tests
- `npm run test:cov` - Run test coverage
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## 🔒 Environment Variables

Key environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT secret key
- `AUTH_SERVICE_URL` - Auth service URL
- `PRODUCT_SERVICE_URL` - Product service URL
- `CART_SERVICE_URL` - Cart service URL
- `REDIS_URL` - Redis connection string (optional)

See `env.example` for all available configuration options.

## 🏗️ Architecture

The application follows a modular architecture with:

- **Controllers**: Handle HTTP requests
- **Services**: Business logic implementation
- **Models**: Data models with business logic
- **Types**: TypeScript type definitions
- **Database**: Prisma ORM with PostgreSQL
- **Validation**: Class-validator for input validation
- **Documentation**: Swagger/OpenAPI documentation

## 🚦 Health Checks

- **Liveness**: `GET /api/v1/health/live`
- **Readiness**: `GET /api/v1/health/ready`
- **Health**: `GET /api/v1/health`

## 📈 Monitoring

The application includes:

- Request/response logging
- Error tracking
- Performance monitoring
- Health checks
- Database connectivity monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Status**: 🚧 In Development - Task 1 (Database Integration & Schema Design) Completed
