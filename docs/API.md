# Order Management API Documentation

## Base URL
```
http://localhost:8001/api/v1
```

## Authentication
All endpoints (except health/metrics) require JWT Bearer token authentication.

```http
Authorization: Bearer <your_jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ...data... },
  "message": "Success message"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "timestamp": "2025-10-30T10:00:00.000Z",
  "path": "/api/v1/orders",
  "method": "POST",
  "error": "Bad Request",
  "message": "Validation error message"
}
```

---

## Orders

### Create Order
Create a new order from cart data.

**Endpoint:** `POST /orders`

**Request Body:**
```json
{
  "userId": 1,
  "items": [
    {
      "productId": "prod_123",
      "sku": "SKU-001",
      "name": "Product Name",
      "quantity": 2,
      "unitPrice": 500
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "MH",
    "zipCode": "400001",
    "country": "IN"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "MH",
    "zipCode": "400001",
    "country": "IN"
  },
  "notes": "Optional order notes"
}
```

**Response:** `201 Created`
```json
{
  "id": "1",
  "orderNumber": "ORD-2025-001",
  "userId": 1,
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "fulfillmentStatus": "UNFULFILLED",
  "totalAmount": 1000,
  "subtotal": 900,
  "taxAmount": 50,
  "shippingAmount": 50,
  "discountAmount": 0,
  "currency": "INR",
  "createdAt": "2025-10-30T10:00:00.000Z",
  "items": [...]
}
```

### Get All Orders
Retrieve paginated list of orders.

**Endpoint:** `GET /orders`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `status` (string, optional): PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, COMPLETED, CANCELLED
- `paymentStatus` (string, optional): PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED
- `userId` (number, optional)
- `startDate` (ISO date, optional)
- `endDate` (ISO date, optional)

**Response:** `200 OK`
```json
{
  "data": [...orders...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Get Order by ID
Retrieve a specific order with all details.

**Endpoint:** `GET /orders/:id`

**Response:** `200 OK`
```json
{
  "id": "1",
  "orderNumber": "ORD-2025-001",
  "userId": 1,
  "status": "PENDING",
  "items": [...],
  "payments": [...],
  "shipments": [...],
  "returns": [...]
}
```

### Update Order
Update order information.

**Endpoint:** `PUT /orders/:id`

**Request Body:**
```json
{
  "notes": "Updated notes"
}
```

**Response:** `200 OK`

### Update Order Status
Update order status with validation.

**Endpoint:** `PUT /orders/:id/status`

**Request Body:**
```json
{
  "status": "CONFIRMED",
  "reason": "Optional reason for status change"
}
```

**Response:** `200 OK`

### Cancel Order
Cancel an order (soft delete).

**Endpoint:** `DELETE /orders/:id`

**Response:** `200 OK`

---

## Payments

### Create Payment
Process a payment for an order.

**Endpoint:** `POST /payments`

**Request Body:**
```json
{
  "orderId": 1,
  "paymentMethod": "CREDIT_CARD",
  "paymentGateway": "stripe",
  "amount": 1000,
  "currency": "INR",
  "paymentDetails": {
    "cardNumber": "****1234",
    "cardholderName": "John Doe"
  }
}
```

**Response:** `201 Created`

### Get Payments for Order
Get all payments for a specific order.

**Endpoint:** `GET /payments?orderId=1`

**Response:** `200 OK`

### Get Payment by ID
**Endpoint:** `GET /payments/:id`

**Response:** `200 OK`

### Verify Payment
Verify payment with gateway.

**Endpoint:** `POST /payments/:id/verify`

**Request Body:**
```json
{
  "transactionId": "txn_123"
}
```

**Response:** `200 OK`

---

## Refunds

### Create Refund
Process a refund for a payment.

**Endpoint:** `POST /refunds`

**Request Body:**
```json
{
  "paymentId": 1,
  "amount": 500,
  "reason": "Customer requested refund"
}
```

**Response:** `201 Created`

### Get Refunds for Order
**Endpoint:** `GET /refunds?orderId=1`

**Response:** `200 OK`

---

## Shipments

### Create Shipment
Create a shipment for an order.

**Endpoint:** `POST /shipments`

**Request Body:**
```json
{
  "orderId": 1,
  "carrier": "FedEx",
  "serviceType": "STANDARD",
  "estimatedDelivery": "2025-11-05T00:00:00.000Z"
}
```

**Response:** `201 Created`

### Get Shipments for Order
**Endpoint:** `GET /shipments?orderId=1`

**Response:** `200 OK`

### Update Tracking
**Endpoint:** `POST /shipments/:id/tracking`

**Request Body:**
```json
{
  "status": "IN_TRANSIT",
  "location": "Mumbai Hub",
  "timestamp": "2025-10-30T10:00:00.000Z"
}
```

**Response:** `200 OK`

### Confirm Delivery
**Endpoint:** `POST /shipments/:id/deliver`

**Response:** `200 OK`

---

## Returns

### Create Return Request
**Endpoint:** `POST /returns`

**Request Body:**
```json
{
  "orderId": 1,
  "reason": "DEFECTIVE",
  "notes": "Product arrived damaged"
}
```

**Response:** `201 Created`

### Get Returns for Order
**Endpoint:** `GET /returns?orderId=1`

**Response:** `200 OK`

### Approve Return
**Endpoint:** `POST /returns/:id/approve`

**Response:** `200 OK`

---

## Support

### Create Support Ticket
**Endpoint:** `POST /support/tickets`

**Request Body:**
```json
{
  "orderId": 1,
  "subject": "Order issue",
  "description": "Detailed description",
  "priority": "HIGH"
}
```

**Response:** `201 Created`

### Get Support Tickets
**Endpoint:** `GET /support/tickets`

**Response:** `200 OK`

### Update Ticket
**Endpoint:** `PUT /support/tickets/:id`

**Response:** `200 OK`

---

## Analytics

### Get Order Metrics
**Endpoint:** `GET /analytics/orders`

**Query Parameters:**
- `startDate` (ISO date)
- `endDate` (ISO date)
- `groupBy` (day|week|month)

**Response:** `200 OK`

### Get Revenue Analytics
**Endpoint:** `GET /analytics/revenue`

**Response:** `200 OK`

### Generate Report
**Endpoint:** `POST /analytics/reports`

**Request Body:**
```json
{
  "reportType": "SALES",
  "startDate": "2025-10-01",
  "endDate": "2025-10-31",
  "format": "PDF"
}
```

**Response:** `201 Created`

---

## Health & Monitoring

### Health Check
Get overall system health.

**Endpoint:** `GET /health`

**Authentication:** Not required

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "name": "Order Management Service",
  "version": "1.0.0",
  "uptime": 3600.5,
  "checks": {
    "database": { "status": "healthy" },
    "cache": { "status": "healthy" },
    "orderProcessing": { "status": "healthy" },
    "external": {...}
  }
}
```

