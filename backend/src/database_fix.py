#!/usr/bin/env python3
"""
Database migration script to fix User model schema
"""

import os
import sys
import sqlite3
from datetime import datetime

def fix_database():
    """Fix database schema by recreating tables"""
    
    # Database path
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'app.db')
    
    # Create database directory if it doesn't exist
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Drop existing tables if they exist
        cursor.execute('DROP TABLE IF EXISTS auth_token')
        cursor.execute('DROP TABLE IF EXISTS "transaction"')
        cursor.execute('DROP TABLE IF EXISTS wallet')
        cursor.execute('DROP TABLE IF EXISTS user')
        
        # Create User table with correct schema
        cursor.execute('''
            CREATE TABLE user (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        # Create Wallet table
        cursor.execute('''
            CREATE TABLE wallet (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                network VARCHAR(20) NOT NULL,
                address VARCHAR(42) UNIQUE NOT NULL,
                encrypted_private_key TEXT NOT NULL,
                balance VARCHAR(50) DEFAULT '0',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES user (id)
            )
        ''')
        
        # Create Transaction table
        cursor.execute('''
            CREATE TABLE "transaction" (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                wallet_id INTEGER NOT NULL,
                transaction_hash VARCHAR(66) UNIQUE,
                from_address VARCHAR(42) NOT NULL,
                to_address VARCHAR(42) NOT NULL,
                amount VARCHAR(50) NOT NULL,
                currency VARCHAR(10) NOT NULL,
                network VARCHAR(20) NOT NULL,
                transaction_type VARCHAR(10) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                gas_fee VARCHAR(50),
                block_number INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                confirmed_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES user (id),
                FOREIGN KEY (wallet_id) REFERENCES wallet (id)
            )
        ''')
        
        # Create AuthToken table
        cursor.execute('''
            CREATE TABLE auth_token (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token VARCHAR(255) UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES user (id)
            )
        ''')
        
        # Insert demo admin user
        cursor.execute('''
            INSERT INTO user (name, email, password_hash, role, is_active)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            'Admin User',
            'admin@payoova.com',
            'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',  # sha256('admin123')
            'admin',
            1
        ))
        
        # Insert demo regular user
        cursor.execute('''
            INSERT INTO user (name, email, password_hash, role, is_active)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            'Demo User',
            'demo@payoova.com',
            'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',  # sha256('hello')
            'user',
            1
        ))
        
        # Commit changes
        conn.commit()
        print("✅ Database schema fixed successfully!")
        print("✅ Demo users created:")
        print("   - Admin: admin@payoova.com / admin123")
        print("   - User: demo@payoova.com / hello")
        
    except Exception as e:
        print(f"❌ Error fixing database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    fix_database()

