from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from src.models.user import User, Wallet, Transaction, AuthToken, db
from src.utils.security import require_auth, validate_ethereum_address, sanitize_input
from src.utils.crypto_utils import WalletEncryption
from src.utils.rate_limiter import wallet_rate_limit, transaction_rate_limit
from src.services.blockchain import get_blockchain_service
from src.services.transaction_monitor import get_transaction_monitor
from datetime import datetime
import secrets
import asyncio

wallet_bp = Blueprint('wallet_simple', __name__)

# Initialize service lazily to avoid app context issues
blockchain_service = None

def get_blockchain_service_instance():
    """Get blockchain service instance, creating it if needed"""
    global blockchain_service
    if blockchain_service is None:
        blockchain_service = get_blockchain_service()
    return blockchain_service

def get_current_user():
    """Get current user from request context"""
    try:
        if hasattr(request, 'current_user'):
            user_id = request.current_user.get('user_id')
            if user_id:
                return User.query.get(user_id)
        
        # Fallback: try to get user from Auth0 token
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
            import base64
            import json
            
            # Decode JWT payload (without verification for development)
            parts = token.split('.')
            if len(parts) == 3:
                payload = parts[1]
                payload += '=' * (4 - len(payload) % 4)
                decoded_bytes = base64.urlsafe_b64decode(payload)
                jwt_token = json.loads(decoded_bytes)
                
                auth0_id = jwt_token.get('sub')
                if auth0_id:
                    return User.query.filter_by(auth0_id=auth0_id).first()
    except Exception as e:
        print(f"Error getting current user: {e}")
    
    return None