### Readiness Probe
Kubernetes readiness check.

**Endpoint:** `GET /health/ready`

**Authentication:** Not required

**Response:** `200 OK` or `503 Service Unavailable`

### Liveness Probe
Kubernetes liveness check.

**Endpoint:** `GET /health/live`

**Authentication:** Not required

**Response:** `200 OK`

### Prometheus Metrics
Get Prometheus metrics.

**Endpoint:** `GET /monitoring/metrics`

**Authentication:** Not required

**Response:** `200 OK` (text/plain)

### Business Metrics
Get business metrics summary.

**Endpoint:** `GET /monitoring/business-metrics`

**Response:** `200 OK`
```json
{
  "orders": {
    "total": 1000,
    "pending": 50,
    "completed": 900,
    "failed": 50
  },
  "payments": {...},
  "shipments": {...}
}
```

---

## WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:8001', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

### Events

#### order:created
Emitted when a new order is created.
```json
{
  "orderId": "1",
  "orderNumber": "ORD-2025-001",
  "status": "PENDING"
}
```

#### order:updated
Emitted when an order is updated.

#### order:status-changed
Emitted when order status changes.

#### payment:completed
Emitted when payment is successful.

#### shipment:updated
Emitted when shipment status changes.

---

## Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Missing or invalid auth
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service unavailable

---

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Headers:**
  - `X-RateLimit-Limit`: Maximum requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## Pagination

All list endpoints support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes:
```json
{
  "data": [...],
  "total": 1000,
  "page": 1,
  "limit": 10,
  "totalPages": 100
}
```

---

## Filtering & Sorting

### Filtering
Use query parameters for filtering:
```
GET /orders?status=PENDING&userId=1
```

### Sorting
Use `sortBy` and `sortOrder`:
```
GET /orders?sortBy=createdAt&sortOrder=desc
```

---

## Error Handling

### Validation Errors
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "userId must be a number",
    "items should not be empty"
  ]
}
```

### Not Found
```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Order with ID 999 not found"
}
```

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Handle rate limiting** with exponential backoff
3. **Use correlation IDs** from `X-Correlation-Id` header for debugging
4. **Implement retries** for transient errors (5xx)
5. **Validate input** on client side before API calls
6. **Monitor API health** using health endpoints

---

## Support

For API support, contact: support@hutiyapa.com

API Documentation Version: 1.0.0
Last Updated: 2025-10-30

