"""
Transaction monitoring and blockchain explorer integration service
"""
import asyncio
import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from flask import current_app
import os
from src.models.user import Transaction, Wallet, db

class TransactionMonitor:
    """Monitor and sync transactions from blockchain explorers"""
    
    def __init__(self):
        self.etherscan_api_key = os.getenv('ETHERSCAN_API_KEY')
        self.polygonscan_api_key = os.getenv('POLYGONSCAN_API_KEY')
        self.bscscan_api_key = os.getenv('BSCSCAN_API_KEY')
        
        self.explorer_apis = {
            'ethereum': {
                'base_url': 'https://api-sepolia.etherscan.io/api',
                'api_key': self.etherscan_api_key
            },
            'polygon': {
                'base_url': 'https://api-testnet.polygonscan.com/api',
                'api_key': self.polygonscan_api_key
            },
            'bsc': {
                'base_url': 'https://api-testnet.bscscan.com/api',
                'api_key': self.bscscan_api_key
            }
        }
    
    async def get_address_transactions(self, address: str, network: str, page: int = 1, offset: int = 20) -> Dict:
        """Get transaction history for an address from blockchain explorer"""
        try:
            if network not in self.explorer_apis:
                return {'success': False, 'error': f'Unsupported network: {network}'}
            
            explorer = self.explorer_apis[network]
            if not explorer['api_key']:
                return {'success': False, 'error': f'No API key configured for {network}'}
            
            params = {
                'module': 'account',
                'action': 'txlist',
                'address': address,
                'startblock': 0,
                'endblock': 99999999,
                'page': page,
                'offset': offset,
                'sort': 'desc',
                'apikey': explorer['api_key']
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(explorer['base_url'], params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get('status') == '1':
                        transactions = []
                        for tx in data.get('result', []):
                            # Convert Wei to Ether
                            value_eth = float(tx.get('value', '0')) / 10**18
                            
                            # Determine transaction type
                            tx_type = 'receive' if tx.get('to', '').lower() == address.lower() else 'send'
                            
                            # Convert timestamp
                            timestamp = datetime.fromtimestamp(int(tx.get('timeStamp', 0)))
                            
                            transaction = {
                                'hash': tx.get('hash'),
                                'from_address': tx.get('from'),
                                'to_address': tx.get('to'),
                                'value': str(value_eth),
                                'gas_used': tx.get('gasUsed'),
                                'gas_price': tx.get('gasPrice'),
                                'block_number': int(tx.get('blockNumber', 0)),
                                'timestamp': timestamp.isoformat(),
                                'status': 'confirmed' if tx.get('txreceipt_status') == '1' else 'failed',
                                'type': tx_type,
                                'network': network
                            }
                            transactions.append(transaction)
                        
                        return {
                            'success': True,
                            'transactions': transactions,
                            'total_count': len(transactions)
                        }
                    else:
                        return {
                            'success': False,
                            'error': data.get('message', 'API request failed')
                        }
                else:
                    return {
                        'success': False,
                        'error': f'HTTP {response.status_code}: {response.text}'
                    }
                    
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to fetch transactions: {str(e)}'
            }
    
    async def sync_wallet_transactions(self, wallet_id: int) -> Dict:
        """Sync transactions for a specific wallet from blockchain"""
        try:
            wallet = Wallet.query.get(wallet_id)
            if not wallet:
                return {'success': False, 'error': 'Wallet not found'}
            
            # Get transactions from blockchain explorer
            result = await self.get_address_transactions(
                wallet.address, 
                wallet.network,
                page=1,
                offset=50
            )
            
            if not result['success']:
                return result
            
            synced_count = 0
            for tx_data in result['transactions']:
                # Check if transaction already exists
                existing_tx = Transaction.query.filter_by(
                    transaction_hash=tx_data['hash']
                ).first()
                
                if not existing_tx:
                    # Create new transaction record
                    new_tx = Transaction(
                        user_id=wallet.user_id,
                        wallet_id=wallet.id,
                        transaction_hash=tx_data['hash'],
                        from_address=tx_data['from_address'],
                        to_address=tx_data['to_address'],
                        amount=tx_data['value'],
                        currency=self._get_network_currency(wallet.network),
                        network=wallet.network,
                        transaction_type=tx_data['type'],
                        status=tx_data['status'],
                        gas_fee=str(float(tx_data.get('gas_used', 0)) * float(tx_data.get('gas_price', 0)) / 10**18),
                        block_number=tx_data['block_number'],
                        created_at=datetime.fromisoformat(tx_data['timestamp']),
                        confirmed_at=datetime.fromisoformat(tx_data['timestamp']) if tx_data['status'] == 'confirmed' else None
                    )
                    
                    db.session.add(new_tx)
                    synced_count += 1
                else:
                    # Update status if changed
                    if existing_tx.status != tx_data['status']:
                        existing_tx.status = tx_data['status']
                        if tx_data['status'] == 'confirmed' and not existing_tx.confirmed_at:
                            existing_tx.confirmed_at = datetime.fromisoformat(tx_data['timestamp'])
            
            db.session.commit()
            
            return {
                'success': True,
                'synced_transactions': synced_count,
                'total_found': len(result['transactions'])
            }
            
        except Exception as e:
            db.session.rollback()
            return {
                'success': False,
                'error': f'Failed to sync transactions: {str(e)}'
            }
    
    def _get_network_currency(self, network: str) -> str:
        """Get the native currency symbol for a network"""
        currency_map = {
            'ethereum': 'ETH',
            'polygon': 'MATIC',
            'bsc': 'BNB',
            'arbitrum': 'ETH',
            'optimism': 'ETH',
            'avalanche': 'AVAX'
        }
        return currency_map.get(network, 'ETH')
    
    async def check_transaction_status(self, tx_hash: str, network: str) -> Dict:
        """Check the status of a specific transaction"""
        try:
            if network not in self.explorer_apis:
                return {'success': False, 'error': f'Unsupported network: {network}'}
            
            explorer = self.explorer_apis[network]
            if not explorer['api_key']:
                return {'success': False, 'error': f'No API key configured for {network}'}
            
            params = {
                'module': 'transaction',
                'action': 'gettxreceiptstatus',
                'txhash': tx_hash,
                'apikey': explorer['api_key']
            }
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(explorer['base_url'], params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data.get('status') == '1':
                        result = data.get('result', {})
                        status = 'confirmed' if result.get('status') == '1' else 'failed'
                        
                        return {
                            'success': True,
                            'status': status,
                            'hash': tx_hash
                        }
                    else:
                        return {
                            'success': False,
                            'error': data.get('message', 'Transaction not found')
                        }
                else:
                    return {
                        'success': False,
                        'error': f'HTTP {response.status_code}'
                    }
                    
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to check transaction status: {str(e)}'
            }

# Singleton instance
transaction_monitor = None

def get_transaction_monitor():
    """Get transaction monitor instance"""
    global transaction_monitor
    if transaction_monitor is None:
        transaction_monitor = TransactionMonitor()
    return transaction_monitor