@wallet_bp.route('/wallet/balance/<network>', methods=['GET'])
@cross_origin()
@require_auth
def get_wallet_balance(network):
    """Get wallet balance for a specific network"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Find user's wallet for this network
        wallet = Wallet.query.filter_by(
            user_id=user.id,
            network=network,
            is_active=True
        ).first()

        if not wallet:
            return jsonify({
                'success': False,
                'error': f'No active wallet found for {network}'
            }), 404

        # Get balance from blockchain
        blockchain_svc = get_blockchain_service_instance()
        balance_result = blockchain_svc.get_balance(wallet.address, network)

        if balance_result['success']:
            # Update wallet balance in database
            wallet.balance = balance_result['balance']
            db.session.commit()

            return jsonify({
                'success': True,
                'balance': balance_result['balance'],
                'address': wallet.address,
                'network': network
            })
        else:
            return jsonify({
                'success': False,
                'error': balance_result['error']
            }), 500

    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to get balance: {str(e)}'}), 500

@wallet_bp.route('/wallet/create/<network>', methods=['POST'])
@cross_origin()
@require_auth
@wallet_rate_limit()
def create_wallet(network):
    """Create a new wallet for specified network"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Check if user already has a wallet for this network
        existing_wallet = Wallet.query.filter_by(
            user_id=user.id,
            network=network
        ).first()

        if existing_wallet:
            return jsonify({
                'success': False,
                'error': f'Wallet already exists for {network}'
            }), 400

        # Generate new wallet
        blockchain_svc = get_blockchain_service_instance()
        wallet_data = blockchain_svc.generate_wallet(network)

        if not wallet_data['success']:
            return jsonify({
                'success': False,
                'error': wallet_data['error']
            }), 500

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
        db.session.commit()

        return jsonify({
            'success': True,
            'wallet': {
                'id': new_wallet.id,
                'address': new_wallet.address,
                'network': new_wallet.network,
                'balance': new_wallet.balance,
                'created_at': new_wallet.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to create wallet: {str(e)}'
        }), 500

@wallet_bp.route('/wallet/transfer', methods=['POST'])
@cross_origin()
@require_auth
@transaction_rate_limit()
def transfer_crypto():
    """Transfer cryptocurrency between addresses"""
    try:
        data = request.get_json() or {}

        # Validate required fields
        required_fields = ['from_address', 'to_address', 'amount', 'network']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400

        # Sanitize inputs
        from_address = sanitize_input(data['from_address'])
        to_address = sanitize_input(data['to_address'])
        amount = data['amount']
        network = sanitize_input(data['network'])
        currency = sanitize_input(data.get('currency', 'ETH'))

        # Validate addresses
        if not validate_ethereum_address(from_address):
            return jsonify({
                'success': False,
                'error': 'Invalid from address'
            }), 400

        if not validate_ethereum_address(to_address):
            return jsonify({
                'success': False,
                'error': 'Invalid to address'
            }), 400

        # Validate amount
        try:
            send_amount = float(amount)
            if send_amount <= 0:
                return jsonify({
                    'success': False,
                    'error': 'Amount must be positive'
                }), 400
        except ValueError:
            return jsonify({
                'success': False,
                'error': 'Invalid amount format'
            }), 400

        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Find and validate wallet ownership
        wallet = Wallet.query.filter_by(
            user_id=user.id,
            address=from_address,
            network=network,
            is_active=True
        ).first()

        if not wallet:
            return jsonify({
                'success': False,
                'error': 'Wallet not found or not owned by user'
            }), 404

        # Get current balance
        blockchain_svc = get_blockchain_service_instance()
        balance_result = blockchain_svc.get_balance(from_address, network)
        if not balance_result['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to get wallet balance'
            }), 500

        current_balance = float(balance_result['balance'])

        # Estimate gas fee
        gas_result = blockchain_svc.estimate_gas_fee(network)
        if not gas_result['success']:
            return jsonify({
                'success': False,
                'error': 'Failed to estimate gas fee'
            }), 500

        gas_fee = float(gas_result['gas_fee'])
        total_required = send_amount + gas_fee

        # Check balance
        if current_balance < total_required:
            return jsonify({
                'success': False,
                'error': f'Insufficient balance. Required: {total_required}, Available: {current_balance}'
            }), 400

        # Decrypt private key
        try:
            private_key = WalletEncryption.decrypt_private_key(wallet.encrypted_private_key)
        except Exception:
            return jsonify({
                'success': False,
                'error': 'Failed to decrypt private key'
            }), 500

        # Send transaction
        tx_result = blockchain_svc.send_transaction(
            from_address, to_address, str(send_amount), private_key, network
        )

        if not tx_result['success']:
            return jsonify({
                'success': False,
                'error': tx_result['error']
            }), 500

        # Create transaction record
        new_transaction = Transaction(
            user_id=user.id,
            wallet_id=wallet.id,
            transaction_hash=tx_result['transaction_hash'],
            from_address=from_address,
            to_address=to_address,
            amount=str(send_amount),
            currency=currency,
            network=network,
            transaction_type='send',
            status='pending',
            gas_fee=str(gas_fee),
            created_at=datetime.utcnow()
        )

        db.session.add(new_transaction)

        # Update wallet balance (optimistic update)
        wallet.balance = str(current_balance - total_required)

        db.session.commit()

        return jsonify({
            'success': True,
            'transaction': {
                'id': new_transaction.id,
                'transaction_hash': tx_result['transaction_hash'],
                'from_address': from_address,
                'to_address': to_address,
                'amount': str(send_amount),
                'currency': currency,
                'network': network,
                'status': 'pending',
                'gas_fee': str(gas_fee),
                'created_at': new_transaction.created_at.isoformat()
            }
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Transaction failed: {str(e)}'
        }), 500

@wallet_bp.route('/wallet/list', methods=['GET'])
@cross_origin()
@require_auth
def list_wallets():
    """List all wallets for the current user"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Get all active wallets for the user
        wallets = Wallet.query.filter_by(
            user_id=user.id,
            is_active=True
        ).all()

        wallet_list = []
        for wallet in wallets:
            wallet_data = wallet.to_dict()
            wallet_list.append(wallet_data)

        return jsonify({
            'success': True,
            'wallets': wallet_list
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to list wallets: {str(e)}'
        }), 500

@wallet_bp.route('/wallet/refresh-balances', methods=['POST'])
@cross_origin()
@require_auth
def refresh_balances():
    """Refresh balances for all user wallets"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Get all active wallets for the user
        wallets = Wallet.query.filter_by(
            user_id=user.id,
            is_active=True
        ).all()

        blockchain_svc = get_blockchain_service_instance()
        balances = {}

        for wallet in wallets:
            balance_result = blockchain_svc.get_balance(wallet.address, wallet.network)
            if balance_result['success']:
                wallet.balance = balance_result['balance']
                balances[wallet.network] = balance_result['balance']
            else:
                balances[wallet.network] = wallet.balance

        db.session.commit()

        return jsonify({
            'success': True,
            'balances': balances
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': f'Failed to refresh balances: {str(e)}'
        }), 500

