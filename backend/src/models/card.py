from src.models.user import db
from datetime import datetime
import uuid
import random
import string

class Card(db.Model):
    __tablename__ = 'cards'
    
    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Card details
    card_type = db.Column(db.String(20), nullable=False)  # 'virtual' or 'physical'
    card_name = db.Column(db.String(100), nullable=False)
    card_number = db.Column(db.String(19), unique=True, nullable=False)
    expiry_date = db.Column(db.String(5), nullable=False)  # MM/YY format
    cvv = db.Column(db.String(4), nullable=False)
    
    # Financial details
    balance = db.Column(db.Numeric(15, 2), default=0.00)
    spending_limit = db.Column(db.Numeric(15, 2), default=1000.00)
    currency = db.Column(db.String(3), default='USD')
    
    # Status and metadata
    status = db.Column(db.String(20), default='active')  # active, frozen, cancelled, pending
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Physical card specific fields
    shipping_address = db.Column(db.Text, nullable=True)
    shipping_status = db.Column(db.String(20), nullable=True)  # processing, shipped, delivered
    tracking_number = db.Column(db.String(100), nullable=True)
    
    # Security and settings
    is_locked = db.Column(db.Boolean, default=False)
    pin_hash = db.Column(db.String(255), nullable=True)
    daily_limit = db.Column(db.Numeric(15, 2), nullable=True)
    monthly_limit = db.Column(db.Numeric(15, 2), nullable=True)
    
    # Statistics
    total_transactions = db.Column(db.Integer, default=0)
    total_spent = db.Column(db.Numeric(15, 2), default=0.00)
    last_transaction_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('cards', lazy=True))
    transactions = db.relationship('CardTransaction', backref='card', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super(Card, self).__init__(**kwargs)
        if not self.card_number:
            self.card_number = self.generate_card_number()
        if not self.expiry_date:
            self.expiry_date = self.generate_expiry_date()
        if not self.cvv:
            self.cvv = self.generate_cvv()
    
    @staticmethod
    def generate_card_number():
        """Generate a valid-looking card number (not real)"""
        # Use a test card number prefix (4532 for Visa test cards)
        prefix = "4532"
        # Generate 12 random digits
        middle = ''.join([str(random.randint(0, 9)) for _ in range(12)])
        
        # Format with spaces
        full_number = prefix + middle
        return f"{full_number[0:4]} {full_number[4:8]} {full_number[8:12]} {full_number[12:16]}"
    
    @staticmethod
    def generate_expiry_date():
        """Generate an expiry date 3-5 years from now"""
        import datetime
        current_year = datetime.datetime.now().year
        current_month = datetime.datetime.now().month
        
        # Add 3-5 years
        exp_year = current_year + random.randint(3, 5)
        exp_month = random.randint(1, 12)
        
        return f"{exp_month:02d}/{str(exp_year)[-2:]}"
    
    @staticmethod
    def generate_cvv():
        """Generate a 3-digit CVV"""
        return ''.join([str(random.randint(0, 9)) for _ in range(3)])
    
    def to_dict(self, include_sensitive=False):
        """Convert card to dictionary"""
        data = {
            'id': self.public_id,
            'type': self.card_type,
            'name': self.card_name,
            'balance': float(self.balance),
            'spending_limit': float(self.spending_limit),
            'currency': self.currency,
            'status': self.status,
            'is_locked': self.is_locked,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'total_transactions': self.total_transactions,
            'total_spent': float(self.total_spent),
            'last_transaction_at': self.last_transaction_at.isoformat() if self.last_transaction_at else None
        }
        
        if include_sensitive:
            data.update({
                'card_number': self.card_number,
                'expiry_date': self.expiry_date,
                'cvv': self.cvv
            })
        else:
            # Mask card number
            if self.card_number:
                masked = self.card_number[:4] + ' **** **** ' + self.card_number[-4:]
                data['card_number'] = masked
            data['expiry_date'] = self.expiry_date
            # Don't include CVV in non-sensitive mode
        
        # Add physical card specific data
        if self.card_type == 'physical':
            data.update({
                'shipping_status': self.shipping_status,
                'tracking_number': self.tracking_number if include_sensitive else None
            })
        
        return data
    
    def mask_card_number(self):
        """Return masked card number"""
        if not self.card_number:
            return ""
        return self.card_number[:4] + ' **** **** ' + self.card_number[-4:]
    
    def freeze(self):
        """Freeze the card"""
        self.status = 'frozen'
        self.is_locked = True
        self.updated_at = datetime.utcnow()
    
    def unfreeze(self):
        """Unfreeze the card"""
        self.status = 'active'
        self.is_locked = False
        self.updated_at = datetime.utcnow()
    
    def cancel(self):
        """Cancel the card"""
        self.status = 'cancelled'
        self.is_locked = True
        self.updated_at = datetime.utcnow()
    
    def update_transaction_stats(self, amount):
        """Update transaction statistics"""
        self.total_transactions += 1
        self.total_spent += abs(amount)
        self.last_transaction_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

class CardTransaction(db.Model):
    __tablename__ = 'card_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    public_id = db.Column(db.String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Transaction details
    transaction_type = db.Column(db.String(20), nullable=False)  # purchase, refund, load, fee
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    currency = db.Column(db.String(3), default='USD')
    description = db.Column(db.String(255), nullable=False)
    
    # Merchant details
    merchant_name = db.Column(db.String(100), nullable=True)
    merchant_category = db.Column(db.String(50), nullable=True)
    merchant_location = db.Column(db.String(100), nullable=True)
    
    # Transaction metadata
    status = db.Column(db.String(20), default='completed')  # pending, completed, failed, cancelled
    reference_number = db.Column(db.String(100), unique=True, nullable=False)
    authorization_code = db.Column(db.String(20), nullable=True)
    
    # Timestamps
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Security
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(500), nullable=True)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('card_transactions', lazy=True))
    
    def __init__(self, **kwargs):
        super(CardTransaction, self).__init__(**kwargs)
        if not self.reference_number:
            self.reference_number = self.generate_reference_number()
    
    @staticmethod
    def generate_reference_number():
        """Generate a unique reference number"""
        import time
        timestamp = str(int(time.time()))
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        return f"TXN{timestamp[-6:]}{random_part}"
    
    def to_dict(self):
        """Convert transaction to dictionary"""
        return {
            'id': self.public_id,
            'type': self.transaction_type,
            'amount': float(self.amount),
            'currency': self.currency,
            'description': self.description,
            'merchant_name': self.merchant_name,
            'merchant_category': self.merchant_category,
            'merchant_location': self.merchant_location,
            'status': self.status,
            'reference_number': self.reference_number,
            'authorization_code': self.authorization_code,
            'transaction_date': self.transaction_date.isoformat() if self.transaction_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
