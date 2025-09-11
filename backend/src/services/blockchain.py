import secrets
import httpx
import asyncio
from typing import Dict, Optional, Tuple
from flask import current_app
import json
import os

# Try to import web3, but provide fallback if not available
try:
    from web3 import Web3
    from eth_account import Account
    from eth_keys import keys
    WEB3_AVAILABLE = True
except ImportError:
    WEB3_AVAILABLE = False
    print("⚠️  Web3 not available - using mock blockchain service")
    print("To install: pip install web3==6.15.1 eth-account==0.10.0 eth-keys==0.4.0")

class BlockchainService:
    """Blockchain interaction service for multiple networks"""
    
    def __init__(self):
        # Initialize with default values, will be updated when app context is available
        self.networks = {
            'ethereum': {
                'rpc_url': None,  # Will be set from config when available
                'chain_id': 1,
                'name': 'Ethereum Mainnet',
                'symbol': 'ETH',
                'decimals': 18,
                'explorer': 'https://etherscan.io'
            },
            'polygon': {
                'rpc_url': None,  # Will be set from config when available
                'chain_id': 137,
                'name': 'Polygon',
                'symbol': 'MATIC',
                'decimals': 18,
                'explorer': 'https://polygonscan.com'
            },
            'bsc': {
                'rpc_url': None,  # Will be set from config when available
                'chain_id': 56,
                'name': 'Binance Smart Chain',
                'symbol': 'BNB',
                'decimals': 18,
                'explorer': 'https://bscscan.com'
            }
        }
        # Load config if app context is available
        self._load_config()

    def _load_config(self):
        """Load configuration from Flask app if available"""
        try:
            # Only try to access current_app if we're in an application context
            if current_app:
                self.networks['ethereum']['rpc_url'] = current_app.config.get('ETHEREUM_RPC_URL')
                self.networks['polygon']['rpc_url'] = current_app.config.get('POLYGON_RPC_URL')
                self.networks['bsc']['rpc_url'] = current_app.config.get('BSC_RPC_URL')
        except RuntimeError:
            # We're not in an application context, use defaults
            pass
    
    def get_web3_instance(self, network: str):
        """Get Web3 instance for specific network"""
        if not WEB3_AVAILABLE:
            return None

        if network not in self.networks:
            raise ValueError(f"Unsupported network: {network}")

        rpc_url = self.networks[network]['rpc_url']
        if not rpc_url:
            # Return None if no RPC URL configured - will use mock data
            return None

        try:
            web3 = Web3(Web3.HTTPProvider(rpc_url))
            # Test connection
            if web3.is_connected():
                return web3
            else:
                print(f"⚠️  Failed to connect to {network} RPC - using mock data")
                return None
        except Exception as e:
            print(f"⚠️  Error connecting to {network}: {e} - using mock data")
            return None
    
    def generate_wallet(self, network: str = 'ethereum') -> Dict:
        """Generate a new wallet for specified network"""
        try:
            if WEB3_AVAILABLE:
                # Generate private key
                private_key = secrets.token_hex(32)

                # Create account from private key
                account = Account.from_key(private_key)

                return {
                    'success': True,
                    'address': account.address,
                    'private_key': private_key,
                    'network': network,
                    'network_info': self.networks.get(network, {})
                }
            else:
                # Mock wallet generation when web3 is not available
                private_key = secrets.token_hex(32)
                # Generate a mock Ethereum-style address
                mock_address = '0x' + secrets.token_hex(20)

                return {
                    'success': True,
                    'address': mock_address,
                    'private_key': private_key,
                    'network': network,
                    'network_info': self.networks.get(network, {}),
                    'mock': True
                }
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to generate wallet: {str(e)}"
            }
    
    def get_balance(self, address: str, network: str) -> Dict:
        """Get wallet balance for specific network"""
        try:
            web3 = self.get_web3_instance(network)
            
            if not web3:
                # Return mock balance for demo
                return {
                    'success': True,
                    'balance': '0.0',
                    'balance_wei': '0',
                    'network': network
                }
            
            # Get balance in Wei
            balance_wei = web3.eth.get_balance(address)
            
            # Convert to Ether
            balance_eth = web3.from_wei(balance_wei, 'ether')
            
            return {
                'success': True,
                'balance': str(balance_eth),
                'balance_wei': str(balance_wei),
                'network': network
            }
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to get balance: {str(e)}"
            }
    
    def estimate_gas_fee(self, network: str, transaction_type: str = 'transfer') -> Dict:
        """Estimate gas fee for transaction"""
        try:
            web3 = self.get_web3_instance(network)
            
            if not web3:
                # Return mock gas fee
                base_fees = {'ethereum': 0.001, 'polygon': 0.0001, 'bsc': 0.0001}
                return {
                    'success': True,
                    'gas_fee': str(base_fees.get(network, 0.001)),
                    'gas_price': '20000000000',  # 20 Gwei
                    'gas_limit': '21000'
                }
            
            # Get current gas price
            gas_price = web3.eth.gas_price
            
            # Estimate gas limit (21000 for simple transfer)
            gas_limit = 21000
            if transaction_type == 'contract':
                gas_limit = 50000
            
            # Calculate total fee
            total_fee_wei = gas_price * gas_limit
            total_fee_eth = web3.from_wei(total_fee_wei, 'ether')
            
            return {
                'success': True,
                'gas_fee': str(total_fee_eth),
                'gas_price': str(gas_price),
                'gas_limit': str(gas_limit)
            }
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to estimate gas: {str(e)}"
            }
    
    def send_transaction(self, from_address: str, to_address: str, amount: str,
                        private_key: str, network: str) -> Dict:
        """Send cryptocurrency transaction"""
        try:
            if WEB3_AVAILABLE:
                web3 = self.get_web3_instance(network)

                if not web3:
                    # Return mock transaction for demo
                    tx_hash = '0x' + secrets.token_hex(32)
                    return {
                        'success': True,
                        'transaction_hash': tx_hash,
                        'status': 'pending',
                        'network': network,
                        'mock': True
                    }

                # Get account from private key
                account = Account.from_key(private_key)

                # Verify the account address matches from_address
                if account.address.lower() != from_address.lower():
                    return {
                        'success': False,
                        'error': 'Private key does not match from address'
                    }

                # Get nonce
                nonce = web3.eth.get_transaction_count(from_address)

                # Convert amount to Wei
                amount_wei = web3.to_wei(float(amount), 'ether')

                # Get gas price and estimate gas
                gas_price = web3.eth.gas_price
                gas_estimate = web3.eth.estimate_gas({
                    'from': from_address,
                    'to': to_address,
                    'value': amount_wei
                })

                # Build transaction
                transaction = {
                    'nonce': nonce,
                    'to': to_address,
                    'value': amount_wei,
                    'gas': gas_estimate,
                    'gasPrice': gas_price,
                    'chainId': self.networks[network]['chain_id']
                }

                # Sign transaction
                signed_txn = web3.eth.account.sign_transaction(transaction, private_key)

                # Send transaction
                tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)

                return {
                    'success': True,
                    'transaction_hash': tx_hash.hex(),
                    'status': 'pending',
                    'network': network,
                    'gas_used': str(gas_estimate),
                    'gas_price': str(gas_price)
                }
            else:
                # Mock transaction when web3 is not available
                tx_hash = '0x' + secrets.token_hex(32)
                return {
                    'success': True,
                    'transaction_hash': tx_hash,
                    'status': 'pending',
                    'network': network,
                    'mock': True,
                    'message': 'Web3 not available - using mock transaction'
                }

        except Exception as e:
            return {
                'success': False,
                'error': f"Transaction failed: {str(e)}"
            }
    
    def get_transaction_status(self, tx_hash: str, network: str) -> Dict:
        """Get transaction status"""
        try:
            web3 = self.get_web3_instance(network)
            
            if not web3:
                # Return mock status
                return {
                    'success': True,
                    'status': 'confirmed',
                    'block_number': 12345678,
                    'confirmations': 12
                }
            
            # Get transaction receipt
            receipt = web3.eth.get_transaction_receipt(tx_hash)
            
            if receipt:
                # Get current block number
                current_block = web3.eth.block_number
                confirmations = current_block - receipt.blockNumber
                
                status = 'confirmed' if receipt.status == 1 else 'failed'
                
                return {
                    'success': True,
                    'status': status,
                    'block_number': receipt.blockNumber,
                    'confirmations': confirmations,
                    'gas_used': receipt.gasUsed
                }
            else:
                return {
                    'success': True,
                    'status': 'pending',
                    'confirmations': 0
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to get transaction status: {str(e)}"
            }
    
    def validate_address(self, address: str, network: str) -> bool:
        """Validate cryptocurrency address"""
        try:
            if not address or not address.startswith('0x') or len(address) != 42:
                return False

            if WEB3_AVAILABLE:
                # Try to convert to checksum address
                web3 = self.get_web3_instance(network)
                if web3:
                    web3.to_checksum_address(address)
                else:
                    # Basic validation for demo
                    int(address[2:], 16)
            else:
                # Basic validation when web3 is not available
                int(address[2:], 16)

            return True
        except:
            return False

