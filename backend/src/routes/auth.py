from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from src.models.user import User, db
from auth0 import Auth0Error
import auth0.authentication
import auth0.management
import os

auth_bp = Blueprint('auth', __name__)

# Auth0 configuration
AUTH0_DOMAIN = os.getenv('AUTH0_DOMAIN')
AUTH0_CLIENT_ID = os.getenv('AUTH0_CLIENT_ID')
AUTH0_CLIENT_SECRET = os.getenv('AUTH0_CLIENT_SECRET')
AUTH0_AUDIENCE = os.getenv('AUTH0_AUDIENCE')

# Initialize Auth0 authentication
auth0_auth = auth0.authentication.GetToken(AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET)

# Get management token
try:
    token_response = auth0_auth.client_credentials(f'https://{AUTH0_DOMAIN}/api/v2/')
    auth0_mgmt = auth0.management.Auth0(AUTH0_DOMAIN, token_response['access_token'])
except Exception as e:
    print(f"Auth0 management initialization failed: {e}")
    auth0_mgmt = None


@auth_bp.route('/auth/sync-user', methods=['POST', 'OPTIONS'])
@cross_origin()
def sync_user():
    """Sync Auth0 user with local database"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()

        if not data or not all(k in data for k in ('id', 'email', 'name')):
            return jsonify({'message': 'Missing required fields'}), 400

        # Check if user already exists
        existing_user = User.query.filter_by(auth0_id=data['id']).first()

        if existing_user:
            # Update existing user
            existing_user.name = data['name']
            existing_user.email = data['email']
            db.session.commit()
            return jsonify({
                'message': 'User updated successfully',
                'user': existing_user.to_dict()
            }), 200

        # Check if email already exists
        email_user = User.query.filter_by(email=data['email']).first()
        if email_user:
            # Link existing user to Auth0
            email_user.auth0_id = data['id']
            db.session.commit()
            return jsonify({
                'message': 'User linked successfully',
                'user': email_user.to_dict()
            }), 200

        # Create new user
        user = User(
            auth0_id=data['id'],
            name=data['name'],
            email=data['email'],
            role='user'
        )

        db.session.add(user)
        db.session.commit()

        # Auto-generate wallets for new user
        from src.services.blockchain import get_blockchain_service
        from src.models.user import Wallet
        from src.utils.crypto_utils import WalletEncryption
        
        blockchain_service = get_blockchain_service()
        networks = ['ethereum', 'polygon', 'bsc']
        
        for network in networks:
            try:
                wallet_data = blockchain_service.generate_wallet(network)
                if wallet_data['success']:
                    # Encrypt private key
                    encrypted_private_key = WalletEncryption.encrypt_private_key(wallet_data['private_key'])
                    
                    # Create wallet record
                    new_wallet = Wallet(
                        user_id=user.id,
                        address=wallet_data['address'],
                        network=network,
                        encrypted_private_key=encrypted_private_key,
                        balance='0.0',
                        is_active=True
                    )
                    
                    db.session.add(new_wallet)
            except Exception as e:
                print(f"Failed to auto-generate {network} wallet for user {user.id}: {str(e)}")
        
        try:
            db.session.commit()
        except Exception as e:
            print(f"Failed to save auto-generated wallets: {str(e)}")

        return jsonify({
            'message': 'User created successfully with wallets',
            'user': user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error syncing user: {str(e)}'}), 500

@auth_bp.route('/auth/verify', methods=['GET', 'OPTIONS'])
@cross_origin()
def verify_token():
    """Verify Auth0 JWT token"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'No token provided'}), 401

        token = auth_header.split(' ')[1]

        # For now, decode token without verification for development
        # In production, you should implement proper JWT verification
        try:
            import base64
            import json
            
            # Decode JWT payload (without verification for development)
            parts = token.split('.')
            if len(parts) != 3:
                return jsonify({'message': 'Invalid token format'}), 401
            
            # Add padding if needed
            payload = parts[1]
            payload += '=' * (4 - len(payload) % 4)
            
            # Decode payload
            decoded_bytes = base64.urlsafe_b64decode(payload)
            jwt_token = json.loads(decoded_bytes)
            
        except Exception as jwt_error:
            print(f"JWT decode error: {jwt_error}")
            return jsonify({'message': 'Invalid token'}), 401

        # Extract user info from token
        auth0_id = jwt_token['sub']
        email = jwt_token.get('email', '')
        name = jwt_token.get('name', '')

        # Find or create user in local DB
        user = User.query.filter_by(auth0_id=auth0_id).first()

        if not user:
            # Try to find by email
            user = User.query.filter_by(email=email).first()
            if user:
                user.auth0_id = auth0_id
            else:
                # Create new user
                user = User(
                    auth0_id=auth0_id,
                    name=name,
                    email=email,
                    role='user'
                )
                db.session.add(user)

            db.session.commit()

        if not user or not user.is_active:
            return jsonify({'message': 'User not found or inactive'}), 401

        return jsonify(user.to_dict()), 200

    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': f'Token verification error: {str(e)}'}), 500

@auth_bp.route('/auth/user-info', methods=['GET', 'OPTIONS'])
@cross_origin()
def get_user_info():
    """Get current user info from Auth0 token"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'No token provided'}), 401

        token = auth_header.split(' ')[1]

        # Decode token without verification for user info
        import base64
        import json

        # Get payload from JWT
        payload = token.split('.')[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload)
        token_data = json.loads(decoded)

        return jsonify({
            'sub': token_data.get('sub'),
            'email': token_data.get('email'),
            'name': token_data.get('name'),
            'nickname': token_data.get('nickname')
        }), 200

    except Exception as e:
        return jsonify({'message': f'Error getting user info: {str(e)}'}), 500

