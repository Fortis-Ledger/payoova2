#!/usr/bin/env python3
"""
Check database schema for Payoova
"""

import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.user import db

def check_transaction_table():
    """Check the transaction table schema"""
    with app.app_context():
        with db.engine.connect() as conn:
            # Get table info
            result = conn.execute(db.text('PRAGMA table_info("transaction")'))
            columns = result.fetchall()

            print("Transaction table schema:")
            print("-" * 50)
            for col in columns:
                print(f"Column: {col[1]}, Type: {col[2]}, Not Null: {col[3]}, Default: {col[4]}, Primary Key: {col[5]}")

            print("\nColumn names only:")
            column_names = [col[1] for col in columns]
            print(column_names)

            # Check for gas_used and gas_price specifically
            has_gas_used = 'gas_used' in column_names
            has_gas_price = 'gas_price' in column_names

            print(f"\nGas columns check:")
            print(f"gas_used column: {'✓ EXISTS' if has_gas_used else '✗ MISSING'}")
            print(f"gas_price column: {'✓ EXISTS' if has_gas_price else '✗ MISSING'}")

if __name__ == '__main__':
    check_transaction_table()