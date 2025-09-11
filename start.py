#!/usr/bin/env python3
"""
Payoova 2.0 Startup Script
This script helps you get Payoova running quickly
"""

import os
import sys
import subprocess
import time

def run_command(command, cwd=None, description=""):
    """Run a command and return success status"""
    print(f"🔄 {description}")
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=False,
            text=True
        )
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Main startup function"""
    print("🚀 Starting Payoova 2.0")
    print("=" * 50)

    # Check if we're in the project root
    if not os.path.exists('backend') or not os.path.exists('src'):
        print("❌ Please run this script from the project root directory")
        sys.exit(1)

    # Step 1: Install backend dependencies
    print("\n📦 Step 1: Installing backend dependencies...")
    if os.path.exists('backend/install_deps.py'):
        if not run_command("python backend/install_deps.py", description="Running dependency installer"):
            print("⚠️  Dependency installation may have issues, continuing...")
    else:
        if not run_command("pip install -r backend/requirements.txt", description="Installing backend dependencies"):
            print("⚠️  Backend dependency installation failed")

    # Step 2: Install frontend dependencies
    print("\n⚛️  Step 2: Installing frontend dependencies...")
    if not run_command("npm install --legacy-peer-deps", description="Installing frontend dependencies"):
        print("⚠️  Frontend dependency installation failed")

    # Step 3: Check environment file
    print("\n🔧 Step 3: Checking environment configuration...")
    if not os.path.exists('.env'):
        if os.path.exists('.env.example'):
            print("📋 Creating .env file from .env.example...")
            # You can manually copy the .env.example to .env
            print("⚠️  Please copy .env.example to .env and add your API keys")
        else:
            print("⚠️  No .env.example found")

    # Step 4: Run database migration
    print("\n🗄️  Step 4: Setting up database...")
    if os.path.exists('backend/migrations/001_initial_schema.py'):
        if not run_command("python backend/migrations/001_initial_schema.py", description="Running database migration"):
            print("⚠️  Database migration failed")

    print("\n🎉 Setup completed!")
    print("\nTo start the application:")
    print("1. Backend: cd backend && python src/main.py")
    print("2. Frontend: npm run dev")
    print("\nThen visit: http://localhost:5173")

if __name__ == "__main__":
    main()