import asyncio
import json
import logging
from typing import Dict, Set, Optional
from flask import current_app, request
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from src.models.user import User, Wallet, Transaction, db
from src.utils.security import JWTManager
from src.services.blockchain import get_blockchain_service
from datetime import datetime, timedelta
import threading

logger = logging.getLogger(__name__)

class WebSocketManager:
    """WebSocket connection and event management"""
    
    def __init__(self, socketio: SocketIO):
        self.socketio = socketio
        self.connected_users: Dict[str, Set[str]] = {}  # user_id -> set of session_ids
        self.user_sessions: Dict[str, str] = {}  # session_id -> user_id
        self.blockchain_service = get_blockchain_service()
        
        # Register event handlers
        self._register_handlers()
    
    def _register_handlers(self):
        """Register WebSocket event handlers"""
        
        @self.socketio.on('connect')
        def handle_connect(auth):
            """Handle client connection"""
            try:
                if not auth or 'token' not in auth:
                    logger.warning(f"Connection rejected - no token provided")
                    disconnect()
                    return False
                
                # Verify JWT token
                token_result = JWTManager.verify_token(auth['token'])
                if not token_result['valid']:
                    logger.warning(f"Connection rejected - invalid token: {token_result.get('error')}")
                    disconnect()
                    return False
                
                user_id = str(token_result['payload']['user_id'])
                session_id = request.sid
                
                # Store connection
                if user_id not in self.connected_users:
                    self.connected_users[user_id] = set()
                self.connected_users[user_id].add(session_id)
                self.user_sessions[session_id] = user_id
                
                # Join user room
                join_room(f"user_{user_id}")
                
                logger.info(f"User {user_id} connected with session {session_id}")
                
                # Send connection confirmation
                emit('connection_confirmed', {
                    'status': 'connected',
                    'user_id': user_id,
                    'timestamp': datetime.utcnow().isoformat()
                })
                
                return True
                
            except Exception as e:
                logger.error(f"Connection error: {str(e)}")
                disconnect()
                return False
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            """Handle client disconnection"""
            try:
                session_id = request.sid
                if session_id in self.user_sessions:
                    user_id = self.user_sessions[session_id]
                    
                    # Remove from connected users
                    if user_id in self.connected_users:
                        self.connected_users[user_id].discard(session_id)
                        if not self.connected_users[user_id]:
                            del self.connected_users[user_id]
                    
                    # Remove session mapping
                    del self.user_sessions[session_id]
                    
                    # Leave user room
                    leave_room(f"user_{user_id}")
                    
                    logger.info(f"User {user_id} disconnected from session {session_id}")
                    
            except Exception as e:
                logger.error(f"Disconnect error: {str(e)}")
        
        @self.socketio.on('subscribe_balance_updates')
        def handle_subscribe_balance_updates(data):
            """Subscribe to balance updates for specific networks"""
            try:
                session_id = request.sid
                if session_id not in self.user_sessions:
                    emit('error', {'message': 'Not authenticated'})
                    return
                
                user_id = self.user_sessions[session_id]
                networks = data.get('networks', [])
                
                # Join network rooms
                for network in networks:
                    join_room(f"balance_{network}_{user_id}")
                
                logger.info(f"User {user_id} subscribed to balance updates for networks: {networks}")
                emit('subscription_confirmed', {
                    'type': 'balance_updates',
                    'networks': networks
                })
                
            except Exception as e:
                logger.error(f"Balance subscription error: {str(e)}")
                emit('error', {'message': 'Subscription failed'})
        
        @self.socketio.on('subscribe_transaction_updates')
        def handle_subscribe_transaction_updates():
            """Subscribe to transaction status updates"""
            try:
                session_id = request.sid
                if session_id not in self.user_sessions:
                    emit('error', {'message': 'Not authenticated'})
                    return
                
                user_id = self.user_sessions[session_id]
                join_room(f"transactions_{user_id}")
                
                logger.info(f"User {user_id} subscribed to transaction updates")
                emit('subscription_confirmed', {
                    'type': 'transaction_updates'
                })
                
            except Exception as e:
                logger.error(f"Transaction subscription error: {str(e)}")
                emit('error', {'message': 'Subscription failed'})
        
        @self.socketio.on('get_live_price')
        def handle_get_live_price(data):
            """Get live cryptocurrency prices"""
            try:
                session_id = request.sid
                if session_id not in self.user_sessions:
                    emit('error', {'message': 'Not authenticated'})
                    return
                
                symbol = data.get('symbol', 'ETH')
                vs_currency = data.get('vs_currency', 'usd')
                
                # This would typically fetch from a price service
                # For now, emit mock data
                emit('live_price', {
                    'symbol': symbol,
                    'price': 2500.00,  # Mock price
                    'change_24h': 2.5,
                    'vs_currency': vs_currency,
                    'timestamp': datetime.utcnow().isoformat()
                })
                
            except Exception as e:
                logger.error(f"Live price error: {str(e)}")
                emit('error', {'message': 'Failed to get live price'})
    
    def broadcast_balance_update(self, user_id: str, network: str, balance: str):
        """Broadcast balance update to user"""
        try:
            self.socketio.emit('balance_update', {
                'network': network,
                'balance': balance,
                'timestamp': datetime.utcnow().isoformat()
            }, room=f"balance_{network}_{user_id}")
            
            logger.info(f"Balance update sent to user {user_id} for {network}: {balance}")
            
        except Exception as e:
            logger.error(f"Failed to broadcast balance update: {str(e)}")
    
    def broadcast_transaction_update(self, user_id: str, transaction_data: dict):
        """Broadcast transaction status update to user"""
        try:
            self.socketio.emit('transaction_update', {
                'transaction': transaction_data,
                'timestamp': datetime.utcnow().isoformat()
            }, room=f"transactions_{user_id}")
            
            logger.info(f"Transaction update sent to user {user_id}: {transaction_data.get('id')}")
            
        except Exception as e:
            logger.error(f"Failed to broadcast transaction update: {str(e)}")
    
    def broadcast_new_transaction(self, user_id: str, transaction_data: dict):
        """Broadcast new incoming transaction to user"""
        try:
            self.socketio.emit('new_transaction', {
                'transaction': transaction_data,
                'timestamp': datetime.utcnow().isoformat()
            }, room=f"transactions_{user_id}")
            
            logger.info(f"New transaction notification sent to user {user_id}: {transaction_data.get('id')}")
            
        except Exception as e:
            logger.error(f"Failed to broadcast new transaction: {str(e)}")
    
    def get_connected_users_count(self) -> int:
        """Get count of connected users"""
        return len(self.connected_users)
    
    def is_user_connected(self, user_id: str) -> bool:
        """Check if user is connected"""
        return user_id in self.connected_users and len(self.connected_users[user_id]) > 0