@wallet_bp.route('/wallet/send', methods=['POST'])
@cross_origin()
@require_auth
@transaction_rate_limit()
def send_crypto():
    """Send cryptocurrency (alias for transfer)"""
    return transfer_crypto()

@wallet_bp.route('/wallet/estimate-gas', methods=['POST'])
@cross_origin()
@require_auth
def estimate_gas():
    """Estimate gas fee for a transaction"""
    try:
        data = request.get_json() or {}
        
        # Validate required fields
        required_fields = ['from_address', 'to_address', 'amount', 'network']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400

        network = sanitize_input(data['network'])
        
        # Get gas estimate from blockchain service
        blockchain_svc = get_blockchain_service_instance()
        gas_result = blockchain_svc.estimate_gas_fee(network)
        
        if gas_result['success']:
            return jsonify({
                'success': True,
                'gas_fee': gas_result['gas_fee'],
                'gas_price': gas_result.get('gas_price'),
                'gas_limit': gas_result.get('gas_limit')
            })
        else:
            return jsonify({
                'success': False,
                'error': gas_result['error']
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to estimate gas: {str(e)}'
        }), 500

@wallet_bp.route('/wallet/history/<network>', methods=['GET'])
@cross_origin()
@require_auth
def get_wallet_history(network):
    """Get transaction history for a specific network"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        sync_blockchain = request.args.get('sync', 'false').lower() == 'true'

        # Find user's wallet for this network
        wallet = Wallet.query.filter_by(
            user_id=user.id,
            network=network,
            is_active=True
        ).first()

        if not wallet:
            return jsonify({
                'success': False,
                'error': f'No active wallet found for {network}'
            }), 404

        # Sync transactions from blockchain if requested
        if sync_blockchain:
            try:
                monitor = get_transaction_monitor()
                sync_result = asyncio.run(monitor.sync_wallet_transactions(wallet.id))
                if not sync_result['success']:
                    print(f"Warning: Failed to sync transactions: {sync_result['error']}")
            except Exception as e:
                print(f"Warning: Transaction sync failed: {str(e)}")

        # Get transactions for this network
        transactions = Transaction.query.filter_by(
            user_id=user.id,
            network=network
        ).order_by(Transaction.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        transaction_list = []
        for tx in transactions.items:
            transaction_data = {
                'id': tx.id,
                'transaction_hash': tx.transaction_hash,
                'from_address': tx.from_address,
                'to_address': tx.to_address,
                'amount': tx.amount,
                'currency': tx.currency,
                'network': tx.network,
                'transaction_type': tx.transaction_type,
                'status': tx.status,
                'gas_fee': tx.gas_fee,
                'block_number': tx.block_number,
                'created_at': tx.created_at.isoformat(),
                'confirmed_at': tx.confirmed_at.isoformat() if tx.confirmed_at else None
            }
            transaction_list.append(transaction_data)

        return jsonify({
            'success': True,
            'transactions': transaction_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': transactions.total,
                'pages': transactions.pages,
                'has_next': transactions.has_next,
                'has_prev': transactions.has_prev
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to get transaction history: {str(e)}'
        }), 500

@wallet_bp.route('/wallet/sync-transactions/<network>', methods=['POST'])
@cross_origin()
@require_auth
def sync_transactions(network):
    """Manually sync transactions from blockchain for a network"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        # Find user's wallet for this network
        wallet = Wallet.query.filter_by(
            user_id=user.id,
            network=network,
            is_active=True
        ).first()

        if not wallet:
            return jsonify({
                'success': False,
                'error': f'No active wallet found for {network}'
            }), 404

        # Sync transactions from blockchain
        monitor = get_transaction_monitor()
        sync_result = asyncio.run(monitor.sync_wallet_transactions(wallet.id))
        
        if sync_result['success']:
            return jsonify({
                'success': True,
                'synced_transactions': sync_result['synced_transactions'],
                'total_found': sync_result['total_found'],
                'message': f"Synced {sync_result['synced_transactions']} new transactions"
            })
        else:
            return jsonify({
                'success': False,
                'error': sync_result['error']
            }), 500

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to sync transactions: {str(e)}'
        }), 500