class PriceService:
    """Cryptocurrency price service"""
    
    def __init__(self):
        self.coingecko_base = "https://api.coingecko.com/api/v3"
        self.api_key = None
        # Load API key if app context is available
        try:
            if current_app:
                self.api_key = current_app.config.get('COINGECKO_API_KEY')
        except RuntimeError:
            # We're not in an application context
            pass
    
    async def get_price(self, symbol: str, vs_currency: str = 'usd') -> Dict:
        """Get current price for cryptocurrency"""
        try:
            # Map symbols to CoinGecko IDs
            coin_ids = {
                'ETH': 'ethereum',
                'MATIC': 'matic-network', 
                'BNB': 'binancecoin'
            }
            
            coin_id = coin_ids.get(symbol.upper())
            if not coin_id:
                return {'success': False, 'error': 'Unsupported symbol'}
            
            url = f"{self.coingecko_base}/simple/price"
            params = {
                'ids': coin_id,
                'vs_currencies': vs_currency,
                'include_24hr_change': 'true'
            }
            
            if self.api_key:
                params['x_cg_demo_api_key'] = self.api_key
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    coin_data = data.get(coin_id, {})
                    
                    return {
                        'success': True,
                        'price': coin_data.get(vs_currency, 0),
                        'change_24h': coin_data.get(f'{vs_currency}_24h_change', 0),
                        'symbol': symbol,
                        'vs_currency': vs_currency
                    }
                else:
                    # Return mock data if API fails
                    mock_prices = {'ETH': 2500, 'MATIC': 0.8, 'BNB': 300}
                    return {
                        'success': True,
                        'price': mock_prices.get(symbol.upper(), 0),
                        'change_24h': 2.5,
                        'symbol': symbol,
                        'vs_currency': vs_currency,
                        'mock': True
                    }
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to get price: {str(e)}"
            }

# Singleton instances
blockchain_service = None
price_service = None

def get_blockchain_service():
    """Get blockchain service instance"""
    global blockchain_service
    if blockchain_service is None:
        blockchain_service = BlockchainService()
    return blockchain_service

def get_price_service():
    """Get price service instance"""
    global price_service
    if price_service is None:
        price_service = PriceService()
    return price_service
