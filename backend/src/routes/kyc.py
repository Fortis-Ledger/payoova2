from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from src.models.user import User, db
from src.utils.security import require_auth, require_admin, sanitize_input
from src.utils.rate_limiter import kyc_rate_limit
from src.services.kyc import get_kyc_service, get_aml_service, KYCVerification, AMLCheck
from datetime import datetime
import asyncio

kyc_bp = Blueprint('kyc', __name__)

def get_current_user():
    """Get current user from request context"""
    if hasattr(request, 'current_user'):
        user_id = request.current_user.get('user_id')
        return User.query.get(user_id)
    return None

@kyc_bp.route('/kyc/status', methods=['GET'])
@cross_origin()
@require_auth
def get_kyc_status():
    """Get KYC status for current user"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        kyc_service = get_kyc_service()
        status = kyc_service.get_kyc_status(user.id)
        
        return jsonify({
            'success': True,
            'kyc_status': status
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to get KYC status: {str(e)}'}), 500

@kyc_bp.route('/kyc/verify', methods=['POST'])
@cross_origin()
@require_auth
@kyc_rate_limit()
def submit_kyc_verification():
    """Submit KYC verification documents"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        data = request.get_json() or {}
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'date_of_birth', 'nationality']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Sanitize inputs
        document_data = {
            'first_name': sanitize_input(data['first_name']),
            'last_name': sanitize_input(data['last_name']),
            'date_of_birth': data['date_of_birth'],
            'nationality': sanitize_input(data['nationality']),
            'country_of_residence': sanitize_input(data.get('country_of_residence', '')),
            'document_type': sanitize_input(data.get('document_type', 'passport')),
            'document_number': sanitize_input(data.get('document_number', '')),
            'address_line1': sanitize_input(data.get('address_line1', '')),
            'address_line2': sanitize_input(data.get('address_line2', '')),
            'city': sanitize_input(data.get('city', '')),
            'state': sanitize_input(data.get('state', '')),
            'postal_code': sanitize_input(data.get('postal_code', '')),
            'country': sanitize_input(data.get('country', ''))
        }
        
        # Submit for verification
        kyc_service = get_kyc_service()
        
        # Run async verification
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(kyc_service.verify_identity(user.id, document_data))
        loop.close()
        
        if result['success']:
            return jsonify({
                'success': True,
                'message': 'KYC verification submitted successfully',
                'verification_status': 'under_review'
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'KYC verification failed: {str(e)}'}), 500

