@echo off
REM Payoova 2.0 Setup Script for Windows
REM This script sets up the development environment

echo 🚀 Setting up Payoova 2.0 Development Environment

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Docker is not installed. Some features may not work.
)

echo ✅ Prerequisites check passed

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please update the .env file with your configuration
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist logs mkdir logs
if not exist uploads mkdir uploads
if not exist backups mkdir backups

REM Set up database
echo 🗄️  Setting up database...
cd backend
python -c "from src.main import app; from migrations.001_initial_schema import upgrade; app.app_context().push(); upgrade()"
if %errorlevel% neq 0 (
    echo ❌ Failed to set up database
    cd ..
    pause
    exit /b 1
)
cd ..

echo ✅ Setup completed successfully!
echo.
echo 🎯 Next steps:
echo 1. Update your .env file with proper configuration
echo 2. Run 'npm run dev' to start the frontend
echo 3. Run 'cd backend && python src/main.py' to start the backend
echo 4. Visit http://localhost:5173 to access the application
echo.
echo 📚 For more information, check the README.md file
pause
