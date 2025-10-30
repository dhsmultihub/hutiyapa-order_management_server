# ✅ Port Configuration Updated

## 🔧 Changes Made

The Order Management backend server has been configured to run on **PORT 8000**.

### Configuration Updated:
```
PORT=8000  ✅ (changed from 8001)
```

---

## ⚠️ Important Notes

### If Port 8000 is Already in Use

If you have another service (like auth service) running on port 8000, you need to:

**Option 1: Stop the other service first**
```powershell
# Find what's running on port 8000
netstat -ano | findstr :8000

# Stop the process (replace <PID> with the actual process ID)
taskkill /PID <PID> /F
```

**Option 2: Run services on different ports**
- Auth Service: Port 8000
- Order Management Service: Port 8001 (revert to original)
- Frontend: Port 3000

---

## 🚀 Starting the Server on Port 8000

### Quick Start:
```bash
npm run start:dev
```

The server will now start on **http://localhost:8000**

---

## 📍 Updated URLs

| Purpose | URL |
|---------|-----|
| API Base | http://localhost:8000/api/v1 |
| Swagger Docs | http://localhost:8000/api/docs |
| Health Check | http://localhost:8000/api/v1/health |
| Metrics | http://localhost:8000/api/v1/monitoring/metrics |

---

## 🧪 Test the Server

Once started, test with:

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Get all orders
curl http://localhost:8000/api/v1/orders

# Open Swagger UI in browser
start http://localhost:8000/api/docs
```

---

## 🔄 To Revert Back to Port 8001

If you need to change back to port 8001:

```powershell
(Get-Content .env) -replace 'PORT=8000', 'PORT=8001' | Set-Content .env
```

---

## 📊 Current Configuration

```env
PORT=8000                    # Order Management Server
WEBSOCKET_PORT=8002         # WebSocket connections
PROMETHEUS_PORT=9090        # Prometheus metrics
DATABASE_URL=postgresql://... # Neon PostgreSQL
```

---

## 🎯 Next Steps

1. **If port 8000 is free:** 
   ```bash
   npm run start:dev
   ```
   ✅ Server starts on port 8000

2. **If port 8000 is in use:**
   - Stop the other service first
   - Or change this service back to port 8001

3. **Open Swagger Documentation:**
   ```
   http://localhost:8000/api/docs
   ```

---

## ✅ All Set!

Your Order Management backend is now configured to run on **port 8000** with all the dummy data ready to use!

**Start command:**
```bash
npm run start:dev
```

