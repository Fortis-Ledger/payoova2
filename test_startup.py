#!/usr/bin/env python3
"""
Test script to verify Payoova 2.0 can start without errors
"""

import sys
import os

def test_imports():
    """Test that all critical imports work"""
    print("Testing critical imports...")

    try:
        # Test Flask imports
        from flask import Flask
        from flask_cors import CORS
        from flask_sqlalchemy import SQLAlchemy
        print("Flask imports OK")
    except ImportError as e:
        print(f"Flask import failed: {e}")
        return False

    try:
        # Test service imports (these should work even without web3)
        from backend.src.services.blockchain import get_blockchain_service
        from backend.src.services.qr_service import get_qr_service
        print("Service imports OK")
    except ImportError as e:
        print(f"Service import failed: {e}")
        return False

    try:
        # Test route imports
        from backend.src.routes.auth import auth_bp
        from backend.src.routes.user import user_bp
        print("Route imports OK")
    except ImportError as e:
        print(f"Route import failed: {e}")
        return False

    try:
        # Test model imports
        from backend.src.models.user import User, db
        print("Model imports OK")
    except ImportError as e:
        print(f"Model import failed: {e}")
        return False

    return True

def test_app_creation():
    """Test that Flask app can be created"""
    print("\nTesting Flask app creation...")

    try:
        from backend.src.main import app
        print("Flask app created successfully")
        return True
    except Exception as e:
        print(f"Flask app creation failed: {e}")
        return False

def main():
    """Main test function"""
    print("Testing Payoova 2.0 Startup")
    print("=" * 40)

    # Change to project root if running from different directory
    if not os.path.exists('backend'):
        print("ERROR: Please run this script from the project root directory")
        sys.exit(1)

    # Add backend to path
    sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

    # Test imports
    if not test_imports():
        print("\nImport tests failed!")
        sys.exit(1)

    # Test app creation
    if not test_app_creation():
        print("\nApp creation test failed!")
        sys.exit(1)

    print("\nAll tests passed!")
    print("Your Payoova 2.0 application should start successfully.")
    print("\nTo start the application:")
    print("1. cd backend")
    print("2. python src/main.py")
    print("\nThen open: http://localhost:5173")

if __name__ == "__main__":
    main()