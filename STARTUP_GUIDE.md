# 🚀 Payoova 2.0 - Startup Guide

## ✅ Issues Fixed

All critical connectivity and API issues have been resolved:

### **Backend Fixes:**
- ✅ Added missing `/wallet/list` endpoint in `wallet_simple.py`
- ✅ Added missing `/wallet/refresh-balances` endpoint
- ✅ Added missing `/wallet/send` and `/wallet/estimate-gas` endpoints
- ✅ Fixed all utility modules (security.py, crypto_utils.py, rate_limiter.py)
- ✅ Blockchain service is working with mock data when Web3 not available
- ✅ WebSocket service is properly configured
- ✅ Database initialization script created and tested
- ✅ Rate limiting system working with in-memory fallback

### **Frontend Fixes:**
- ✅ Fixed API URL configuration in AuthContext and WalletContext
- ✅ Updated all fetch calls to use proper environment variables
- ✅ API calls now correctly use `VITE_API_URL` or fallback to `http://localhost:5000/api`

## 🏃‍♂️ How to Start the Application

### **Step 1: Start Backend Server**
```bash
cd backend
python src/main.py
```
**Expected Output:**
```
Server initialized for threading.
[INFO] Using in-memory rate limiting
* Serving Flask app 'main'
* Debug mode: on
* Running on http://0.0.0.0:5000
```

### **Step 2: Start Frontend Development Server**
```bash
# In a new terminal, from project root
npm run dev
```
**Expected Output:**
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### **Step 3: Access the Application**
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## 🔐 Default Admin Credentials
- **Email:** admin@payoova.com
- **Password:** admin123
- ⚠️ **Change this password in production!**

## 🌐 Environment Configuration

The application is configured to work with your existing `.env` file. Key variables:

```env
# Frontend API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_API_BASE=http://localhost:5000

# Backend Configuration
NODE_ENV=development
PORT=5000
DEBUG=true

# Database (SQLite for development)
DATABASE_URL=sqlite:///payoova.db

# Your existing API keys will work as configured
```

## 🔧 Blockchain Configuration

The application now works in **two modes**:

### **Development Mode (Current)**
- Uses mock blockchain data when Web3 libraries aren't available
- All wallet operations return simulated responses
- Perfect for testing UI/UX without real blockchain calls

### **Production Mode (When you add APIs)**
- Uncomment Web3 dependencies in `backend/requirements.txt`
- Install: `pip install web3==6.15.1 eth-account==0.10.0 eth-keys==0.4.0`
- Your RPC URLs from `.env` will be used for real blockchain interactions

## 🧪 Testing the Connection

1. **Backend Health Check:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return: `{"status": "healthy", ...}`

2. **Frontend-Backend Connection:**
   - Open http://localhost:5173
   - Try to login with admin credentials
   - Check browser console for any API errors

## 📱 Available Features

### **Working Features:**
- ✅ User authentication (login/signup)
- ✅ Wallet creation and management
- ✅ Balance checking (mock data)
- ✅ Transaction simulation
- ✅ Admin panel access
- ✅ KYC/AML compliance system
- ✅ Rate limiting and security
- ✅ WebSocket real-time updates

### **Ready for Your APIs:**
- 🔄 Real blockchain transactions (when Web3 installed)
- 🔄 Live price data (CoinGecko API ready)
- 🔄 Email notifications (SMTP configured)
- 🔄 SMS verification (Twilio ready)

## 🚨 Troubleshooting

### **Backend Won't Start:**
```bash
cd backend
python init_db.py --init  # Reinitialize database
python src/main.py
```

### **Frontend API Errors:**
- Check that backend is running on port 5000
- Verify `VITE_API_URL` in your `.env` file
- Clear browser cache and restart frontend

### **Database Issues:**
```bash
cd backend
python init_db.py --reset  # Reset database (⚠️ deletes all data)
```

## 🎯 Next Steps

1. **Start both servers** using the commands above
2. **Test the application** at http://localhost:5173
3. **Add your real API keys** to `.env` when ready for production features
4. **Install Web3 dependencies** when you want real blockchain functionality

The application is now fully functional and ready for your API keys! 🎉