@kyc_bp.route('/kyc/documents', methods=['GET'])
@cross_origin()
@require_auth
def get_kyc_documents():
    """Get user's KYC documents"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        documents = []
        for doc in user.kyc_documents:
            documents.append({
                'id': doc.id,
                'document_type': doc.document_type,
                'status': doc.status.value,
                'uploaded_at': doc.uploaded_at.isoformat(),
                'verified_at': doc.verified_at.isoformat() if doc.verified_at else None,
                'expires_at': doc.expires_at.isoformat() if doc.expires_at else None,
                'rejection_reason': doc.rejection_reason
            })
        
        return jsonify({
            'success': True,
            'documents': documents
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to get documents: {str(e)}'}), 500

@kyc_bp.route('/aml/screen', methods=['POST'])
@cross_origin()
@require_auth
@kyc_rate_limit()
def run_aml_screening():
    """Run AML screening for current user"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get user's KYC data
        kyc_verification = KYCVerification.query.filter_by(user_id=user.id).first()
        if not kyc_verification:
            return jsonify({
                'success': False,
                'error': 'KYC verification required before AML screening'
            }), 400
        
        user_data = {
            'first_name': kyc_verification.first_name,
            'last_name': kyc_verification.last_name,
            'date_of_birth': kyc_verification.date_of_birth.isoformat() if kyc_verification.date_of_birth else None,
            'nationality': kyc_verification.nationality,
            'country': kyc_verification.country_of_residence
        }
        
        # Run AML screening
        aml_service = get_aml_service()
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(aml_service.screen_user(user.id, user_data))
        loop.close()
        
        if result['success']:
            return jsonify({
                'success': True,
                'screening_result': {
                    'clear': result['clear'],
                    'risk_score': result['risk_score'],
                    'hits': result['hits']
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'AML screening failed: {str(e)}'}), 500

@kyc_bp.route('/aml/status', methods=['GET'])
@cross_origin()
@require_auth
def get_aml_status():
    """Get AML screening status for current user"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get latest AML check
        aml_check = AMLCheck.query.filter_by(user_id=user.id).order_by(AMLCheck.created_at.desc()).first()
        
        if not aml_check:
            return jsonify({
                'success': True,
                'aml_status': {
                    'status': 'not_screened',
                    'clear': False,
                    'risk_score': 0.0
                }
            })
        
        return jsonify({
            'success': True,
            'aml_status': {
                'status': aml_check.status,
                'clear': aml_check.status == 'clear',
                'risk_score': aml_check.risk_score,
                'sanctions_hit': aml_check.sanctions_hit,
                'pep_hit': aml_check.pep_hit,
                'adverse_media_hit': aml_check.adverse_media_hit,
                'checked_at': aml_check.created_at.isoformat()
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to get AML status: {str(e)}'}), 500

# Admin endpoints
@kyc_bp.route('/admin/kyc/pending', methods=['GET'])
@cross_origin()
@require_auth
@require_admin
def get_pending_kyc_verifications():
    """Get pending KYC verifications for admin review"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        from src.services.kyc import KYCStatus
        
        pending_verifications = KYCVerification.query.filter_by(
            status=KYCStatus.UNDER_REVIEW
        ).order_by(KYCVerification.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        verifications = []
        for verification in pending_verifications.items:
            user = User.query.get(verification.user_id)
            verifications.append({
                'id': verification.id,
                'user_id': verification.user_id,
                'user_email': user.email if user else 'Unknown',
                'user_name': user.name if user else 'Unknown',
                'first_name': verification.first_name,
                'last_name': verification.last_name,
                'nationality': verification.nationality,
                'status': verification.status.value,
                'created_at': verification.created_at.isoformat(),
                'verification_level': verification.verification_level
            })
        
        return jsonify({
            'success': True,
            'verifications': verifications,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pending_verifications.total,
                'pages': pending_verifications.pages,
                'has_next': pending_verifications.has_next,
                'has_prev': pending_verifications.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to get pending verifications: {str(e)}'}), 500

@kyc_bp.route('/admin/kyc/<int:verification_id>/approve', methods=['POST'])
@cross_origin()
@require_auth
@require_admin
def approve_kyc_verification(verification_id):
    """Approve KYC verification"""
    try:
        admin_user = get_current_user()
        if not admin_user:
            return jsonify({'success': False, 'error': 'Admin user not found'}), 404
        
        verification = KYCVerification.query.get_or_404(verification_id)
        data = request.get_json() or {}
        
        from src.services.kyc import KYCStatus
        from datetime import timedelta
        
        verification.status = KYCStatus.APPROVED
        verification.verification_level = data.get('level', 1)
        verification.verified_by = admin_user.email
        verification.verification_notes = sanitize_input(data.get('notes', ''))
        verification.verified_at = datetime.utcnow()
        verification.expires_at = datetime.utcnow() + timedelta(days=365)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'KYC verification approved successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': f'Failed to approve verification: {str(e)}'}), 500

@kyc_bp.route('/admin/kyc/<int:verification_id>/reject', methods=['POST'])
@cross_origin()
@require_auth
@require_admin
def reject_kyc_verification(verification_id):
    """Reject KYC verification"""
    try:
        admin_user = get_current_user()
        if not admin_user:
            return jsonify({'success': False, 'error': 'Admin user not found'}), 404
        
        verification = KYCVerification.query.get_or_404(verification_id)
        data = request.get_json() or {}
        
        if not data.get('reason'):
            return jsonify({
                'success': False,
                'error': 'Rejection reason is required'
            }), 400
        
        from src.services.kyc import KYCStatus
        
        verification.status = KYCStatus.REJECTED
        verification.verified_by = admin_user.email
        verification.verification_notes = sanitize_input(data['reason'])
        verification.verified_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'KYC verification rejected'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': f'Failed to reject verification: {str(e)}'}), 500

@kyc_bp.route('/admin/aml/flagged', methods=['GET'])
@cross_origin()
@require_auth
@require_admin
def get_flagged_transactions():
    """Get flagged transactions for AML review"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        
        from src.services.kyc import TransactionMonitoring
        
        flagged_transactions = TransactionMonitoring.query.filter_by(
            flagged=True,
            review_status='pending'
        ).order_by(TransactionMonitoring.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        transactions = []
        for monitoring in flagged_transactions.items:
            from src.models.user import Transaction
            transaction = Transaction.query.get(monitoring.transaction_id)
            user = User.query.get(monitoring.user_id)
            
            transactions.append({
                'id': monitoring.id,
                'transaction_id': monitoring.transaction_id,
                'user_id': monitoring.user_id,
                'user_email': user.email if user else 'Unknown',
                'transaction_hash': transaction.transaction_hash if transaction else None,
                'amount': transaction.amount if transaction else '0',
                'network': transaction.network if transaction else 'Unknown',
                'risk_score': monitoring.risk_score,
                'large_amount': monitoring.large_amount,
                'high_risk_country': monitoring.high_risk_country,
                'velocity_breach': monitoring.velocity_breach,
                'created_at': monitoring.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'flagged_transactions': transactions,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': flagged_transactions.total,
                'pages': flagged_transactions.pages,
                'has_next': flagged_transactions.has_next,
                'has_prev': flagged_transactions.has_prev
            }
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to get flagged transactions: {str(e)}'}), 500
