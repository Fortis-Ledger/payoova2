#!/bin/bash

# Payoova 2.0 Update Script

set -e

echo "🔄 Updating Payoova 2.0..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Pull latest changes (if using git)
if [ -d .git ]; then
    print_status "Pulling latest changes..."
    git pull origin main
fi

# Backup database
print_status "Creating database backup..."
mkdir -p backups
timestamp=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T postgres pg_dump -U payoova_user payoova > "backups/payoova_backup_${timestamp}.sql"
print_status "Database backup created: backups/payoova_backup_${timestamp}.sql"

# Rebuild and restart services
print_status "Rebuilding application..."
docker-compose build --no-cache payoova

print_status "Restarting services..."
docker-compose up -d --force-recreate payoova

# Wait for service to be ready
print_status "Waiting for services to restart..."
sleep 30

# Run any necessary migrations
print_status "Running database migrations..."
docker-compose exec -T payoova python -c "
from src.models.user import db
from src.main import app
with app.app_context():
    db.create_all()
    print('Database migrations completed')
"

print_status "Update completed successfully! ✅"

# Show service status
docker-compose ps
