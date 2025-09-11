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

            # Create demo users if they don't exist
            _create_demo_users()

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


def _create_demo_users():
    """Create demo users for testing"""
    try:
        # Check if demo users already exist
        demo_user = User.query.filter_by(email='demo@payoova.com').first()
        admin_user = User.query.filter_by(email='admin@payoova.com').first()

        if not demo_user:
            demo_user = User(
                name='Demo User',
                email='demo@payoova.com',
                role='user'
            )
            demo_user.set_password('demo123')
            db.session.add(demo_user)
            print("✅ Demo user created")

        if not admin_user:
            admin_user = User(
                name='Admin User',
                email='admin@payoova.com',
                role='admin'
            )
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            print("✅ Admin user created")

        db.session.commit()

    except Exception as e:
        print(f"❌ Failed to create demo users: {e}")
        db.session.rollback()


def run_migration():
    """Run the migration"""
    from src.main import app

    with app.app_context():
        upgrade()


if __name__ == '__main__':
    run_migration()