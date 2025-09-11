"""
Database migration script for Payoova 2.0
Add Card and CardTransaction tables
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import current_app
from src.models.user import db
from src.models.card import Card, CardTransaction


def upgrade():
    """Upgrade database schema - Add card tables"""
    try:
        with current_app.app_context():
            # Import card models to register them
            from src.models.card import Card, CardTransaction
            
            # Create card tables
            Card.__table__.create(db.engine, checkfirst=True)
            CardTransaction.__table__.create(db.engine, checkfirst=True)
            
            print("✅ Card tables created successfully")
            print("✅ Card migration completed successfully")

    except Exception as e:
        print(f"❌ Card migration failed: {e}")
        raise


def downgrade():
    """Downgrade database schema - Remove card tables"""
    try:
        with current_app.app_context():
            # Import card models
            from src.models.card import Card, CardTransaction
            
            # Drop card tables (in reverse order due to foreign keys)
            CardTransaction.__table__.drop(db.engine, checkfirst=True)
            Card.__table__.drop(db.engine, checkfirst=True)
            
            print("✅ Card tables dropped successfully")

    except Exception as e:
        print(f"❌ Card migration downgrade failed: {e}")
        raise


def run_migration():
    """Run the card migration"""
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))
    from main import app

    with app.app_context():
        upgrade()


if __name__ == '__main__':
    run_migration()
