"""
Database migration script for Payoova 2.0
Add gas_used column to transaction table
"""

import os
import sys
# Add the parent directory to the path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import current_app
from src.models.user import db


def upgrade():
    """Upgrade database schema"""
    try:
        with current_app.app_context():
            # Check if gas_used column exists, if not add it
            with db.engine.connect() as conn:
                result = conn.execute(db.text("""
                    PRAGMA table_info("transaction")
                """))
                columns = [row[1] for row in result.fetchall()]

                if 'gas_used' not in columns:
                    conn.execute(db.text("""
                        ALTER TABLE "transaction"
                        ADD COLUMN gas_used INTEGER
                    """))
                    conn.commit()
                    print("Added gas_used column to transaction table")
                else:
                    print("gas_used column already exists")

                if 'gas_price' not in columns:
                    conn.execute(db.text("""
                        ALTER TABLE "transaction"
                        ADD COLUMN gas_price VARCHAR(50)
                    """))
                    conn.commit()
                    print("Added gas_price column to transaction table")
                else:
                    print("gas_price column already exists")

            print("SUCCESS: Migration completed")

    except Exception as e:
        print(f"ERROR: Database migration failed: {e}")
        raise


def downgrade():
    """Downgrade database schema"""
    try:
        with current_app.app_context():
            # Remove gas_used column from transaction table
            with db.engine.connect() as conn:
                conn.execute(db.text("""
                    ALTER TABLE "transaction"
                    DROP COLUMN gas_used
                """))
                conn.commit()

            # Remove gas_price column from transaction table
            with db.engine.connect() as conn:
                conn.execute(db.text("""
                    ALTER TABLE "transaction"
                    DROP COLUMN gas_price
                """))
                conn.commit()

            print("SUCCESS: Removed gas_used and gas_price columns from transaction table")

    except Exception as e:
        print(f"ERROR: Database downgrade failed: {e}")
        raise


def run_migration():
    """Run the migration"""
    from src.main import app

    with app.app_context():
        upgrade()


if __name__ == '__main__':
    run_migration()