class TransactionMonitor:
    """Monitor blockchain transactions for status updates"""

    def __init__(self, websocket_manager: WebSocketManager):
        self.websocket_manager = websocket_manager
        self.blockchain_service = get_blockchain_service()
        self.monitoring = False
    
    async def start_monitoring(self):
        """Start monitoring pending transactions"""
        self.monitoring = True
        logger.info("Transaction monitoring started")
        
        while self.monitoring:
            try:
                await self._check_pending_transactions()
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Transaction monitoring error: {str(e)}")
                await asyncio.sleep(60)  # Wait longer on error
    
    def stop_monitoring(self):
        """Stop transaction monitoring"""
        self.monitoring = False
        logger.info("Transaction monitoring stopped")
    
    async def _check_pending_transactions(self):
        """Check status of pending transactions"""
        try:
            await self._check_pending_transactions_with_context()
        except Exception as e:
            logger.error(f"Error checking pending transactions: {str(e)}")

    async def _check_pending_transactions_with_context(self):
        """Check status of pending transactions with proper context"""
        from flask import current_app
        try:
            with current_app.app_context():
                # Get all pending transactions
                pending_txs = Transaction.query.filter_by(status='pending').all()
            
            for tx in pending_txs:
                if not tx.transaction_hash:
                    continue
                
                # Check transaction status on blockchain
                status_result = self.blockchain_service.get_transaction_status(
                    tx.transaction_hash, tx.network
                )
                
                if status_result['success'] and status_result['status'] != 'pending':
                    # Update transaction status
                    old_status = tx.status
                    tx.status = status_result['status']
                    
                    if 'block_number' in status_result:
                        tx.block_number = status_result['block_number']
                    
                    if tx.status == 'confirmed':
                        tx.confirmed_at = datetime.utcnow()
                    
                    db.session.commit()
                    
                    # Broadcast update to user
                    self.websocket_manager.broadcast_transaction_update(
                        str(tx.user_id),
                        tx.to_dict()
                    )
                    
                    logger.info(f"Transaction {tx.id} status updated: {old_status} -> {tx.status}")
                    
        except Exception as e:
            logger.error(f"Error checking pending transactions: {str(e)}")

