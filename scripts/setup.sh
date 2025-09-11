#!/bin/bash

# Payoova 2.0 Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Payoova 2.0 Development Environment"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. Some features may not work."
fi

echo "✅ Prerequisites check passed"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p backups

# Set up database
echo "🗄️  Setting up database..."
cd backend
python -c "
from src.main import app
from migrations.001_initial_schema import upgrade
with app.app_context():
    upgrade()
"
cd ..

echo "✅ Setup completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Update your .env file with proper configuration"
echo "2. Run 'npm run dev' to start the frontend"
echo "3. Run 'cd backend && python src/main.py' to start the backend"
echo "4. Visit http://localhost:5173 to access the application"
echo ""
echo "📚 For more information, check the README.md file"
