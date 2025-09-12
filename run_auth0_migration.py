#!/usr/bin/env python3
"""
Script to run Auth0 migration
"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

# Import and run migration
from migrations.migration_004_add_auth0_id import run_migration

if __name__ == '__main__':
    run_migration()