import jwt
import secrets
import re
import bcrypt
from functools import wraps
from flask import request, jsonify, current_app
from datetime import datetime, timedelta
from cryptography.fernet import Fernet
import html

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

class JWTManager:
    """JWT token management"""

    @staticmethod
    def generate_access_token(user_id: int) -> str:
        """Generate access token"""
        payload = {
            'user_id': user_id,
            'type': 'access',
            'exp': datetime.utcnow() + timedelta(hours=current_app.config.get('JWT_ACCESS_TOKEN_EXPIRES', 24)),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, current_app.config['JWT_ACCESS_SECRET'], algorithm='HS256')

    @staticmethod
    def generate_refresh_token(user_id: int) -> str:
        """Generate refresh token"""
        payload = {
            'user_id': user_id,
            'type': 'refresh',
            'exp': datetime.utcnow() + timedelta(days=30),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, current_app.config['JWT_REFRESH_SECRET'], algorithm='HS256')

    @staticmethod
    def verify_token(token: str, token_type: str = 'access') -> dict:
        """Verify and decode token"""
        try:
            secret = current_app.config['JWT_ACCESS_SECRET'] if token_type == 'access' else current_app.config['JWT_REFRESH_SECRET']
            payload = jwt.decode(token, secret, algorithms=['HS256'])

            if payload.get('type') != token_type:
                raise jwt.InvalidTokenError('Invalid token type')

            return {'valid': True, 'payload': payload}
        except jwt.ExpiredSignatureError:
            return {'valid': False, 'error': 'Token expired'}
        except jwt.InvalidTokenError as e:
            return {'valid': False, 'error': str(e)}

class InputValidator:
    """Input validation utilities"""

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

    @staticmethod
    def validate_password(password: str) -> dict:
        """Validate password strength"""
        errors = []

        if len(password) < 8:
            errors.append('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', password):
            errors.append('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', password):
            errors.append('Password must contain at least one lowercase letter')
        if not re.search(r'\d', password):
            errors.append('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append('Password must contain at least one special character')

        return {
            'valid': len(errors) == 0,
            'errors': errors
        }

    @staticmethod
    def validate_username(username: str) -> bool:
        """Validate username format"""
        if not username or len(username) < 3 or len(username) > 50:
            return False
        # Allow alphanumeric characters, underscores, and hyphens
        pattern = r'^[a-zA-Z0-9_-]+$'
        return bool(re.match(pattern, username))

def validate_ethereum_address(address: str) -> bool:
    """Validate Ethereum address format"""
    if not address or not isinstance(address, str):
        return False

    # Basic format check
    if not address.startswith('0x') or len(address) != 42:
        return False

    # Check if it's a valid hex string
    try:
        int(address[2:], 16)
        return True
    except ValueError:
        return False

def sanitize_input(input_string: str, max_length: int = 1000) -> str:
    """Sanitize user input to prevent XSS and other attacks"""
    if not input_string:
        return ''

    # Limit input length
    if len(input_string) > max_length:
        input_string = input_string[:max_length]

    # Escape HTML characters
    cleaned = html.escape(input_string, quote=True)

    # Remove potential script injections
    cleaned = re.sub(r'<script[^>]*>.*?</script>', '', cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r'javascript:', '', cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r'on\w+\s*=', '', cleaned, flags=re.IGNORECASE)

    return cleaned.strip()

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from src.models.user import AuthToken, User
        
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]

        # Check if token exists in database
        auth_token = AuthToken.query.filter_by(token=token, is_active=True).first()

        if not auth_token:
            return jsonify({'error': 'Invalid token'}), 401

        if auth_token.is_expired():
            return jsonify({'error': 'Token expired'}), 401

        # Get user
        user = User.query.get(auth_token.user_id)
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401

        # Add user to request context
        request.current_user = {
            'user_id': user.id,
            'email': user.email,
            'role': user.role
        }

        return f(*args, **kwargs)
    return decorated_function

def require_admin(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(request, 'current_user'):
            return jsonify({'error': 'Authentication required'}), 401

        if request.current_user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403

        return f(*args, **kwargs)
    return decorated_function

def generate_secure_token(length: int = 32) -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)

def hash_sensitive_data(data: str) -> str:
    """Hash sensitive data using bcrypt (one-way)"""
    return bcrypt.hashpw(data.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

class SecurityAudit:
    """Security audit logging"""

    @staticmethod
    def log_security_event(event_type: str, user_id: int = None, details: dict = None, ip_address: str = None):
        """Log security-related events"""
        try:
            # In a real application, this would write to a security log
            # For now, we'll just log to the application logger
            current_app.logger.warning(f'SECURITY EVENT: {event_type} - User: {user_id} - Details: {details} - IP: {ip_address}')
        except Exception as e:
            current_app.logger.error(f'Failed to log security event: {e}')

    @staticmethod
    def log_failed_login(email: str, ip_address: str):
        """Log failed login attempts"""
        SecurityAudit.log_security_event(
            'FAILED_LOGIN',
            details={'email': email},
            ip_address=ip_address
        )

    @staticmethod
    def log_suspicious_activity(user_id: int, activity: str, ip_address: str):
        """Log suspicious user activity"""
        SecurityAudit.log_security_event(
            'SUSPICIOUS_ACTIVITY',
            user_id=user_id,
            details={'activity': activity},
            ip_address=ip_address
        )
