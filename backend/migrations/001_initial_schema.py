"""
Database migration script for Payoova 2.0
Initial schema creation
"""

from flask import current_app
from src.models.user import db, User, Wallet, Transaction, AuthToken
import os


def upgrade():
    """Upgrade database schema"""
    try:
        with current_app.app_context():
            # Create all tables
            db.create_all()
            print("✅ Database tables created successfully")

            print("✅ Database migration completed successfully")

    except Exception as e:
        print(f"❌ Database migration failed: {e}")
        raise


def downgrade():
    """Downgrade database schema"""
    try:
        with current_app.app_context():
            # Drop all tables
            db.drop_all()
            print("✅ Database tables dropped successfully")

    except Exception as e:
        print(f"❌ Database downgrade failed: {e}")
        raise




def run_migration():
    """Run the migration"""
    from src.main import app

    with app.app_context():
        upgrade()


if __name__ == '__main__':
    run_migration()