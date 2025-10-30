# Database Setup & Dummy Data Summary

## ✅ Database Setup Complete!

The database has been successfully set up with schema and dummy data.

---

## 📊 Database Structure

The PostgreSQL database includes the following tables:

### 1. **Orders** (`orders`)
- Order management with complete lifecycle tracking
- Fields: order_number, user_id, status, payment_status, fulfillment_status, amounts, addresses, timestamps
- Statuses: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED

### 2. **Order Items** (`order_items`)
- Individual items within each order
- Fields: product_id, variant_id, sku, name, quantity, prices, tax_rate, metadata

### 3. **Payments** (`payments`)
- Payment transactions with gateway integration
- Fields: payment_method, payment_gateway, transaction_id, amount, status, gateway_response
- Statuses: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED

### 4. **Shipments** (`shipments`)
- Shipping and tracking information
- Fields: tracking_number, carrier, service_type, status, timestamps, tracking_url
- Statuses: PENDING, SHIPPED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, FAILED, RETURNED

### 5. **Returns** (`returns`)
- Return requests and processing
- Fields: return_number, reason, status, refund_amount, notes, timestamps
- Statuses: PENDING, APPROVED, REJECTED, PROCESSED, CANCELLED

### 6. **Refunds** (`refunds`)
- Refund transactions
- Fields: order_id, payment_id, amount, reason, status, processed_at
- Statuses: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED

---

## 🎯 Seeded Dummy Data

### Orders (5 total)

#### 1. **ORD-2024-001** (COMPLETED)
- User ID: 1
- Customer: John Doe (Mumbai, Maharashtra)
- Total: ₹2,999.00
- Status: COMPLETED, DELIVERED
- Items:
  - 2x Premium Cotton T-Shirt (Red, M) - ₹999.00 each
  - 1x Classic Blue Jeans (Blue, L) - ₹1,999.00
- Payment: Credit Card (Razorpay) - COMPLETED
- Shipment: Blue Dart (BD1234567890) - DELIVERED
- Special: Has a return and refund for T-shirt

#### 2. **ORD-2024-002** (PROCESSING)
- User ID: 2
- Customer: Jane Smith (Delhi)
- Total: ₹1,599.00
- Status: PROCESSING, UNFULFILLED
- Items:
  - 1x Comfortable Hoodie (Black, S) - ₹1,299.00
- Payment: UPI (Razorpay) - COMPLETED
- Special: Gift wrapping requested, pending return

#### 3. **ORD-2024-003** (CANCELLED)
- User ID: 3
- Customer: Bob Johnson (Bangalore, Karnataka)
- Total: ₹899.00
- Status: CANCELLED
- Items:
  - 1x Baseball Cap (White, M) - ₹749.00
- Payment: Net Banking (HDFC) - CANCELLED
- Note: Customer requested cancellation

#### 4. **ORD-2024-004** (SHIPPED)
- User ID: 4
- Customer: Alice Brown (Chennai, Tamil Nadu)
- Total: ₹2,299.00
- Status: SHIPPED, FULFILLED
- Items:
  - 1x Winter Jacket (Green, L) - ₹1,999.00
- Payment: Wallet (Paytm) - COMPLETED
- Shipment: FedEx (FD9876543210) - IN_TRANSIT

#### 5. **ORD-2024-005** (CONFIRMED)
- User ID: 5
- Customer: Charlie Wilson (Kolkata, West Bengal)
- Total: ₹1,799.00
- Status: CONFIRMED, UNFULFILLED
- Items:
  - 1x Wool Sweater (Purple, M) - ₹1,499.00
- Payment: Debit Card (Razorpay) - PROCESSING

### Returns (2 total)
- **RET-2024-001**: Order ORD-2024-001, Product defect, APPROVED, ₹999.00 refund
- **RET-2024-002**: Order ORD-2024-002, Wrong size, PENDING

### Refunds (1 total)
- **Refund #1**: Order ORD-2024-001, ₹999.00, COMPLETED

---

## 🚀 Starting the Backend Server

### 1. Navigate to the server directory:
```bash
cd D:\HUTIYAPA\ordermanagement-hutiyapa\hutiyapa-order_management_server
```