class BalanceMonitor:
    """Monitor wallet balances for changes"""

    def __init__(self, websocket_manager: WebSocketManager):
        self.websocket_manager = websocket_manager
        self.blockchain_service = get_blockchain_service()
        self.monitoring = False
        self.last_balances = {}
    
    async def start_monitoring(self):
        """Start monitoring wallet balances"""
        self.monitoring = True
        logger.info("Balance monitoring started")
        
        while self.monitoring:
            try:
                await self._check_wallet_balances()
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Balance monitoring error: {str(e)}")
                await asyncio.sleep(120)  # Wait longer on error
    
    def stop_monitoring(self):
        """Stop balance monitoring"""
        self.monitoring = False
        logger.info("Balance monitoring stopped")
    
    async def _check_wallet_balances(self):
        """Check wallet balances for changes"""
        try:
            await self._check_wallet_balances_with_context()
        except Exception as e:
            logger.error(f"Error checking wallet balances: {str(e)}")

    async def _check_wallet_balances_with_context(self):
        """Check wallet balances for changes with proper context"""
        from flask import current_app
        try:
            with current_app.app_context():
                # Get all active wallets
                wallets = Wallet.query.filter_by(is_active=True).all()
            
            for wallet in wallets:
                # Get current balance from blockchain
                balance_result = self.blockchain_service.get_balance(
                    wallet.address, wallet.network
                )
                
                if balance_result['success']:
                    new_balance = balance_result['balance']
                    wallet_key = f"{wallet.user_id}_{wallet.network}"
                    
                    # Check if balance changed
                    if (wallet_key not in self.last_balances or 
                        self.last_balances[wallet_key] != new_balance):
                        
                        # Update wallet balance
                        old_balance = wallet.balance
                        wallet.balance = new_balance
                        db.session.commit()
                        
                        # Store new balance
                        self.last_balances[wallet_key] = new_balance
                        
                        # Broadcast update to user if connected
                        if self.websocket_manager.is_user_connected(str(wallet.user_id)):
                            self.websocket_manager.broadcast_balance_update(
                                str(wallet.user_id),
                                wallet.network,
                                new_balance
                            )
                            
                            logger.info(f"Balance update for user {wallet.user_id} {wallet.network}: {old_balance} -> {new_balance}")
                    
        except Exception as e:
            logger.error(f"Error checking wallet balances: {str(e)}")

# Global instances
websocket_manager = None
transaction_monitor = None
balance_monitor = None

def init_websocket(app, socketio):
    """Initialize WebSocket services"""
    global websocket_manager, transaction_monitor, balance_monitor

    with app.app_context():
        websocket_manager = WebSocketManager(socketio)
        transaction_monitor = TransactionMonitor(websocket_manager)
        balance_monitor = BalanceMonitor(websocket_manager)

        logger.info("WebSocket services initialized")

def get_websocket_manager():
    """Get WebSocket manager instance"""
    return websocket_manager

def get_transaction_monitor():
    """Get transaction monitor instance"""
    return transaction_monitor

def get_balance_monitor():
    """Get balance monitor instance"""
    return balance_monitor
