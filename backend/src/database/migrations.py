"""
Database Migration System for Payoova 2.0
Handles database schema migrations and data transformations
"""

import os
import sqlite3
import psycopg2
from datetime import datetime
from flask import current_app
from src.models.user import db, User, Wallet, Transaction, AuthToken
from sqlalchemy import text
import json
import logging

class DatabaseMigrator:
    """Handle database migrations between SQLite and PostgreSQL"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def migrate_sqlite_to_postgresql(self, sqlite_path: str, postgres_url: str):
        """Migrate data from SQLite to PostgreSQL"""
        try:
            # Connect to SQLite
            sqlite_conn = sqlite3.connect(sqlite_path)
            sqlite_conn.row_factory = sqlite3.Row
            
            # Connect to PostgreSQL
            postgres_conn = psycopg2.connect(postgres_url)
            postgres_cursor = postgres_conn.cursor()
            
            # Create tables in PostgreSQL
            self._create_postgres_tables(postgres_cursor)
            
            # Migrate data
            self._migrate_users(sqlite_conn, postgres_cursor)
            self._migrate_wallets(sqlite_conn, postgres_cursor)
            self._migrate_transactions(sqlite_conn, postgres_cursor)
            self._migrate_auth_tokens(sqlite_conn, postgres_cursor)
            
            # Commit changes
            postgres_conn.commit()
            
            # Close connections
            sqlite_conn.close()
            postgres_conn.close()
            
            self.logger.info("Migration completed successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Migration failed: {e}")
            return False
    
    def _create_postgres_tables(self, cursor):
        """Create PostgreSQL tables"""
        tables = [
            """
            CREATE TABLE IF NOT EXISTS user (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(120) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS wallet (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES user(id) ON DELETE CASCADE,
                network VARCHAR(20) NOT NULL,
                address VARCHAR(42) UNIQUE NOT NULL,
                encrypted_private_key TEXT NOT NULL,
                balance VARCHAR(50) DEFAULT '0',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS transaction (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES user(id) ON DELETE CASCADE,
                wallet_id INTEGER REFERENCES wallet(id) ON DELETE CASCADE,
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                confirmed_at TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS auth_token (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES user(id) ON DELETE CASCADE,
                token VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                is_active BOOLEAN DEFAULT TRUE
            )
            """
        ]
        
        for table_sql in tables:
            cursor.execute(table_sql)
    
    def _migrate_users(self, sqlite_conn, postgres_cursor):
        """Migrate users table"""
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT * FROM user")
        
        for row in sqlite_cursor.fetchall():
            postgres_cursor.execute("""
                INSERT INTO user (id, name, email, password_hash, role, created_at, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (email) DO NOTHING
            """, (
                row['id'], row['name'], row['email'], row['password_hash'],
                row['role'], row['created_at'], row['is_active']
            ))
    
    def _migrate_wallets(self, sqlite_conn, postgres_cursor):
        """Migrate wallets table"""
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT * FROM wallet")
        
        for row in sqlite_cursor.fetchall():
            postgres_cursor.execute("""
                INSERT INTO wallet (id, user_id, network, address, encrypted_private_key, balance, created_at, is_active)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (address) DO NOTHING
            """, (
                row['id'], row['user_id'], row['network'], row['address'],
                row['encrypted_private_key'], row['balance'], row['created_at'], row['is_active']
            ))
    
    def _migrate_transactions(self, sqlite_conn, postgres_cursor):
        """Migrate transactions table"""
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT * FROM transaction")
        
        for row in sqlite_cursor.fetchall():
            postgres_cursor.execute("""
                INSERT INTO transaction (id, user_id, wallet_id, transaction_hash, from_address, to_address,
                                       amount, currency, network, transaction_type, status, gas_fee,
                                       block_number, created_at, confirmed_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (transaction_hash) DO NOTHING
            """, (
                row['id'], row['user_id'], row['wallet_id'], row['transaction_hash'],
                row['from_address'], row['to_address'], row['amount'], row['currency'],
                row['network'], row['transaction_type'], row['status'], row['gas_fee'],
                row['block_number'], row['created_at'], row['confirmed_at']
            ))
    
    def _migrate_auth_tokens(self, sqlite_conn, postgres_cursor):
        """Migrate auth_tokens table"""
        sqlite_cursor = sqlite_conn.cursor()
        sqlite_cursor.execute("SELECT * FROM auth_token")
        
        for row in sqlite_cursor.fetchall():
            postgres_cursor.execute("""
                INSERT INTO auth_token (id, user_id, token, created_at, expires_at, is_active)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (token) DO NOTHING
            """, (
                row['id'], row['user_id'], row['token'],
                row['created_at'], row['expires_at'], row['is_active']
            ))

class BackupManager:
    """Handle database backups and restoration"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
    def create_backup(self, backup_name: str = None):
        """Create database backup"""
        if not backup_name:
            backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        try:
            # Create backups directory
            backup_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'backups')
            os.makedirs(backup_dir, exist_ok=True)
            
            # Export data
            backup_data = {
                'users': self._export_table(User),
                'wallets': self._export_table(Wallet),
                'transactions': self._export_table(Transaction),
                'auth_tokens': self._export_table(AuthToken),
                'metadata': {
                    'created_at': datetime.now().isoformat(),
                    'version': '2.0.0'
                }
            }
            
            # Save to file
            backup_file = os.path.join(backup_dir, f"{backup_name}.json")
            with open(backup_file, 'w') as f:
                json.dump(backup_data, f, indent=2, default=str)
            
            self.logger.info(f"Backup created: {backup_file}")
            return backup_file
            
        except Exception as e:
            self.logger.error(f"Backup failed: {e}")
            return None
    
    def _export_table(self, model_class):
        """Export table data to dictionary"""
        try:
            records = model_class.query.all()
            return [record.to_dict() if hasattr(record, 'to_dict') else self._model_to_dict(record) 
                   for record in records]
        except Exception as e:
            self.logger.error(f"Failed to export {model_class.__name__}: {e}")
            return []
    
    def _model_to_dict(self, model):
        """Convert SQLAlchemy model to dictionary"""
        return {column.name: getattr(model, column.name) 
                for column in model.__table__.columns}

def run_migration():
    """Run database migration from command line"""
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python migrations.py <sqlite_path> <postgres_url>")
        return
    
    sqlite_path = sys.argv[1]
    postgres_url = sys.argv[2]
    
    migrator = DatabaseMigrator()
    success = migrator.migrate_sqlite_to_postgresql(sqlite_path, postgres_url)
    
    if success:
        print("✅ Migration completed successfully!")
    else:
        print("❌ Migration failed!")

if __name__ == '__main__':
    run_migration()
