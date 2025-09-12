# Payoova 2.0 - Complete Setup Guide

This guide will help you set up and run the Payoova Web3 wallet application with all features working correctly.

## 🚀 Quick Start (5 minutes)

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/ahmadfarazllc/payoova2.git
cd payoova2

# Install frontend dependencies
npm install --legacy-peer-deps

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# At minimum, configure Auth0 settings:
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-auth0-audience
```

### 3. Start the Application

```bash
# Start backend (Terminal 1)
cd backend
python src/main.py

# Start frontend (Terminal 2)
npm run dev
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔧 Detailed Configuration

### Auth0 Setup (Required)

1. Create an Auth0 account at https://auth0.com
2. Create a new application (Single Page Application)
3. Configure the following settings:
   - Allowed Callback URLs: `http://localhost:5173`
   - Allowed Logout URLs: `http://localhost:5173`
   - Allowed Web Origins: `http://localhost:5173`
   - Allowed Origins (CORS): `http://localhost:5173`

4. Update your `.env` file with Auth0 credentials:
```env
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://your-domain.auth0.com/api/v2/
```

### Blockchain Configuration (Optional)

The application works with mock data by default. For real blockchain functionality:

1. **Get RPC URLs** (choose one):
   - Alchemy: https://www.alchemy.com/
   - Infura: https://infura.io/
   - QuickNode: https://www.quicknode.com/

2. **Update .env file**:
```env
# For testnet (recommended for development)
NETWORK_MODE=testnet
ETHEREUM_TESTNET_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY
POLYGON_TESTNET_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR-API-KEY
BSC_TESTNET_RPC_URL=https://bnb-testnet.g.alchemy.com/v2/YOUR-API-KEY

# Disable demo mode for real blockchain
DEMO_MODE=false
```

3. **Install Web3 dependencies**:
```bash
# Windows (easiest)
install_web3_windows.bat

# Or manually
pip install web3==6.15.1 eth-account==0.10.0 eth-keys==0.4.0
```

## ✨ Features Overview

### 🔐 Authentication
- **Status**: ✅ Working
- **Provider**: Auth0
- **Features**: Login, Signup, JWT tokens

### 💰 Wallet Management
- **Status**: ✅ Working
- **Features**: 
  - Auto-generation on signup (Ethereum, Polygon, BSC)
  - Balance checking
  - Address generation
  - QR code generation

### 💸 Send/Receive Crypto
- **Status**: ✅ Working
- **Features**:
  - Send crypto to any address
  - Receive crypto with QR codes
  - Gas fee estimation
  - Transaction validation

### 📊 Transaction History
- **Status**: ✅ Working
- **Features**:
  - View all transactions
  - Filter by network, status, type
  - Real-time updates
  - Blockchain synchronization

### 💳 Cards Section
- **Status**: ✅ Working (Coming Soon Mode)
- **Features**:
  - Virtual and Physical cards
  - Both show "Coming Soon" status
  - Ready for future integration

### 👨‍💼 Admin Panel
- **Status**: ✅ Working
- **Features**:
  - User management
  - Transaction monitoring
  - System analytics

## 🔧 Troubleshooting

### Common Issues

**1. "Web3 not available" warnings**
- This is normal! The app works with mock data
- Install web3 dependencies if you want real blockchain features
- Configure RPC URLs in .env file

**2. Auth0 login not working**
- Check Auth0 configuration in .env file
- Verify callback URLs in Auth0 dashboard
- Ensure CORS settings are correct

**3. Wallets not auto-generating**
- Check browser console for errors
- Verify backend is running on port 5000
- Check database permissions

**4. Transaction errors**
- Ensure you have sufficient balance (including gas fees)
- Verify recipient address format
- Check network connectivity

### Database Issues

**Reset database**:
```bash
cd backend
rm -f instance/payoova_dev.db
python src/main.py  # Will recreate tables
```

**Check database schema**:
```bash
cd backend
python check_db_schema.py
```

### Port Conflicts

**Change backend port**:
```python
# In backend/src/main.py, change:
socketio.run(app, host='0.0.0.0', port=5001, debug=True)
```

**Change frontend port**:
```bash
# Start with custom port
npm run dev -- --port 3000
```

## 🚀 Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
DEBUG=false
NETWORK_MODE=mainnet

# Use production RPC URLs
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR-API-KEY

# Production database
DATABASE_URL=postgresql://user:pass@host:5432/payoova

# Secure secrets (generate new ones!)
SECRET_KEY=your-production-secret-key
JWT_ACCESS_SECRET=your-production-jwt-secret
WALLET_ENCRYPTION_KEY=your-production-encryption-key
```

### Build and Deploy

```bash
# Build frontend
npm run build

# Copy to backend static folder
cp -r dist/* backend/src/static/

# Deploy backend
cd backend
python src/main.py
```

## 📞 Support

### Getting Help

1. **Check the logs**:
   - Backend: `backend/logs/`
   - Frontend: Browser console

2. **Common solutions**:
   - Restart both frontend and backend
   - Clear browser cache
   - Check .env configuration

3. **Create an issue**:
   - Include error messages
   - Describe steps to reproduce
   - Share relevant configuration (without secrets)

### Contact

- **GitHub Issues**: https://github.com/ahmadfarazllc/payoova2/issues
- **Email**: support@payoova.com
- **Documentation**: Check README.md for additional details

## 🎯 Next Steps

1. **Configure Auth0** for authentication
2. **Test wallet generation** and transactions
3. **Set up blockchain RPCs** for real functionality
4. **Customize branding** and styling
5. **Deploy to production** when ready

The application is now fully functional with auto-wallet generation, working send/receive features, transaction history, and proper error handling!