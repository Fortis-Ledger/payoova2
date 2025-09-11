#!/bin/bash

# Payoova 2.0 Production Deployment Script

set -e  # Exit on any error

echo "🚀 Starting Payoova 2.0 deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from template..."
    if [ -f env.example ]; then
        cp env.example .env
        print_warning "Please edit .env file with your production values before continuing."
        echo "Press Enter when ready to continue..."
        read
    else
        print_error "env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Validate critical environment variables
print_status "Validating environment variables..."

required_vars=("SECRET_KEY" "JWT_ACCESS_SECRET" "JWT_REFRESH_SECRET" "WALLET_ENCRYPTION_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your-${var,,}-change-this-in-production" ]; then
        print_error "Please set a secure value for $var in .env file"
        exit 1
    fi
done

print_status "Environment validation passed ✅"

# Create necessary directories
print_status "Creating directories..."
mkdir -p logs
mkdir -p nginx/ssl
mkdir -p backend/src/database

# Build and start services
print_status "Building Docker images..."
docker-compose build --no-cache

print_status "Starting services..."
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."
if docker-compose ps | grep -q "unhealthy\|Exit"; then
    print_error "Some services are not healthy. Check logs with: docker-compose logs"
    exit 1
fi

# Run database migrations (if needed)
print_status "Setting up database..."
docker-compose exec -T payoova python -c "
from src.models.user import db
from src.main import app
with app.app_context():
    db.create_all()
    print('Database tables created successfully')
"

# Create default admin user
print_status "Creating default admin user..."
docker-compose exec -T payoova python -c "
from src.models.user import User, db
from src.main import app
with app.app_context():
    admin = User.query.filter_by(email='admin@payoova.com').first()
    if not admin:
        admin = User(name='Admin User', email='admin@payoova.com', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print('Default admin user created: admin@payoova.com / admin123')
    else:
        print('Admin user already exists')
"

print_status "Deployment completed successfully! 🎉"
print_status ""
print_status "Application is running at:"
print_status "  • Main app: http://localhost:5000"
print_status "  • Admin login: admin@payoova.com / admin123"
print_status ""
print_status "Useful commands:"
print_status "  • View logs: docker-compose logs -f"
print_status "  • Stop services: docker-compose down"
print_status "  • Restart services: docker-compose restart"
print_status "  • Update app: ./scripts/update.sh"
print_status ""
print_warning "IMPORTANT: Change the default admin password after first login!"
print_warning "IMPORTANT: Set up SSL certificates for production use!"

# Show running services
echo ""
docker-compose ps
