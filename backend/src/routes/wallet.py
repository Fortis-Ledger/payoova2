from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from src.models.user import User, Wallet, Transaction, AuthToken, db
from src.utils.security import require_auth, validate_ethereum_address, sanitize_input
from src.utils.crypto_utils import WalletEncryption
from src.utils.rate_limiter import wallet_rate_limit, transaction_rate_limit
from src.services.blockchain import get_blockchain_service, get_price_service
from datetime import datetime
import asyncio
import secrets

wallet_bp = Blueprint('wallet', __name__)
blockchain_service = get_blockchain_service()
price_service = get_price_service()

def get_current_user():
    """Get current user from request context"""
    if hasattr(request, 'current_user'):
        user_id = request.current_user.get('user_id')
        return User.query.get(user_id)
    return None

@wallet_bp.route('/wallet/generate', methods=['POST'])
@cross_origin()
@require_auth
@wallet_rate_limit()
def generate_wallet():
    """Generate a new cryptocurrency wallet"""
    try:
        data = request.get_json() or {}
        network = sanitize_input(data.get('network', 'ethereum'))
        
        # Validate network
        supported_networks = ['ethereum', 'polygon', 'bsc']
        if network not in supported_networks:
            return jsonify({'success': False, 'error': 'Unsupported network'}), 400
        
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Check if user already has a wallet for this network
        existing_wallet = Wallet.query.filter_by(user_id=user.id, network=network).first()
        if existing_wallet:
            return jsonify({'success': False, 'error': f'Wallet already exists for {network}'}), 400
        
        # Generate wallet using blockchain service
        wallet_data = blockchain_service.generate_wallet(network)
        
        if not wallet_data['success']:
            return jsonify({'success': False, 'error': wallet_data['error']}), 500
        
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
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': f'Failed to generate wallet: {str(e)}'}), 500

