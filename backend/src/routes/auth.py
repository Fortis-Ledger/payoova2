from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from src.models.user import User, db
from functools import wraps
import os
import requests

auth_bp = Blueprint('auth', __name__)

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')

def verify_supabase_token(token):
    """Verify Supabase JWT token"""
    try:
        headers = {'Authorization': f'Bearer {token}', 'apikey': SUPABASE_ANON_KEY}
        response = requests.get(f'{SUPABASE_URL}/auth/v1/user', headers=headers)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return None

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'No token provided'}), 401
            
        token = auth_header.split(' ')[1]
        user_data = verify_supabase_token(token)
        
        if not user_data:
            return jsonify({'message': 'Invalid token'}), 401
            
        return f(user_data, *args, **kwargs)
    return decorated


@auth_bp.route('/auth/sync-user', methods=['POST'])
@cross_origin()
def sync_user():
    """Sync Supabase user with local database"""
    data = request.get_json()
    
    if not data or 'user' not in data:
        return jsonify({'message': 'User data required'}), 400
        
    user_data = data['user']
    supabase_id = user_data.get('id')
    email = user_data.get('email')
    name = user_data.get('user_metadata', {}).get('full_name') or user_data.get('email', '').split('@')[0]
    
    if not supabase_id or not email:
        return jsonify({'message': 'Invalid user data'}), 400
        
    try:
        # Check if user exists
        existing_user = User.query.filter_by(supabase_id=supabase_id).first()
        
        if existing_user:
            # Update existing user
            existing_user.email = email
            existing_user.name = name
            db.session.commit()
            return jsonify({
                'message': 'User updated successfully',
                'user': {
                    'id': existing_user.id,
                    'email': existing_user.email,
                    'name': existing_user.name,
                    'supabase_id': existing_user.supabase_id
                }
            })
        else:
            # Create new user
            new_user = User(
                supabase_id=supabase_id,
                email=email,
                name=name,
                is_active=True
            )
            db.session.add(new_user)
            db.session.commit()
            
            # Auto-generate wallets for new user
            try:
                from src.services.blockchain import get_blockchain_service
                from src.models.user import Wallet
                from src.utils.crypto_utils import WalletEncryption
                
                blockchain_service = get_blockchain_service()
                networks = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism']
                wallets_created = []
                
                for network in networks:
                    try:
                        wallet_data = blockchain_service.generate_wallet(network)
                        if wallet_data and wallet_data.get('success'):
                            # Encrypt private key
                            encrypted_private_key = WalletEncryption.encrypt_private_key(wallet_data['private_key'])
                            
                            # Create wallet record
                            new_wallet = Wallet(
                                user_id=new_user.id,
                                address=wallet_data['address'],
                                network=network,
                                encrypted_private_key=encrypted_private_key,
                                balance='0.0',
                                is_active=True
                            )
                            
                            db.session.add(new_wallet)
                            wallets_created.append({
                                'network': network,
                                'address': wallet_data['address']
                            })
                    except Exception as e:
                        print(f"Failed to auto-generate {network} wallet for user {new_user.id}: {str(e)}")
                
                db.session.commit()
                
                return jsonify({
                    'message': 'User created successfully with wallets',
                    'user': {
                        'id': new_user.id,
                        'email': new_user.email,
                        'name': new_user.name,
                        'supabase_id': new_user.supabase_id
                    },
                    'wallets_created': wallets_created
                }), 201
                
            except Exception as wallet_error:
                print(f"Failed to auto-generate wallets: {str(wallet_error)}")
                return jsonify({
                    'message': 'User created successfully but wallet generation failed',
                    'user': {
                        'id': new_user.id,
                        'email': new_user.email,
                        'name': new_user.name,
                        'supabase_id': new_user.supabase_id
                    },
                    'wallet_error': str(wallet_error)
                }), 201
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error syncing user: {str(e)}'}), 500

@auth_bp.route('/auth/me', methods=['GET'])
@cross_origin()
@login_required
def get_current_user(user_data):
    """Get current user info from Supabase"""
    try:
        # Get local user data if exists
        local_user = User.query.filter_by(supabase_id=user_data.get('id')).first()
        
        response_data = {
            'id': user_data.get('id'),
            'email': user_data.get('email'),
            'name': user_data.get('user_metadata', {}).get('full_name') or user_data.get('email', '').split('@')[0]
        }
        
        if local_user:
            response_data['local_id'] = local_user.id
            
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({'message': f'Error getting user: {str(e)}'}), 500

@auth_bp.route('/auth/verify', methods=['GET', 'OPTIONS'])
@cross_origin()
def verify_token():
    """Verify Supabase JWT token"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        user_data = verify_supabase_token(token)
        
        if user_data:
            return jsonify({'valid': True, 'user': user_data})
        else:
            return jsonify({'valid': False, 'message': 'Invalid token'}), 401
            
    except Exception as e:
        return jsonify({'valid': False, 'message': f'Token verification failed: {str(e)}'}), 401

@auth_bp.route('/auth/generate-wallets', methods=['POST'])
@cross_origin()
@login_required
def generate_wallets_for_user(user_data):
    """Generate wallets for existing user who doesn't have them"""
    try:
        # Get local user
        local_user = User.query.filter_by(supabase_id=user_data.get('id')).first()
        if not local_user:
            return jsonify({'message': 'User not found in local database'}), 404
            
        # Check if user already has wallets
        from src.models.user import Wallet
        existing_wallets = Wallet.query.filter_by(user_id=local_user.id).all()
        if existing_wallets:
            return jsonify({
                'message': 'User already has wallets',
                'existing_wallets': [{'network': w.network, 'address': w.address} for w in existing_wallets]
            }), 200
            
        # Generate wallets
        from src.services.blockchain import get_blockchain_service
        from src.utils.crypto_utils import WalletEncryption
        
        blockchain_service = get_blockchain_service()
        networks = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism']
        wallets_created = []
        
        for network in networks:
            try:
                wallet_data = blockchain_service.generate_wallet(network)
                if wallet_data and wallet_data.get('success'):
                    # Encrypt private key
                    encrypted_private_key = WalletEncryption.encrypt_private_key(wallet_data['private_key'])
                    
                    # Create wallet record
                    new_wallet = Wallet(
                        user_id=local_user.id,
                        address=wallet_data['address'],
                        network=network,
                        encrypted_private_key=encrypted_private_key,
                        balance='0.0',
                        is_active=True
                    )
                    
                    db.session.add(new_wallet)
                    wallets_created.append({
                        'network': network,
                        'address': wallet_data['address']
                    })
            except Exception as e:
                print(f"Failed to generate {network} wallet for user {local_user.id}: {str(e)}")
        
        db.session.commit()
        
        return jsonify({
            'message': 'Wallets generated successfully',
            'wallets_created': wallets_created
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error generating wallets: {str(e)}'}), 500

