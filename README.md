# Payoova 2.0 - Complete Crypto Wallet Platform

A full-stack cryptocurrency wallet application similar to Redot Pay, built with React and Flask.

## 🚀 Live Demo

**Production URL:** https://qjh9iec79z56.manus.space

## ✨ Features

### 🔐 User Features
- **Beautiful Login/Signup System** - Professional crypto wallet interface
- **Demo Account Access** - Try the platform without registration
- **Multi-Network Wallet Generation** - Support for Ethereum, Polygon, BSC
- **Send Crypto Functionality** - Complete transaction system with validation
- **Receive Crypto** - QR codes and address sharing
- **Transaction History** - Track all wallet activities with filters
- **Real-time Balance Updates** - Live portfolio tracking
- **Responsive Design** - Works on desktop and mobile

### 👨‍💼 Admin Features
- **User Management** - Complete user oversight and control
- **Transaction Monitoring** - Real-time transaction tracking with analytics
- **System Analytics** - Platform statistics and insights
- **Settings Management** - Complete system configuration
- **Security Controls** - Advanced security and compliance features

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for components
- **React Router** for navigation
- **Context API** for state management

### Backend
- **Flask** with Python
- **SQLAlchemy** for database ORM
- **SQLite** database (production ready)
- **Flask-CORS** for cross-origin requests
- **JWT Authentication** for security
- **RESTful API** design

## 📁 Project Structure