@wallet_bp.route('/wallet/list', methods=['GET'])
@cross_origin()
@require_auth
def list_wallets():
    """List user's wallets with current balances"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        wallets = Wallet.query.filter_by(user_id=user.id, is_active=True).all()
        
        wallet_list = []
        balances = {}
        
        for wallet in wallets:
            # Get current balance from blockchain
            balance_result = blockchain_service.get_balance(wallet.address, wallet.network)
            
            if balance_result['success']:
                current_balance = balance_result['balance']
                # Update wallet balance in database
                wallet.balance = current_balance
                balances[wallet.network] = current_balance
            else:
                current_balance = wallet.balance
                balances[wallet.network] = current_balance
            
            wallet_data = {
                'id': wallet.id,
                'address': wallet.address,
                'network': wallet.network,
                'balance': current_balance,
                'is_active': wallet.is_active,
                'created_at': wallet.created_at.isoformat()
            }
            wallet_list.append(wallet_data)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'wallets': wallet_list,
            'balances': balances
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to list wallets: {str(e)}'}), 500

@wallet_bp.route('/wallet/send', methods=['POST'])
@cross_origin()
@require_auth
@transaction_rate_limit()
def send_crypto():
    """Send cryptocurrency transaction"""
    try:
        data = request.get_json() or {}
        
        # Sanitize and validate inputs
        from_address = sanitize_input(data.get('fromAddress', ''))
        to_address = sanitize_input(data.get('toAddress', ''))
        amount = data.get('amount', '')
        network = sanitize_input(data.get('network', ''))
        currency = sanitize_input(data.get('currency', ''))
        
        # Validate required fields
        if not all([from_address, to_address, amount, network]):
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        # Validate addresses
        if not validate_ethereum_address(from_address):
            return jsonify({'success': False, 'error': 'Invalid from address'}), 400
        
        if not validate_ethereum_address(to_address):
            return jsonify({'success': False, 'error': 'Invalid to address'}), 400
        
        # Validate amount
        try:
            send_amount = float(amount)
            if send_amount <= 0:
                return jsonify({'success': False, 'error': 'Amount must be positive'}), 400
        except ValueError:
            return jsonify({'success': False, 'error': 'Invalid amount format'}), 400
        
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
            return jsonify({'success': False, 'error': 'Wallet not found or not owned by user'}), 404
        
        # Get current balance
        balance_result = blockchain_service.get_balance(from_address, network)
        if not balance_result['success']:
            return jsonify({'success': False, 'error': 'Failed to get wallet balance'}), 500
        
        current_balance = float(balance_result['balance'])
        
        # Estimate gas fee
        gas_result = blockchain_service.estimate_gas_fee(network)
        if not gas_result['success']:
            return jsonify({'success': False, 'error': 'Failed to estimate gas fee'}), 500
        
        gas_fee = float(gas_result['gas_fee'])
        total_required = send_amount + gas_fee
        
        # Check balance including gas fee
        if current_balance < total_required:
            return jsonify({
                'success': False, 
                'error': f'Insufficient balance. Required: {total_required} (including gas: {gas_fee}), Available: {current_balance}'
            }), 400
        
        # Decrypt private key
        try:
            private_key = WalletEncryption.decrypt_private_key(wallet.encrypted_private_key)
        except Exception:
            return jsonify({'success': False, 'error': 'Failed to decrypt private key'}), 500
        
        # Send transaction
        tx_result = blockchain_service.send_transaction(
            from_address, to_address, str(send_amount), private_key, network
        )
        
        if not tx_result['success']:
            return jsonify({'success': False, 'error': tx_result['error']}), 500
        
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
        return jsonify({'success': False, 'error': f'Transaction failed: {str(e)}'}), 500

@wallet_bp.route('/wallet/transactions', methods=['GET'])
@cross_origin()
@require_auth
def get_transactions():
    """Get user's transaction history"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)  # Max 100 per page
        network = request.args.get('network')
        status = request.args.get('status')
        
        # Build query
        query = Transaction.query.filter_by(user_id=user.id)
        
        if network:
            query = query.filter_by(network=network)
        if status:
            query = query.filter_by(status=status)
        
        # Get paginated results
        transactions = query.order_by(Transaction.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        transaction_list = []
        for tx in transactions.items:
            # Update transaction status if pending
            if tx.status == 'pending' and tx.transaction_hash:
                status_result = blockchain_service.get_transaction_status(tx.transaction_hash, tx.network)
                if status_result['success'] and status_result['status'] != 'pending':
                    tx.status = status_result['status']
                    if status_result.get('block_number'):
                        tx.block_number = status_result['block_number']
                    if status_result['status'] == 'confirmed':
                        tx.confirmed_at = datetime.utcnow()
            
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
        
        db.session.commit()
        
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
        return jsonify({'success': False, 'error': f'Failed to get transactions: {str(e)}'}), 500

@wallet_bp.route('/wallet/balances', methods=['GET'])
@cross_origin()
@require_auth
def get_balances():
    """Get current wallet balances"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        wallets = Wallet.query.filter_by(user_id=user.id, is_active=True).all()
        
        balances = {}
        for wallet in wallets:
            balance_result = blockchain_service.get_balance(wallet.address, wallet.network)
            
            if balance_result['success']:
                balances[wallet.network] = balance_result['balance']
                # Update database balance
                wallet.balance = balance_result['balance']
            else:
                balances[wallet.network] = wallet.balance
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'balances': balances
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to get balances: {str(e)}'}), 500

@wallet_bp.route('/wallet/prices', methods=['GET'])
@cross_origin()
@require_auth
def get_prices():
    """Get current cryptocurrency prices"""
    try:
        symbols = request.args.getlist('symbols') or ['ETH', 'MATIC', 'BNB']
        vs_currency = request.args.get('vs_currency', 'usd')
        
        prices = {}
        
        # Get prices asynchronously
        async def get_all_prices():
            tasks = []
            for symbol in symbols:
                task = price_service.get_price(symbol, vs_currency)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            return results
        
        # Run async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            results = loop.run_until_complete(get_all_prices())
            
            for i, result in enumerate(results):
                if isinstance(result, dict) and result.get('success'):
                    symbol = symbols[i]
                    prices[symbol] = {
                        'price': result['price'],
                        'change_24h': result.get('change_24h', 0),
                        'vs_currency': vs_currency
                    }
        finally:
            loop.close()
        
        return jsonify({
            'success': True,
            'prices': prices,
            'vs_currency': vs_currency
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to get prices: {str(e)}'}), 500

@wallet_bp.route('/wallet/transaction/<tx_hash>/status', methods=['GET'])
@cross_origin()
@require_auth
def get_transaction_status(tx_hash):
    """Get transaction status"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'User not found'}), 404
        
        # Find transaction
        transaction = Transaction.query.filter_by(
            user_id=user.id,
            transaction_hash=tx_hash
        ).first()
        
        if not transaction:
            return jsonify({'success': False, 'error': 'Transaction not found'}), 404
        
        # Get status from blockchain
        status_result = blockchain_service.get_transaction_status(tx_hash, transaction.network)
        
        if status_result['success']:
            # Update transaction if status changed
            if transaction.status != status_result['status']:
                transaction.status = status_result['status']
                if status_result.get('block_number'):
                    transaction.block_number = status_result['block_number']
                if status_result['status'] == 'confirmed' and not transaction.confirmed_at:
                    transaction.confirmed_at = datetime.utcnow()
                db.session.commit()
            
            return jsonify({
                'success': True,
                'transaction_hash': tx_hash,
                'status': status_result['status'],
                'block_number': status_result.get('block_number'),
                'confirmations': status_result.get('confirmations', 0)
            })
        else:
            return jsonify({'success': False, 'error': status_result['error']}), 500
            
    except Exception as e:
        return jsonify({'success': False, 'error': f'Failed to get transaction status: {str(e)}'}), 500