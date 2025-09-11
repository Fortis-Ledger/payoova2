from flask import Blueprint, request, jsonify, send_file
from flask_cors import cross_origin
from src.models.user import User, AuthToken
from src.utils.security import require_auth, sanitize_input
from src.services.qr_service import get_qr_service
from io import BytesIO
import base64

qr_bp = Blueprint('qr', __name__)

# Initialize service lazily to avoid app context issues
qr_service = None

def get_qr_service_instance():
    """Get QR service instance, creating it if needed"""
    global qr_service
    if qr_service is None:
        qr_service = get_qr_service()
    return qr_service

def get_current_user():
    """Get current user from request context"""
    if hasattr(request, 'current_user'):
        user_id = request.current_user.get('user_id')
        return User.query.get(user_id)
    return None

@qr_bp.route('/qr/address/<network>', methods=['GET'])
@cross_origin()
@require_auth
def generate_address_qr(network):
    """Generate QR code for user's wallet address"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Get amount from query parameters
        amount = request.args.get('amount')

        # In a real app, get user's wallet address for this network
        # For now, we'll use a placeholder
        address = f"0x{user.id:040d}"  # Mock address based on user ID

        # Generate QR code
        qr_svc = get_qr_service_instance()
        result = qr_svc.generate_address_qr(address, network, amount)

        if result['success']:
            return jsonify({
                'success': True,
                'qr_code': result['qr_code'],
                'uri': result['uri'],
                'address': result['address'],
                'network': result['network'],
                'amount': result['amount']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to generate QR code: {str(e)}'
        }), 500

@qr_bp.route('/qr/transaction/<tx_hash>', methods=['GET'])
@cross_origin()
@require_auth
def generate_transaction_qr(tx_hash):
    """Generate QR code for transaction hash"""
    try:
        network = request.args.get('network', 'ethereum')

        # Generate QR code for transaction
        qr_svc = get_qr_service_instance()
        result = qr_svc.generate_transaction_qr(tx_hash, network)

        if result['success']:
            return jsonify({
                'success': True,
                'qr_code': result['qr_code'],
                'url': result['url'],
                'tx_hash': result['tx_hash'],
                'network': result['network']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to generate transaction QR code: {str(e)}'
        }), 500

@qr_bp.route('/qr/payment', methods=['POST'])
@cross_origin()
@require_auth
def generate_payment_qr():
    """Generate QR code for payment request"""
    try:
        data = request.get_json() or {}

        # Validate required fields
        if 'address' not in data or 'network' not in data:
            return jsonify({
                'success': False,
                'error': 'Address and network are required'
            }), 400

        # Sanitize inputs
        address = sanitize_input(data['address'])
        network = sanitize_input(data['network'])
        amount = data.get('amount')
        message = data.get('message')
        label = data.get('label')

        # Generate payment QR code
        qr_svc = get_qr_service_instance()
        result = qr_svc.generate_payment_request_qr(
            address, network, amount, message, label
        )

        if result['success']:
            return jsonify({
                'success': True,
                'qr_code': result['qr_code'],
                'uri': result['uri'],
                'address': result['address'],
                'network': result['network'],
                'amount': result['amount'],
                'message': result['message'],
                'label': result['label']
            })
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to generate payment QR code: {str(e)}'
        }), 500

@qr_bp.route('/qr/download/<qr_type>', methods=['GET'])
@cross_origin()
@require_auth
def download_qr_code(qr_type):
    """Download QR code as PNG file"""
    try:
        # Get parameters
        address = request.args.get('address')
        network = request.args.get('network', 'ethereum')
        tx_hash = request.args.get('tx_hash')
        amount = request.args.get('amount')
        message = request.args.get('message')
        label = request.args.get('label')

        # Generate QR code based on type
        qr_svc = get_qr_service_instance()
        if qr_type == 'address':
            if not address:
                return jsonify({'success': False, 'error': 'Address is required'}), 400
            result = qr_svc.generate_address_qr(address, network, amount)
        elif qr_type == 'transaction':
            if not tx_hash:
                return jsonify({'success': False, 'error': 'Transaction hash is required'}), 400
            result = qr_svc.generate_transaction_qr(tx_hash, network)
        elif qr_type == 'payment':
            if not address:
                return jsonify({'success': False, 'error': 'Address is required'}), 400
            result = qr_svc.generate_payment_request_qr(
                address, network, amount, message, label
            )
        else:
            return jsonify({'success': False, 'error': 'Invalid QR type'}), 400

        if not result['success']:
            return jsonify({'success': False, 'error': result['error']}), 500

        # Extract image data from base64
        qr_data = result['qr_code'].split(',')[1]  # Remove data:image/png;base64, prefix
        image_data = base64.b64decode(qr_data)

        # Create BytesIO object
        image_buffer = BytesIO(image_data)
        image_buffer.seek(0)

        # Generate filename
        if qr_type == 'address':
            filename = f'payoova-{network}-address-qr.png'
        elif qr_type == 'transaction':
            filename = f'payoova-{network}-tx-{tx_hash[:8]}-qr.png'
        else:
            filename = f'payoova-{network}-payment-qr.png'

        return send_file(
            image_buffer,
            mimetype='image/png',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to download QR code: {str(e)}'
        }), 500

@qr_bp.route('/qr/validate', methods=['POST'])
@cross_origin()
def validate_qr_data():
    """Validate QR code data"""
    try:
        data = request.get_json() or {}

        if 'qr_data' not in data:
            return jsonify({
                'success': False,
                'error': 'QR data is required'
            }), 400

        qr_data = data['qr_data']

        # Basic validation - check if it's a valid crypto address or URI
        is_valid = False
        address_type = None

        if qr_data.startswith('ethereum:'):
            # Ethereum payment URI
            is_valid = True
            address_type = 'ethereum_uri'
        elif qr_data.startswith('bitcoin:'):
            # Bitcoin payment URI
            is_valid = True
            address_type = 'bitcoin_uri'
        elif qr_data.startswith('0x') and len(qr_data) == 42:
            # Ethereum address
            is_valid = True
            address_type = 'ethereum_address'
        elif qr_data.startswith('1') or qr_data.startswith('3') or qr_data.startswith('bc1'):
            # Bitcoin address
            is_valid = True
            address_type = 'bitcoin_address'
        elif qr_data.startswith('https://'):
            # Explorer URL
            is_valid = True
            address_type = 'explorer_url'

        return jsonify({
            'success': True,
            'is_valid': is_valid,
            'address_type': address_type,
            'qr_data': qr_data
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to validate QR data: {str(e)}'
        }), 500
