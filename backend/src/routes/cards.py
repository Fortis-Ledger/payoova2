from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.user import User, db
from src.models.card import Card, CardTransaction
from datetime import datetime
import json

cards_bp = Blueprint('cards', __name__)

@cards_bp.route('/cards', methods=['GET'])
@jwt_required()
def get_cards():
    """Get all cards for the authenticated user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get query parameters
        card_type = request.args.get('type')  # 'virtual' or 'physical'
        include_sensitive = request.args.get('include_sensitive', 'false').lower() == 'true'
        
        # Build query
        query = Card.query.filter_by(user_id=current_user_id)
        
        if card_type:
            query = query.filter_by(card_type=card_type)
        
        cards = query.order_by(Card.created_at.desc()).all()
        
        cards_data = []
        for card in cards:
            card_dict = card.to_dict(include_sensitive=include_sensitive)
            cards_data.append(card_dict)
        
        return jsonify({
            'success': True,
            'cards': cards_data,
            'total': len(cards_data)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/cards', methods=['POST'])
@jwt_required()
def create_card():
    """Create a new card (virtual or physical)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['type', 'name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        card_type = data['type']
        if card_type not in ['virtual', 'physical']:
            return jsonify({'error': 'Invalid card type. Must be virtual or physical'}), 400
        
        # Check user limits (e.g., max 5 virtual cards, 2 physical cards)
        existing_virtual = Card.query.filter_by(user_id=current_user_id, card_type='virtual').count()
        existing_physical = Card.query.filter_by(user_id=current_user_id, card_type='physical').count()
        
        if card_type == 'virtual' and existing_virtual >= 5:
            return jsonify({'error': 'Maximum virtual card limit reached (5)'}), 400
        if card_type == 'physical' and existing_physical >= 2:
            return jsonify({'error': 'Maximum physical card limit reached (2)'}), 400
        
        # Create the card
        card = Card(
            user_id=current_user_id,
            card_type=card_type,
            card_name=data['name'],
            spending_limit=data.get('spending_limit', 1000.00),
            currency=data.get('currency', 'USD'),
            status='active' if card_type == 'virtual' else 'pending'
        )
        
        # Handle physical card specific fields
        if card_type == 'physical':
            if 'shipping_address' not in data:
                return jsonify({'error': 'Shipping address required for physical cards'}), 400
            
            # Store shipping address as JSON
            card.shipping_address = json.dumps(data['shipping_address'])
            card.shipping_status = 'processing'
        
        db.session.add(card)
        db.session.commit()
        
        # Return the created card (include sensitive data for the owner)
        return jsonify({
            'success': True,
            'message': f'{card_type.title()} card created successfully',
            'card': card.to_dict(include_sensitive=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/cards/<card_id>', methods=['GET'])
@jwt_required()
def get_card(card_id):
    """Get a specific card by ID"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        card = Card.query.filter_by(public_id=card_id, user_id=current_user_id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        include_sensitive = request.args.get('include_sensitive', 'false').lower() == 'true'
        
        return jsonify({
            'success': True,
            'card': card.to_dict(include_sensitive=include_sensitive)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/cards/<card_id>', methods=['PUT'])
@jwt_required()
def update_card(card_id):
    """Update card details"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        card = Card.query.filter_by(public_id=card_id, user_id=current_user_id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            card.card_name = data['name']
        if 'spending_limit' in data:
            card.spending_limit = data['spending_limit']
        if 'daily_limit' in data:
            card.daily_limit = data['daily_limit']
        if 'monthly_limit' in data:
            card.monthly_limit = data['monthly_limit']
        
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Card updated successfully',
            'card': card.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/cards/<card_id>/freeze', methods=['POST'])
@jwt_required()
def freeze_card(card_id):
    """Freeze/unfreeze a card"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        card = Card.query.filter_by(public_id=card_id, user_id=current_user_id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        action = request.get_json().get('action', 'freeze')  # 'freeze' or 'unfreeze'
        
        if action == 'freeze':
            card.freeze()
            message = 'Card frozen successfully'
        elif action == 'unfreeze':
            card.unfreeze()
            message = 'Card unfrozen successfully'
        else:
            return jsonify({'error': 'Invalid action. Use freeze or unfreeze'}), 400
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': message,
            'card': card.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/cards/<card_id>', methods=['DELETE'])
@jwt_required()
def delete_card(card_id):
    """Delete/cancel a card"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        card = Card.query.filter_by(public_id=card_id, user_id=current_user_id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        # For safety, cancel instead of delete if it has transactions
        if card.total_transactions > 0:
            card.cancel()
            db.session.commit()
            message = 'Card cancelled successfully'
        else:
            db.session.delete(card)
            db.session.commit()
            message = 'Card deleted successfully'
        
        return jsonify({
            'success': True,
            'message': message
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/cards/<card_id>/load', methods=['POST'])
@jwt_required()
def load_card(card_id):
    """Load money onto a card from wallet"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        card = Card.query.filter_by(public_id=card_id, user_id=current_user_id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        if card.status != 'active':
            return jsonify({'error': 'Card is not active'}), 400
        
        data = request.get_json()
        amount = float(data.get('amount', 0))
        
        if amount <= 0:
            return jsonify({'error': 'Amount must be greater than 0'}), 400
        
        if amount > 10000:  # Max load amount
            return jsonify({'error': 'Maximum load amount is $10,000'}), 400
        
        # Check if loading would exceed spending limit
        if card.balance + amount > card.spending_limit:
            return jsonify({'error': 'Loading would exceed card spending limit'}), 400
        
        # In a real implementation, you'd deduct from user's wallet
        # For now, just add to card balance
        card.balance += amount
        
        # Create transaction record
        transaction = CardTransaction(
            card_id=card.id,
            user_id=current_user_id,
            transaction_type='load',
            amount=amount,
            currency=card.currency,
            description=f'Card load - ${amount:.2f}',
            status='completed'
        )
        
        card.update_transaction_stats(amount)
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Card loaded with ${amount:.2f}',
            'card': card.to_dict(),
            'transaction': transaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/cards/<card_id>/transactions', methods=['GET'])
@jwt_required()
def get_card_transactions(card_id):
    """Get transaction history for a specific card"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        card = Card.query.filter_by(public_id=card_id, user_id=current_user_id).first()
        
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 10, type=int), 100)
        transaction_type = request.args.get('type')
        
        # Build query
        query = CardTransaction.query.filter_by(card_id=card.id)
        
        if transaction_type:
            query = query.filter_by(transaction_type=transaction_type)
        
        # Paginate
        transactions = query.order_by(CardTransaction.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'transactions': [t.to_dict() for t in transactions.items],
            'pagination': {
                'page': page,
                'pages': transactions.pages,
                'per_page': per_page,
                'total': transactions.total,
                'has_next': transactions.has_next,
                'has_prev': transactions.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@cards_bp.route('/cards/stats', methods=['GET'])
@jwt_required()
def get_card_stats():
    """Get card statistics for the user"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get card counts
        total_cards = Card.query.filter_by(user_id=current_user_id).count()
        virtual_cards = Card.query.filter_by(user_id=current_user_id, card_type='virtual').count()
        physical_cards = Card.query.filter_by(user_id=current_user_id, card_type='physical').count()
        active_cards = Card.query.filter_by(user_id=current_user_id, status='active').count()
        
        # Get financial stats
        cards = Card.query.filter_by(user_id=current_user_id).all()
        total_balance = sum(float(card.balance) for card in cards)
        total_spent = sum(float(card.total_spent) for card in cards)
        total_transactions = sum(card.total_transactions for card in cards)
        
        return jsonify({
            'success': True,
            'stats': {
                'cards': {
                    'total': total_cards,
                    'virtual': virtual_cards,
                    'physical': physical_cards,
                    'active': active_cards
                },
                'financial': {
                    'total_balance': total_balance,
                    'total_spent': total_spent,
                    'total_transactions': total_transactions
                }
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
