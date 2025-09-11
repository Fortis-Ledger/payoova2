# Payoova 2.0 Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+
- Docker (optional, for production)

### Development Setup

1. **Clone and Setup**
   ```bash
   # Windows
   scripts\setup.bat
   
   # Linux/Mac
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start Development**
   ```bash
   # Frontend
   npm run dev
   
   # Backend (new terminal)
   cd backend
   python src/main.py
   ```

## 🐳 Docker Deployment

### Production Deployment
```bash
# Build and deploy
docker-compose up -d

# Or use deployment script
./scripts/deploy.sh
```

### Environment Variables
Update `.env` with production values:
- `SECRET_KEY` - Strong random key
- `JWT_ACCESS_SECRET` - JWT signing key
- `WALLET_ENCRYPTION_KEY` - Wallet encryption key
- Database and API configurations

## 🔧 Configuration

### Required Environment Variables
- `SECRET_KEY` - Application secret key
- `JWT_ACCESS_SECRET` - JWT access token secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `WALLET_ENCRYPTION_KEY` - Wallet private key encryption

### Optional Services
- Redis for rate limiting
- SMTP for email notifications
- Blockchain API keys for real transactions

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Logs
```bash
# Docker logs
docker-compose logs -f

# Application logs
tail -f logs/payoova.log
```

## 🔒 Security

### Production Checklist
- [ ] Change all default passwords
- [ ] Set strong encryption keys
- [ ] Enable HTTPS/SSL
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Regular backups

### SSL Configuration
1. Obtain SSL certificates
2. Update `nginx/ssl.conf`
3. Restart nginx service

## 🛠️ Maintenance

### Database Migrations
```bash
cd backend
python migrations/001_initial_schema.py
```

### Backup
```bash
# Database backup
sqlite3 payoova.db ".backup backup_$(date +%Y%m%d).db"
```

### Updates
```bash
git pull origin main
./scripts/update.sh
```

## 📞 Support

For issues or questions:
- Check logs first
- Review environment configuration
- Ensure all services are running
- Verify network connectivity

## 🎯 Default Credentials

**Admin Access:**
- Email: admin@payoova.com
- Password: admin123

**Demo User:**
- Email: demo@payoova.com
- Password: demo123

⚠️ **Change these in production!**
