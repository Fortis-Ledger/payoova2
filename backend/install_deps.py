#!/usr/bin/env python3
"""
Installation script for Payoova 2.0 dependencies
This script ensures all dependencies are installed correctly
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"Error: {e.stderr}")
        return False

def main():
    """Main installation function"""
    print("🚀 Installing Payoova 2.0 Dependencies")
    print("=" * 50)

    # Check if we're in the backend directory
    if not os.path.exists('requirements.txt'):
        print("❌ requirements.txt not found. Please run this script from the backend directory.")
        sys.exit(1)

    # Upgrade pip first
    if not run_command("python -m pip install --upgrade pip", "Upgrading pip"):
        sys.exit(1)

    # Install core dependencies first
    core_deps = [
        "Flask==3.1.1",
        "flask-cors==6.0.0",
        "Flask-SQLAlchemy==3.1.1",
        "SQLAlchemy==2.0.41",
        "bcrypt==4.1.2",
        "cryptography==42.0.5",
        "PyJWT==2.8.0"
    ]

    print("\n📦 Installing core dependencies...")
    for dep in core_deps:
        if not run_command(f"pip install {dep}", f"Installing {dep}"):
            print(f"⚠️  Failed to install {dep}, continuing...")

    # Install web3 and blockchain dependencies
    blockchain_deps = [
        "web3==6.15.1",
        "eth-account==0.10.0",
        "eth-keys==0.4.0"
    ]

    print("\n⛓️  Installing blockchain dependencies...")
    for dep in blockchain_deps:
        if not run_command(f"pip install {dep}", f"Installing {dep}"):
            print(f"⚠️  Failed to install {dep}, continuing...")

    # Install remaining dependencies from requirements.txt
    print("\n📋 Installing remaining dependencies from requirements.txt...")
    if not run_command("pip install -r requirements.txt", "Installing from requirements.txt"):
        print("⚠️  Some dependencies may have failed to install")

    # Verify key installations
    print("\n🔍 Verifying key installations...")
    key_packages = ['flask', 'web3', 'sqlalchemy', 'bcrypt', 'cryptography']

    for package in key_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package} - OK")
        except ImportError:
            print(f"❌ {package} - FAILED")

    print("\n🎉 Installation completed!")
    print("You can now run: python src/main.py")

if __name__ == "__main__":
    main()