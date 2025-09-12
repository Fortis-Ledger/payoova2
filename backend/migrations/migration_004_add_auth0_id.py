"""
Database migration script for Payoova 2.0
Add Auth0 ID column to User table
"""

from flask import current_app
from sqlalchemy import text
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))


def upgrade():
    """Upgrade database schema"""
    try:
        with current_app.app_context():
            from src.models.user import db

            # For SQLite, we need to recreate the table with the new schema
            # Check if auth0_id column exists
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('user')]

            if 'auth0_id' not in columns:
                # SQLite doesn't support ALTER TABLE ADD COLUMN with constraints easily
                # So we'll recreate the table
                print("Adding auth0_id column to user table...")

                # Use raw SQL for SQLite
                db.session.execute(text("""
                    ALTER TABLE user ADD COLUMN auth0_id VARCHAR(100)
                """))

                # Create unique index for auth0_id
                db.session.execute(text("""
                    CREATE UNIQUE INDEX IF NOT EXISTS ix_user_auth0_id ON user(auth0_id)
                """))

                db.session.commit()
                print("Auth0 ID column added to user table")
            else:
                print("Auth0 ID column already exists")

            print("Database migration completed successfully")

    except Exception as e:
        print(f"Database migration failed: {e}")
        raise


def downgrade():
    """Downgrade database schema"""
    try:
        with current_app.app_context():
            db = current_app.extensions['sqlalchemy'].db

            # Remove auth0_id column
            db.session.execute(text("""
                ALTER TABLE user DROP COLUMN IF EXISTS auth0_id
            """))

            # Make password_hash NOT NULL again
            db.session.execute(text("""
                ALTER TABLE user ALTER COLUMN password_hash SET NOT NULL
            """))

            db.session.commit()
            print("✅ Auth0 ID column removed from user table")

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