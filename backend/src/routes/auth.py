from flask import Blueprint, jsonify, request
from flask_cors import cross_origin
from src.models.user import User, AuthToken, db
from datetime import datetime, timedelta
import secrets

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/auth/signup', methods=['POST', 'OPTIONS'])
@cross_origin()
def signup():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ('name', 'email', 'password')):
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'message': 'User already exists with this email'}), 400
        
        # Create new user
        user = User(
            name=data['name'],
            email=data['email'],
            role='user'
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Create auth token
        token = secrets.token_urlsafe(32)
        auth_token = AuthToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        db.session.add(auth_token)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user.to_dict(),
            'token': token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating user: {str(e)}'}), 500

@auth_bp.route('/auth/login', methods=['POST', 'OPTIONS'])
@cross_origin()
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or not all(k in data for k in ('email', 'password')):
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'message': 'Account is deactivated'}), 401
        
        # Create auth token
        token = secrets.token_urlsafe(32)
        auth_token = AuthToken(
            user_id=user.id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        db.session.add(auth_token)
        db.session.commit()
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'token': token
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Login error: {str(e)}'}), 500

@auth_bp.route('/auth/verify', methods=['GET', 'OPTIONS'])
@cross_origin()
def verify_token():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'message': 'No token provided'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Find auth token
        auth_token = AuthToken.query.filter_by(token=token, is_active=True).first()
        
        if not auth_token or auth_token.is_expired():
            return jsonify({'message': 'Invalid or expired token'}), 401
        
        user = User.query.get(auth_token.user_id)
        if not user or not user.is_active:
            return jsonify({'message': 'User not found or inactive'}), 401
        
        return jsonify(user.to_dict()), 200
        
    except Exception as e:
        return jsonify({'message': f'Token verification error: {str(e)}'}), 500

@auth_bp.route('/auth/logout', methods=['POST', 'OPTIONS'])
@cross_origin()
def logout():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            # Deactivate token
            auth_token = AuthToken.query.filter_by(token=token).first()
            if auth_token:
                auth_token.is_active = False
                db.session.commit()
        
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Logout error: {str(e)}'}), 500