### 2. Set the DATABASE_URL environment variable:
```powershell
$env:DATABASE_URL="postgresql://neondb_owner:npg_UkBtG9i4SwcN@ep-lingering-grass-a1z1dhav-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=10&pool_timeout=20"
```

### 3. Start the development server:
```bash
npm run start:dev
```

The server will start on **port 8001**

---

## 📚 API Documentation & Endpoints

### Base URL
```
http://localhost:8001/api/v1
```

### Swagger Documentation
```
http://localhost:8001/api/docs
```

### Key Endpoints

#### Orders
- `GET /api/v1/orders` - Get all orders (with filtering & pagination)
- `GET /api/v1/orders/:id` - Get order by ID
- `POST /api/v1/orders` - Create new order
- `PUT /api/v1/orders/:id` - Update order
- `DELETE /api/v1/orders/:id` - Delete order
- `GET /api/v1/orders/user/:userId` - Get orders by user ID
- `PATCH /api/v1/orders/:id/status` - Update order status

#### Payments
- `GET /api/v1/payments` - Get all payments
- `GET /api/v1/payments/:id` - Get payment by ID
- `POST /api/v1/payments` - Process payment
- `GET /api/v1/payments/order/:orderId` - Get payments by order

#### Shipments
- `GET /api/v1/shipments` - Get all shipments
- `GET /api/v1/shipments/:id` - Get shipment by ID
- `POST /api/v1/shipments` - Create shipment
- `PUT /api/v1/shipments/:id` - Update shipment
- `GET /api/v1/shipments/track/:trackingNumber` - Track shipment

#### Returns
- `GET /api/v1/returns` - Get all returns
- `GET /api/v1/returns/:id` - Get return by ID
- `POST /api/v1/returns` - Create return request
- `PATCH /api/v1/returns/:id/status` - Update return status

#### Refunds
- `GET /api/v1/refunds` - Get all refunds
- `GET /api/v1/refunds/:id` - Get refund by ID
- `POST /api/v1/refunds` - Process refund

#### Analytics
- `GET /api/v1/analytics/orders/metrics` - Get order metrics
- `GET /api/v1/analytics/revenue/metrics` - Get revenue metrics
- `GET /api/v1/analytics/orders/trends` - Get order trends
- `GET /api/v1/analytics/customers/metrics` - Get customer metrics

#### Health & Monitoring
- `GET /api/v1/health` - Health check
- `GET /api/v1/health/live` - Liveness check
- `GET /api/v1/health/ready` - Readiness check
- `GET /api/v1/monitoring/metrics` - Get metrics
- `GET /api/v1/monitoring/business-metrics` - Get business metrics

---

## 🔐 Authentication

Most endpoints require JWT authentication. Add the Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

For testing, you can use the Swagger UI which has built-in authentication support.

---

## 🧪 Testing the APIs

### Example: Get All Orders
```bash
curl http://localhost:8001/api/v1/orders \
  -H "Authorization: Bearer <token>"
```

### Example: Get Order by ID
```bash
curl http://localhost:8001/api/v1/orders/1 \
  -H "Authorization: Bearer <token>"
```

### Example: Get Orders by User
```bash
curl http://localhost:8001/api/v1/orders/user/1 \
  -H "Authorization: Bearer <token>"
```

---

## 📊 Database Access

### Using Prisma Studio (GUI)
```bash
npm run db:studio
```

This will open a web-based database GUI at `http://localhost:5555`

### Using PostgreSQL Client
```bash
psql "postgresql://neondb_owner:npg_UkBtG9i4SwcN@ep-lingering-grass-a1z1dhav-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

---

## 📝 Notes

1. **Environment Variables**: The `.env` file has been created with the database configuration
2. **Authentication**: Most endpoints require JWT authentication. You'll need to implement authentication or use a test token
3. **CORS**: Configured to allow requests from `http://localhost:3000`
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **Swagger**: Full API documentation available at `/api/docs` when server is running

---

## 🎉 Next Steps

1. Start the backend server: `npm run start:dev`
2. Open Swagger UI: `http://localhost:8001/api/docs`
3. Explore the API endpoints with the seeded data
4. Test the endpoints using Swagger's "Try it out" feature
5. View data in Prisma Studio: `npm run db:studio`

---

**Status**: ✅ Database setup complete and seeded with dummy data!
**Created**: October 30, 2025

