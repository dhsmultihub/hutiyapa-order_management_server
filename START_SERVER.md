# 🚀 Quick Start Guide - Order Management Server

## ✅ Database Setup Complete

The database has been successfully set up with:
- ✅ Schema created (6 tables with all relationships)
- ✅ Dummy data seeded (5 orders, 2 returns, 1 refund)
- ✅ Prisma client generated

---

## 🎯 Starting the Server

### Option 1: Simple Start (Recommended)

1. Open a terminal/PowerShell in this directory:
```bash
cd D:\HUTIYAPA\ordermanagement-hutiyapa\hutiyapa-order_management_server
```

2. Make sure you have the `.env` file (already created ✅)

3. Start the server:
```bash
npm run start:dev
```

The server will automatically load the `.env` file and start on **port 8001**

---

### Option 2: With Environment Variable (Alternative)

If you need to set the DATABASE_URL manually:

```powershell
$env:DATABASE_URL="postgresql://neondb_owner:npg_UkBtG9i4SwcN@ep-lingering-grass-a1z1dhav-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connection_limit=10&pool_timeout=20"
npm run start:dev
```

---

## 🌐 Server Information

Once started, you'll see:
```
🚀 Order Management Service is running on port 8001
🌍 Environment: development
📊 API Base URL: http://localhost:8001/api/v1
🔍 Health Check: http://localhost:8001/api/v1/health
📚 Swagger documentation available at http://localhost:8001/api/docs
📈 Metrics: http://localhost:8001/api/v1/monitoring/metrics
```

---

## 📍 Port Configuration

- **Port 8000** → Auth Service (different service)
- **Port 8001** → Order Management Service (this service) ⭐
- **Port 3000** → Frontend (if applicable)

---

## 🔍 Testing the API

### 1. Check Health Status
```bash
curl http://localhost:8001/api/v1/health
```

### 2. View API Documentation
Open in browser:
```
http://localhost:8001/api/docs
```

### 3. Test Endpoints (Examples)

**Get All Orders:**
```bash
curl http://localhost:8001/api/v1/orders
```

**Get Specific Order:**
```bash
curl http://localhost:8001/api/v1/orders/1
```

**Get Analytics:**
```bash
curl http://localhost:8001/api/v1/analytics/orders/metrics
```

---

## 🎯 Accessing Dummy Data

The database now contains:

### Orders (5)
- ORD-2024-001 (COMPLETED, DELIVERED) - John Doe, ₹2,999
- ORD-2024-002 (PROCESSING) - Jane Smith, ₹1,599
- ORD-2024-003 (CANCELLED) - Bob Johnson, ₹899
- ORD-2024-004 (SHIPPED) - Alice Brown, ₹2,299
- ORD-2024-005 (CONFIRMED) - Charlie Wilson, ₹1,799

### Test via API:
```bash
# Get all orders
GET http://localhost:8001/api/v1/orders

# Get orders with filtering
GET http://localhost:8001/api/v1/orders?status=COMPLETED
GET http://localhost:8001/api/v1/orders?userId=1

# Get order details
GET http://localhost:8001/api/v1/orders/1
```

---

## 📊 View Data in Prisma Studio

Open a database GUI to view/edit data:

```bash
npm run db:studio
```

This opens: `http://localhost:5555`

---

## ⚠️ Common Issues

### Issue: Port 8001 already in use
**Solution:**
```bash
# Find and stop the process using port 8001
netstat -ano | findstr :8001
taskkill /PID <process_id> /F
```

### Issue: DATABASE_URL not found
**Solution:** Make sure the `.env` file exists in the root directory (already created ✅)

### Issue: Prisma Client errors
**Solution:**
```bash
npm run db:generate
```

---

## 🛠️ Useful Commands

```bash
# Start development server
npm run start:dev

# Start production server
npm run build
npm run start:prod

# View database in GUI
npm run db:studio

# Re-seed database (reset and add fresh data)
npm run db:seed

# Check database schema
npx prisma db pull

# Generate Prisma client
npm run db:generate
```

---

## 📚 Next Steps

1. ✅ Database setup complete
2. ✅ Dummy data seeded
3. ⏭️ Start the server: `npm run start:dev`
4. ⏭️ Open Swagger docs: http://localhost:8001/api/docs
5. ⏭️ Test API endpoints with dummy data
6. ⏭️ Integrate with frontend

---

**Ready to start! Run `npm run start:dev` to launch the server.**