```
payoova2/
├── src/                          # Frontend React application
│   ├── components/
│   │   ├── auth/                 # Login/Signup components
│   │   ├── wallet/               # Wallet functionality
│   │   ├── admin/                # Admin panel components
│   │   └── common/               # Shared components
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom React hooks
│   └── App.jsx                   # Main application
├── backend/                      # Flask backend application
│   ├── src/
│   │   ├── models/               # Database models
│   │   ├── routes/               # API routes
│   │   ├── static/               # Built frontend files
│   │   └── main.py               # Flask application
│   └── requirements.txt          # Python dependencies
├── public/                       # Static assets
├── package.json                  # Node.js dependencies
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### Installation

1. **Clone the repository**
    ```bash
    git clone https://github.com/ahmadfarazllc/payoova2.git
    cd payoova2
    ```

2. **Test Setup (Optional but Recommended)**
    ```bash
    python test_startup.py
    ```
    This will verify that all components can be imported and the app can start.

3. **Quick Setup (Recommended)**
    ```bash
    python start.py
    ```
    This will automatically install all dependencies and set up the project.

4. **Manual Setup**

    **Install frontend dependencies**
    ```bash
    npm install --legacy-peer-deps
    ```

    **Install backend dependencies**
    ```bash
    cd backend
    python install_deps.py  # Or manually: pip install -r requirements.txt
    ```

4. **Optional: Install Web3 for Real Blockchain Functionality**

    **Windows Users (Easiest):**
    ```batch
    # Double-click this file or run in command prompt
    install_web3_windows.bat
    ```

    **Python Scripts:**
    ```bash
    # Standard installation
    python install_web3.py

    # Conda installation (alternative)
    python install_web3_conda.py
    ```

    **Manual Installation:**
    ```bash
    # Try pre-compiled wheels first (recommended)
    pip install web3 eth-account eth-keys --only-binary=all

    # If that fails, try specific versions
    pip install web3==6.8.0 eth-account==0.8.0 eth-keys==0.4.0
    ```

    **Note:** The application works perfectly without web3 using mock data for development.

4. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

### Development

1. **Start the backend server**
   ```bash
   cd backend
   source venv/bin/activate
   python src/main.py
   ```

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Copy built files to backend**
   ```bash
   cp -r dist/* backend/src/static/
   ```

3. **Deploy the backend**
   ```bash
   cd backend
   python src/main.py
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application URLs
APP_BASE_URL=https://payoova.com
APP_DEV_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=sqlite:///payoova.db

# Authentication Secrets
SESSION_SECRET=your-unique-session-secret
JWT_ACCESS_SECRET=your-jwt-access-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# Server Configuration
PORT=5000
NODE_ENV=development
```

## 📱 Usage Guide

### For Users

1. **Getting Started**
   - Visit the application URL
   - Click "Try Demo Account" for instant access
   - Or create a new account with email/password

2. **Creating Wallets**
   - Navigate to Dashboard
   - Click "Generate Wallet" 
   - Select network (Ethereum, Polygon, BSC)
   - Your wallet will be created instantly

3. **Sending Crypto**
   - Go to Send section
   - Select source wallet and network
   - Enter recipient address and amount
   - Confirm transaction

4. **Receiving Crypto**
   - Go to Receive section
   - Select network
   - Share QR code or copy address
   - Monitor incoming transactions

### For Admins

1. **Access Admin Panel**
   - Login with admin credentials
   - Navigate to admin dashboard
   - View system overview and statistics

2. **User Management**
   - View all registered users
   - Suspend/activate accounts
   - Monitor user activities

3. **Transaction Monitoring**
   - Real-time transaction tracking
   - Filter by network, status, type
   - Export transaction data

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Private Key Encryption** - All private keys are encrypted at rest
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Comprehensive input sanitization
- **Rate Limiting** - API rate limiting for security
- **Secure Headers** - Security headers for web protection

## 🌐 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/verify` - Verify authentication token
- `POST /api/auth/logout` - User logout

### Wallet Endpoints
- `GET /api/wallet/list` - Get user wallets with balances
- `POST /api/wallet/generate` - Generate new wallet
- `POST /api/wallet/send` - Send cryptocurrency (legacy)
- `GET /api/wallet/transactions` - Get transaction history
- `GET /api/wallet/balances` - Get wallet balances
- `GET /api/wallet/prices` - Get cryptocurrency prices
- `GET /api/wallet/transaction/<tx_hash>/status` - Get transaction status

### Simple Wallet Endpoints
- `GET /api/wallet/balance/<network>` - Get wallet balance for network
- `POST /api/wallet/create/<network>` - Create wallet for network
- `POST /api/wallet/transfer` - Transfer cryptocurrency
- `GET /api/wallet/history/<network>` - Get transaction history for network

### QR Code Endpoints
- `GET /api/qr/address/<network>` - Generate QR code for wallet address
- `GET /api/qr/transaction/<tx_hash>` - Generate QR code for transaction
- `POST /api/qr/payment` - Generate QR code for payment request
- `GET /api/qr/download/<qr_type>` - Download QR code as PNG
- `POST /api/qr/validate` - Validate QR code data

### Admin Endpoints
- `GET /api/admin/dashboard` - Get admin dashboard statistics
- `GET /api/admin/users` - Get all users with pagination
- `POST /api/admin/users/<user_id>/toggle-status` - Toggle user active status
- `GET /api/admin/transactions` - Get all transactions with pagination
- `GET /api/admin/export/users` - Export users data (CSV/Excel)
- `GET /api/admin/export/transactions` - Export transactions data (CSV/Excel)
- `GET /api/admin/analytics` - Get detailed system analytics

### System Endpoints
- `GET /api/health` - Health check endpoint

## 🚀 Deployment

### Production Deployment

The application is deployed and accessible at:
**https://qjh9iec79z56.manus.space**

### Self-Hosting

1. **Build the application**
   ```bash
   npm run build
   cp -r dist/* backend/src/static/
   ```

2. **Configure production environment**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=your-production-db-url
   ```

3. **Start the production server**
   ```bash
   cd backend
   python src/main.py
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@payoova.com
- Documentation: [Wiki](https://github.com/ahmadfarazllc/payoova2/wiki)

## 🔧 Troubleshooting

### Common Issues

**Microsoft Visual C++ Build Error (Windows)**
```bash
# This error occurs when pip tries to compile packages from source

# Solution 1: Use conda (recommended for Windows)
python install_web3_conda.py

# Solution 2: Use pre-compiled wheels only
pip install web3 eth-account eth-keys --only-binary=all

# Solution 3: Install Microsoft C++ Build Tools
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
# Then try: pip install web3 eth-account eth-keys

# Solution 4: Use older versions that have pre-compiled wheels
pip install web3==6.8.0 eth-account==0.8.0 eth-keys==0.4.0
```

**ModuleNotFoundError for web3 or other dependencies**
```bash
# Option 1: Use our automated installer
python install_web3.py

# Option 2: Use conda installer (Windows)
python install_web3_conda.py

# Option 3: The application works without web3 using mock data
# Just run the application - it will show a warning but work fine
python backend/src/main.py

# Option 4: Manual installation with pre-compiled wheels
pip install --upgrade pip
pip install web3 eth-account eth-keys --only-binary=all
```

**Application runs but shows "Web3 not available" warnings**
```
This is normal! The application is designed to work with or without web3.
- With web3: Real blockchain interactions
- Without web3: Mock data for development and testing
- All features work in both modes
- You can install web3 later when needed
```

**Database connection issues**
```bash
# Run database migration
python backend/migrations/001_initial_schema.py

# Or reset database
rm backend/src/database/app.db
python src/main.py  # This will recreate tables
```

**Port already in use**
```bash
# Kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Or change port in main.py
app.run(host='0.0.0.0', port=5001, debug=True)
```

**Frontend build issues**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 🎯 Roadmap

- [ ] Real blockchain integration
- [ ] Hardware wallet support
- [ ] Mobile app development
- [ ] Advanced trading features
- [ ] DeFi protocol integration
- [ ] Multi-language support

---

**Built with ❤️ by the Payoova Team**

**Live Demo:** https://qjh9iec79z56.manus.space

