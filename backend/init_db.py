#!/usr/bin/env python3
"""
Database initialization script for Payoova
Creates all necessary tables and sets up initial data
"""

import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from src.models.user import db, User, Wallet, Transaction, AuthToken
from src.config import get_config
from flask import Flask
import secrets

def create_app():
    """Create Flask app for database initialization"""
    app = Flask(__name__)
    
    # Load configuration
    config = get_config()
    app.config.from_object(config)
    
    # Initialize database
    db.init_app(app)
    
    return app

def init_database():
    """Initialize database with tables"""
    app = create_app()
    
    with app.app_context():
        try:
            print("Creating database tables...")
            
            # Create all tables
            db.create_all()
            
            print("Database tables created successfully!")
            
            # Check if admin user exists
            admin_user = User.query.filter_by(email='admin@payoova.com').first()
            
            if not admin_user:
                print("Creating admin user...")
                
                # Create admin user
                admin_user = User(
                    name='Admin',
                    email='admin@payoova.com',
                    role='admin'
                )
                admin_user.set_password('admin123')  # Change this in production!
                
                db.session.add(admin_user)
                db.session.commit()
                
                print("Admin user created successfully!")
                print("   Email: admin@payoova.com")
                print("   Password: admin123")
                print("   WARNING: Please change the admin password in production!")
            else:
                print("Admin user already exists")
            
            print("\nDatabase initialization completed successfully!")
            
        except Exception as e:
            print(f"Database initialization failed: {str(e)}")
            return False
    
    return True

def reset_database():
    """Reset database (drop and recreate all tables)"""
    app = create_app()
    
    with app.app_context():
        try:
            print("WARNING: Dropping all database tables...")
            db.drop_all()

            print("Recreating database tables...")
            db.create_all()

            print("Database reset completed successfully!")
            
        except Exception as e:
            print(f"Database reset failed: {str(e)}")
            return False
    
    return True

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Payoova Database Management')
    parser.add_argument('--reset', action='store_true', help='Reset database (drop and recreate)')
    parser.add_argument('--init', action='store_true', help='Initialize database')
    
    args = parser.parse_args()
    
    if args.reset:
        if input("WARNING: This will delete all data. Continue? (y/N): ").lower() == 'y':
            reset_database()
        else:
            print("Database reset cancelled.")
    elif args.init:
        init_database()
    else:
        # Default action
        init_database()
