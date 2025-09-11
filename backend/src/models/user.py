from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import secrets
from src.utils.crypto_utils import PasswordManager

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'user' or 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    wallets = db.relationship('Wallet', backref='user', lazy=True, cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', backref='user', lazy=True, cascade='all, delete-orphan')

    def set_password(self, password):
        """Hash and set password using bcrypt"""
        self.password_hash = PasswordManager.hash_password(password)
    
    def check_password(self, password):
        """Check if provided password matches hash using bcrypt"""
        return PasswordManager.verify_password(password, self.password_hash)
    
    def generate_auth_token(self):
        """Generate authentication token"""
        return secrets.token_urlsafe(32)
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }

class Wallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    network = db.Column(db.String(20), nullable=False)  # 'ethereum', 'polygon', 'bsc'
    address = db.Column(db.String(42), nullable=False, unique=True)
    encrypted_private_key = db.Column(db.Text, nullable=False)
    balance = db.Column(db.String(50), default='0')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        """Convert wallet to dictionary"""
        return {
            'id': self.id,
            'network': self.network,
            'address': self.address,
            'balance': self.balance,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    wallet_id = db.Column(db.Integer, db.ForeignKey('wallet.id'), nullable=False)
    transaction_hash = db.Column(db.String(66), unique=True)
    from_address = db.Column(db.String(42), nullable=False)
    to_address = db.Column(db.String(42), nullable=False)
    amount = db.Column(db.String(50), nullable=False)
    currency = db.Column(db.String(10), nullable=False)
    network = db.Column(db.String(20), nullable=False)
    transaction_type = db.Column(db.String(10), nullable=False)  # 'send' or 'receive'
    status = db.Column(db.String(20), default='pending')  # 'pending', 'confirmed', 'failed'
    gas_fee = db.Column(db.String(50))
    gas_used = db.Column(db.Integer)
    gas_price = db.Column(db.String(50))
    block_number = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)
    
    # Relationship
    wallet = db.relationship('Wallet', backref='transactions')
    
    def to_dict(self):
        """Convert transaction to dictionary"""
        return {
            'id': self.id,
            'transaction_hash': self.transaction_hash,
            'from_address': self.from_address,
            'to_address': self.to_address,
            'amount': self.amount,
            'currency': self.currency,
            'network': self.network,
            'transaction_type': self.transaction_type,
            'status': self.status,
            'gas_fee': self.gas_fee,
            'gas_used': self.gas_used,
            'gas_price': self.gas_price,
            'block_number': self.block_number,
            'created_at': self.created_at.isoformat(),
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None
        }

class AuthToken(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationship
    user = db.relationship('User', backref='auth_tokens')
    
    def is_expired(self):
        """Check if token is expired"""
        return datetime.utcnow() > self.expires_at
