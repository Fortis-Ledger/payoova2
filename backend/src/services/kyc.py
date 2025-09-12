import os
import json
import httpx
import logging
from typing import Dict, Optional, List
from datetime import datetime, timedelta
from flask import current_app
from src.models.user import User, db
from src.utils.security import SecurityAudit
from enum import Enum

logger = logging.getLogger(__name__)

class KYCStatus(Enum):
    """KYC verification status"""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"

class RiskLevel(Enum):
    """Risk assessment levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class KYCDocument(db.Model):
    """KYC document model"""
    __tablename__ = 'kyc_documents'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    document_type = db.Column(db.String(50), nullable=False)  # passport, license, utility_bill
    document_number = db.Column(db.String(100))
    file_path = db.Column(db.String(255), nullable=False)
    file_hash = db.Column(db.String(64), nullable=False)
    status = db.Column(db.Enum(KYCStatus), default=KYCStatus.PENDING)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    verified_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    
    # Relationships
    user = db.relationship('User', backref='kyc_documents')

class KYCVerification(db.Model):
    """KYC verification record"""
    __tablename__ = 'kyc_verifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    verification_level = db.Column(db.Integer, default=0)  # 0=none, 1=basic, 2=enhanced, 3=premium
    status = db.Column(db.Enum(KYCStatus), default=KYCStatus.PENDING)
    risk_level = db.Column(db.Enum(RiskLevel), default=RiskLevel.MEDIUM)
    
    # Personal Information
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    nationality = db.Column(db.String(50))
    country_of_residence = db.Column(db.String(50))
    
    # Address Information
    address_line1 = db.Column(db.String(255))
    address_line2 = db.Column(db.String(255))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    country = db.Column(db.String(50))
    
    # Verification Details
    verified_by = db.Column(db.String(100))  # admin user or service
    verification_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    verified_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref='kyc_verification', uselist=False)

class AMLCheck(db.Model):
    """AML screening record"""
    __tablename__ = 'aml_checks'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    check_type = db.Column(db.String(50), nullable=False)  # sanctions, pep, adverse_media
    status = db.Column(db.String(20), default='pending')  # pending, clear, hit, error
    risk_score = db.Column(db.Float, default=0.0)
    
    # Check Results
    sanctions_hit = db.Column(db.Boolean, default=False)
    pep_hit = db.Column(db.Boolean, default=False)
    adverse_media_hit = db.Column(db.Boolean, default=False)
    
    # Details
    provider = db.Column(db.String(50))  # screening service provider
    reference_id = db.Column(db.String(100))  # provider's reference
    results_data = db.Column(db.Text)  # JSON data from provider
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='aml_checks')

class TransactionMonitoring(db.Model):
    """Transaction monitoring for AML"""
    __tablename__ = 'transaction_monitoring'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transaction.id'), nullable=False)
    
    # Risk Assessment
    risk_score = db.Column(db.Float, default=0.0)
    risk_factors = db.Column(db.Text)  # JSON array of risk factors
    flagged = db.Column(db.Boolean, default=False)
    
    # Monitoring Rules Triggered
    large_amount = db.Column(db.Boolean, default=False)
    unusual_pattern = db.Column(db.Boolean, default=False)
    high_risk_country = db.Column(db.Boolean, default=False)
    velocity_breach = db.Column(db.Boolean, default=False)
    
    # Review Status
    review_status = db.Column(db.String(20), default='pending')  # pending, reviewed, escalated
    reviewed_by = db.Column(db.String(100))
    review_notes = db.Column(db.Text)
    reviewed_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='transaction_monitoring')

class KYCService:
    """KYC verification service"""
    
    def __init__(self):
        self.api_key = None
        self.base_url = None
        self._load_config()
    
    def _load_config(self):
        """Load KYC service configuration"""
        try:
            if current_app:
                self.api_key = current_app.config.get('KYC_API_KEY')
                self.base_url = current_app.config.get('KYC_API_URL', 'https://api.jumio.com')
        except RuntimeError:
            pass
    
    async def verify_identity(self, user_id: int, document_data: Dict) -> Dict:
        """Verify user identity using KYC service"""
        try:
            user = User.query.get(user_id)
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # Create or update KYC verification record
            kyc_verification = KYCVerification.query.filter_by(user_id=user_id).first()
            if not kyc_verification:
                kyc_verification = KYCVerification(user_id=user_id)
                db.session.add(kyc_verification)
            
            # Update personal information
            kyc_verification.first_name = document_data.get('first_name')
            kyc_verification.last_name = document_data.get('last_name')
            kyc_verification.date_of_birth = document_data.get('date_of_birth')
            kyc_verification.nationality = document_data.get('nationality')
            kyc_verification.status = KYCStatus.UNDER_REVIEW
            
            db.session.commit()
            
            # If API is configured, use external service
            if self.api_key and self.base_url:
                result = await self._external_kyc_check(user_id, document_data)
            else:
                # Only allow mock verification in demo mode
                demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'
                if demo_mode:
                    result = await self._mock_kyc_check(user_id, document_data)
                else:
                    return {'success': False, 'error': 'KYC service not configured. Please integrate a real KYC provider.'}
            
            # Update verification status
            if result['success']:
                kyc_verification.status = KYCStatus.APPROVED if result['approved'] else KYCStatus.REJECTED
                kyc_verification.verification_level = result.get('level', 1)
                kyc_verification.verified_at = datetime.utcnow()
                kyc_verification.expires_at = datetime.utcnow() + timedelta(days=365)
                
                if not result['approved']:
                    kyc_verification.rejection_reason = result.get('reason', 'Verification failed')
                
                db.session.commit()
                
                # Log security event
                SecurityAudit.log_security_event(
                    'KYC_VERIFICATION',
                    user_id=user_id,
                    details={'status': kyc_verification.status.value, 'level': kyc_verification.verification_level}
                )
            
            return result
            
        except Exception as e:
            logger.error(f"KYC verification error: {str(e)}")
            return {'success': False, 'error': 'Verification service error'}
    
    async def _external_kyc_check(self, user_id: int, document_data: Dict) -> Dict:
        """Perform KYC check using external service"""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                }
                
                payload = {
                    'user_reference': str(user_id),
                    'document_type': document_data.get('document_type'),
                    'document_data': document_data
                }
                
                response = await client.post(
                    f"{self.base_url}/verify",
                    headers=headers,
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        'success': True,
                        'approved': result.get('status') == 'approved',
                        'level': result.get('verification_level', 1),
                        'reason': result.get('rejection_reason'),
                        'reference': result.get('reference_id')
                    }
                else:
                    return {'success': False, 'error': 'External service error'}
                    
        except Exception as e:
            logger.error(f"External KYC check error: {str(e)}")
            return {'success': False, 'error': 'External service unavailable'}
    
    async def _mock_kyc_check(self, user_id: int, document_data: Dict) -> Dict:
        """Mock KYC verification for demo purposes"""
        # Simple mock logic - approve if basic data is provided
        required_fields = ['first_name', 'last_name', 'date_of_birth']
        has_required = all(field in document_data and document_data[field] for field in required_fields)
        
        return {
            'success': True,
            'approved': has_required,
            'level': 1 if has_required else 0,
            'reason': None if has_required else 'Missing required information',
            'reference': f'MOCK_{user_id}_{datetime.utcnow().timestamp()}'
        }
    
    def get_kyc_status(self, user_id: int) -> Dict:
        """Get KYC status for user"""
        try:
            kyc_verification = KYCVerification.query.filter_by(user_id=user_id).first()
            
            if not kyc_verification:
                return {
                    'status': KYCStatus.PENDING.value,
                    'level': 0,
                    'verified': False
                }
            
            return {
                'status': kyc_verification.status.value,
                'level': kyc_verification.verification_level,
                'verified': kyc_verification.status == KYCStatus.APPROVED,
                'verified_at': kyc_verification.verified_at.isoformat() if kyc_verification.verified_at else None,
                'expires_at': kyc_verification.expires_at.isoformat() if kyc_verification.expires_at else None
            }
            
        except Exception as e:
            logger.error(f"Get KYC status error: {str(e)}")
            return {'status': 'error', 'level': 0, 'verified': False}

class AMLService:
    """Anti-Money Laundering service"""
    
    def __init__(self):
        self.api_key = None
        self.base_url = None
        self._load_config()
    
    def _load_config(self):
        """Load AML service configuration"""
        try:
            if current_app:
                self.api_key = current_app.config.get('AML_API_KEY')
                self.base_url = current_app.config.get('AML_API_URL', 'https://api.worldcheck.com')
        except RuntimeError:
            pass
    
    async def screen_user(self, user_id: int, user_data: Dict) -> Dict:
        """Screen user against sanctions and PEP lists"""
        try:
            user = User.query.get(user_id)
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # Create AML check record
            aml_check = AMLCheck(
                user_id=user_id,
                check_type='comprehensive',
                provider='internal'
            )
            db.session.add(aml_check)
            
            # Perform screening
            if self.api_key and self.base_url:
                result = await self._external_aml_screen(user_data)
            else:
                demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'
                if demo_mode:
                    result = await self._mock_aml_screen(user_data)
                else:
                    return {'success': False, 'error': 'AML service not configured. Please integrate a real AML provider.'}
            
            # Update check record
            aml_check.status = 'clear' if result['clear'] else 'hit'
            aml_check.risk_score = result.get('risk_score', 0.0)
            aml_check.sanctions_hit = result.get('sanctions_hit', False)
            aml_check.pep_hit = result.get('pep_hit', False)
            aml_check.adverse_media_hit = result.get('adverse_media_hit', False)
            aml_check.results_data = json.dumps(result.get('details', {}))
            
            db.session.commit()
            
            # Log security event
            SecurityAudit.log_security_event(
                'AML_SCREENING',
                user_id=user_id,
                details={'status': aml_check.status, 'risk_score': aml_check.risk_score}
            )
            
            return {
                'success': True,
                'clear': result['clear'],
                'risk_score': result.get('risk_score', 0.0),
                'hits': {
                    'sanctions': result.get('sanctions_hit', False),
                    'pep': result.get('pep_hit', False),
                    'adverse_media': result.get('adverse_media_hit', False)
                }
            }
            
        except Exception as e:
            logger.error(f"AML screening error: {str(e)}")
            return {'success': False, 'error': 'Screening service error'}
    
    async def _external_aml_screen(self, user_data: Dict) -> Dict:
        """Perform AML screening using external service"""
        try:
            async with httpx.AsyncClient() as client:
                headers = {
                    'Authorization': f'Bearer {self.api_key}',
                    'Content-Type': 'application/json'
                }
                
                payload = {
                    'name': f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip(),
                    'date_of_birth': user_data.get('date_of_birth'),
                    'nationality': user_data.get('nationality'),
                    'country': user_data.get('country')
                }
                
                response = await client.post(
                    f"{self.base_url}/screen",
                    headers=headers,
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        'clear': result.get('status') == 'clear',
                        'risk_score': result.get('risk_score', 0.0),
                        'sanctions_hit': result.get('sanctions_match', False),
                        'pep_hit': result.get('pep_match', False),
                        'adverse_media_hit': result.get('adverse_media_match', False),
                        'details': result
                    }
                else:
                    return {'clear': True, 'risk_score': 0.0}
                    
        except Exception as e:
            logger.error(f"External AML screening error: {str(e)}")
            return {'clear': True, 'risk_score': 0.0}
    
    async def _mock_aml_screen(self, user_data: Dict) -> Dict:
        """Mock AML screening for demo purposes"""
        # Simple mock logic - flag certain test names
        full_name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip().lower()
        
        # Mock sanctions list
        sanctions_names = ['john doe', 'jane smith', 'test user']
        sanctions_hit = any(name in full_name for name in sanctions_names)
        
        return {
            'clear': not sanctions_hit,
            'risk_score': 0.8 if sanctions_hit else 0.1,
            'sanctions_hit': sanctions_hit,
            'pep_hit': False,
            'adverse_media_hit': False,
            'details': {'provider': 'mock', 'timestamp': datetime.utcnow().isoformat()}
        }
    
    def monitor_transaction(self, transaction_id: int, transaction_data: Dict) -> Dict:
        """Monitor transaction for AML compliance"""
        try:
            from src.models.user import Transaction
            
            transaction = Transaction.query.get(transaction_id)
            if not transaction:
                return {'success': False, 'error': 'Transaction not found'}
            
            # Calculate risk score
            risk_score = self._calculate_transaction_risk(transaction_data)
            
            # Check monitoring rules
            large_amount = float(transaction_data.get('amount', 0)) > 10000  # $10k threshold
            high_risk_country = self._is_high_risk_country(transaction_data.get('country'))
            velocity_breach = self._check_velocity_limits(transaction.user_id, transaction_data)
            
            flagged = risk_score > 0.7 or large_amount or high_risk_country or velocity_breach
            
            # Create monitoring record
            monitoring = TransactionMonitoring(
                user_id=transaction.user_id,
                transaction_id=transaction_id,
                risk_score=risk_score,
                flagged=flagged,
                large_amount=large_amount,
                high_risk_country=high_risk_country,
                velocity_breach=velocity_breach,
                risk_factors=json.dumps(self._get_risk_factors(transaction_data))
            )
            
            db.session.add(monitoring)
            db.session.commit()
            
            if flagged:
                # Log security event
                SecurityAudit.log_security_event(
                    'TRANSACTION_FLAGGED',
                    user_id=transaction.user_id,
                    details={'transaction_id': transaction_id, 'risk_score': risk_score}
                )
            
            return {
                'success': True,
                'flagged': flagged,
                'risk_score': risk_score,
                'requires_review': flagged
            }
            
        except Exception as e:
            logger.error(f"Transaction monitoring error: {str(e)}")
            return {'success': False, 'error': 'Monitoring service error'}
    
    def _calculate_transaction_risk(self, transaction_data: Dict) -> float:
        """Calculate transaction risk score"""
        risk_score = 0.0
        
        # Amount-based risk
        amount = float(transaction_data.get('amount', 0))
        if amount > 50000:
            risk_score += 0.4
        elif amount > 10000:
            risk_score += 0.2
        
        # Time-based risk (unusual hours)
        hour = datetime.now().hour
        if hour < 6 or hour > 22:
            risk_score += 0.1
        
        # Country risk
        if self._is_high_risk_country(transaction_data.get('country')):
            risk_score += 0.3
        
        return min(risk_score, 1.0)
    
    def _is_high_risk_country(self, country: str) -> bool:
        """Check if country is high-risk for AML"""
        if not country:
            return False
        
        # FATF high-risk countries (simplified list)
        high_risk_countries = [
            'iran', 'north korea', 'myanmar', 'afghanistan'
        ]
        
        return country.lower() in high_risk_countries
    
    def _check_velocity_limits(self, user_id: int, transaction_data: Dict) -> bool:
        """Check if user exceeds velocity limits"""
        try:
            from src.models.user import Transaction
            
            # Check daily limit
            today = datetime.utcnow().date()
            daily_transactions = Transaction.query.filter(
                Transaction.user_id == user_id,
                Transaction.created_at >= today,
                Transaction.status == 'confirmed'
            ).all()
            
            daily_volume = sum(float(tx.amount) for tx in daily_transactions)
            current_amount = float(transaction_data.get('amount', 0))
            
            # Daily limit: $50,000
            return (daily_volume + current_amount) > 50000
            
        except Exception as e:
            logger.error(f"Velocity check error: {str(e)}")
            return False
    
    def _get_risk_factors(self, transaction_data: Dict) -> List[str]:
        """Get list of risk factors for transaction"""
        factors = []
        
        amount = float(transaction_data.get('amount', 0))
        if amount > 10000:
            factors.append('large_amount')
        
        if self._is_high_risk_country(transaction_data.get('country')):
            factors.append('high_risk_country')
        
        hour = datetime.now().hour
        if hour < 6 or hour > 22:
            factors.append('unusual_hours')
        
        return factors

# Global instances
kyc_service = None
aml_service = None

def get_kyc_service():
    """Get KYC service instance"""
    global kyc_service
    if kyc_service is None:
        kyc_service = KYCService()
    return kyc_service

def get_aml_service():
    """Get AML service instance"""
    global aml_service
    if aml_service is None:
        aml_service = AMLService()
    return aml_service
