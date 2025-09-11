import bcrypt
from cryptography.fernet import Fernet
import secrets
from flask import current_app


class PasswordManager:
    """Password hashing and verification utilities"""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password using bcrypt"""
        salt = bcrypt.gensalt(rounds=current_app.config.get('BCRYPT_LOG_ROUNDS', 12))
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


class WalletEncryption:
    """Wallet private key encryption/decryption"""

    @staticmethod
    def _get_encryption_key():
        """Get or create encryption key"""
        key = current_app.config.get('WALLET_ENCRYPTION_KEY')
        if not key:
            # Generate a new key (in production, this should be stored securely)
            key = Fernet.generate_key().decode('utf-8')
        return key.encode('utf-8')

    @staticmethod
    def encrypt_private_key(private_key: str) -> str:
        """Encrypt a private key"""
        f = Fernet(WalletEncryption._get_encryption_key())
        return f.encrypt(private_key.encode('utf-8')).decode('utf-8')

    @staticmethod
    def decrypt_private_key(encrypted_key: str) -> str:
        """Decrypt a private key"""
        f = Fernet(WalletEncryption._get_encryption_key())
        return f.decrypt(encrypted_key.encode('utf-8')).decode('utf-8')


def generate_secure_token(length: int = 32) -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)


def hash_sensitive_data(data: str) -> str:
    """Hash sensitive data using bcrypt (one-way)"""
    return bcrypt.hashpw(data.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')