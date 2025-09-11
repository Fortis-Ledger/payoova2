"""
KYC/AML Schema Migration
Creates tables for KYC verification, AML screening, and transaction monitoring
"""

from sqlalchemy import text

def upgrade(connection):
    """Apply the migration"""
    
    # Create KYC documents table
    connection.execute(text("""
        CREATE TABLE IF NOT EXISTS kyc_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            document_type VARCHAR(50) NOT NULL,
            document_number VARCHAR(100),
            file_path VARCHAR(255) NOT NULL,
            file_hash VARCHAR(64) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            verified_at DATETIME,
            expires_at DATETIME,
            rejection_reason TEXT,
            FOREIGN KEY (user_id) REFERENCES user (id)
        )
    """))
    
    # Create KYC verifications table
    connection.execute(text("""
        CREATE TABLE IF NOT EXISTS kyc_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            verification_level INTEGER DEFAULT 0,
            status VARCHAR(20) DEFAULT 'pending',
            risk_level VARCHAR(20) DEFAULT 'medium',
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            date_of_birth DATE,
            nationality VARCHAR(50),
            country_of_residence VARCHAR(50),
            address_line1 VARCHAR(255),
            address_line2 VARCHAR(255),
            city VARCHAR(100),
            state VARCHAR(100),
            postal_code VARCHAR(20),
            country VARCHAR(50),
            verified_by VARCHAR(100),
            verification_notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            verified_at DATETIME,
            expires_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES user (id)
        )
    """))
    
    # Create AML checks table
    connection.execute(text("""
        CREATE TABLE IF NOT EXISTS aml_checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            check_type VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            risk_score REAL DEFAULT 0.0,
            sanctions_hit BOOLEAN DEFAULT 0,
            pep_hit BOOLEAN DEFAULT 0,
            adverse_media_hit BOOLEAN DEFAULT 0,
            provider VARCHAR(50),
            reference_id VARCHAR(100),
            results_data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user (id)
        )
    """))
    
    # Create transaction monitoring table
    connection.execute(text("""
        CREATE TABLE IF NOT EXISTS transaction_monitoring (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            transaction_id INTEGER NOT NULL,
            risk_score REAL DEFAULT 0.0,
            risk_factors TEXT,
            flagged BOOLEAN DEFAULT 0,
            large_amount BOOLEAN DEFAULT 0,
            unusual_pattern BOOLEAN DEFAULT 0,
            high_risk_country BOOLEAN DEFAULT 0,
            velocity_breach BOOLEAN DEFAULT 0,
            review_status VARCHAR(20) DEFAULT 'pending',
            reviewed_by VARCHAR(100),
            review_notes TEXT,
            reviewed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES user (id),
            FOREIGN KEY (transaction_id) REFERENCES transaction (id)
        )
    """))
    
    # Create indexes for better performance
    connection.execute(text("CREATE INDEX IF NOT EXISTS idx_kyc_documents_user_id ON kyc_documents (user_id)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS idx_kyc_verifications_user_id ON kyc_verifications (user_id)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS idx_kyc_verifications_status ON kyc_verifications (status)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS idx_aml_checks_user_id ON aml_checks (user_id)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS idx_aml_checks_status ON aml_checks (status)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS idx_transaction_monitoring_user_id ON transaction_monitoring (user_id)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS idx_transaction_monitoring_flagged ON transaction_monitoring (flagged)"))
    connection.execute(text("CREATE INDEX IF NOT EXISTS idx_transaction_monitoring_review_status ON transaction_monitoring (review_status)"))

def downgrade(connection):
    """Rollback the migration"""
    connection.execute(text("DROP TABLE IF EXISTS transaction_monitoring"))
    connection.execute(text("DROP TABLE IF EXISTS aml_checks"))
    connection.execute(text("DROP TABLE IF EXISTS kyc_verifications"))
    connection.execute(text("DROP TABLE IF EXISTS kyc_documents"))

if __name__ == "__main__":
    # Run migration manually if needed
    import sqlite3
    import os
    
    db_path = os.path.join(os.path.dirname(__file__), '..', 'instance', 'payoova_dev.db')
    conn = sqlite3.connect(db_path)
    
    try:
        upgrade(conn)
        print("KYC/AML migration completed successfully")
    except Exception as e:
        print(f"Migration failed: {e}")
        downgrade(conn)
    finally:
        conn.close()
