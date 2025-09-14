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
                'testnet_rpc_url': None,
                'chain_id': 1,
                'testnet_chain_id': 11155111,  # Sepolia
                'name': 'Ethereum Mainnet',
                'testnet_name': 'Ethereum Sepolia',
                'symbol': 'ETH',
                'decimals': 18,
                'explorer': 'https://etherscan.io',
                'testnet_explorer': 'https://sepolia.etherscan.io'
            },
            'polygon': {
                'rpc_url': None,  # Will be set from config when available
                'testnet_rpc_url': None,
                'chain_id': 137,
                'testnet_chain_id': 80001,  # Mumbai
                'name': 'Polygon',
                'testnet_name': 'Polygon Mumbai',
                'symbol': 'MATIC',
                'decimals': 18,
                'explorer': 'https://polygonscan.com',
                'testnet_explorer': 'https://mumbai.polygonscan.com'
            },
            'bsc': {
                'rpc_url': None,  # Will be set from config when available
                'testnet_rpc_url': None,
                'chain_id': 56,
                'testnet_chain_id': 97,  # BSC Testnet
                'name': 'Binance Smart Chain',
                'testnet_name': 'BSC Testnet',
                'symbol': 'BNB',
                'decimals': 18,
                'explorer': 'https://bscscan.com',
                'testnet_explorer': 'https://testnet.bscscan.com'
            },
            'arbitrum': {
                'rpc_url': None,
                'testnet_rpc_url': None,
                'chain_id': 42161,
                'testnet_chain_id': 421613,  # Arbitrum Goerli
                'name': 'Arbitrum One',
                'testnet_name': 'Arbitrum Goerli',
                'symbol': 'ETH',
                'decimals': 18,
                'explorer': 'https://arbiscan.io',
                'testnet_explorer': 'https://goerli.arbiscan.io'
            },
            'optimism': {
                'rpc_url': None,
                'testnet_rpc_url': None,
                'chain_id': 10,
                'testnet_chain_id': 420,  # Optimism Goerli
                'name': 'Optimism',
                'testnet_name': 'Optimism Goerli',
                'symbol': 'ETH',
                'decimals': 18,
                'explorer': 'https://optimistic.etherscan.io',
                'testnet_explorer': 'https://goerli-optimism.etherscan.io'
            }
        }
        # Demo mode flag (prefer Flask config if available)
        try:
            if current_app:
                self.demo_mode = bool(current_app.config.get('DEMO_MODE', False))
            else:
                self.demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'
        except RuntimeError:
            self.demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'
        # Load config if app context is available
        self._load_config()
    
    # ERC20 Token Contract Addresses
    def get_token_contracts(self):
        """Get token contract addresses for supported networks"""
        try:
            # Load from environment or use defaults
            contracts = {
                'ethereum': {
                    'USDT': os.getenv('ETH_USDT_CONTRACT', '0xdAC17F958D2ee523a2206206994597C13D831ec7'),
                    'USDC': os.getenv('ETH_USDC_CONTRACT', '0xA0b86a33E6441E6C7D3E4C7C5C6C7C5C6C7C5C6C')
                },
                'polygon': {
                    'USDT': os.getenv('POLYGON_USDT_CONTRACT', '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'),
                    'USDC': os.getenv('POLYGON_USDC_CONTRACT', '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174')
                },
                'bsc': {
                    'USDT': os.getenv('BSC_USDT_CONTRACT', '0x55d398326f99059fF775485246999027B3197955'),
                    'USDC': os.getenv('BSC_USDC_CONTRACT', '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d')
                }
            }
            return contracts
        except Exception as e:
            print(f"Error loading token contracts: {e}")
            return {}
    
    # ERC20 ABI (minimal for balance and transfer)
    def get_erc20_abi(self):
        """Get minimal ERC20 ABI for token operations"""
        return [
            {
                "constant": True,
                "inputs": [{"name": "_owner", "type": "address"}],
                "name": "balanceOf",
                "outputs": [{"name": "balance", "type": "uint256"}],
                "type": "function"
            },
            {
                "constant": False,
                "inputs": [
                    {"name": "_to", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"name": "", "type": "bool"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "decimals",
                "outputs": [{"name": "", "type": "uint8"}],
                "type": "function"
            },
            {
                "constant": True,
                "inputs": [],
                "name": "symbol",
                "outputs": [{"name": "", "type": "string"}],
                "type": "function"
            }
        ]
    
    def get_token_balance(self, address: str, network: str, token_symbol: str) -> Dict:
        """Get ERC20 token balance for specific address"""
        try:
            web3 = self.get_web3_instance(network)
            contracts = self.get_token_contracts()
            
            if not web3 or network not in contracts or token_symbol not in contracts[network]:
                if self.demo_mode:
                    # Return mock token balance
                    mock_balances = {'USDT': '1000.50', 'USDC': '2500.75'}
                    return {
                        'success': True,
                        'balance': mock_balances.get(token_symbol, '0.0'),
                        'token': token_symbol,
                        'network': network,
                        'mock': True
                    }
                else:
                    return {
                        'success': False,
                        'error': f'Token {token_symbol} not supported on {network} or RPC not configured',
                        'network': network
                    }
            
            # Get token contract
            contract_address = contracts[network][token_symbol]
            contract = web3.eth.contract(address=contract_address, abi=self.get_erc20_abi())
            
            # Get balance
            balance_wei = contract.functions.balanceOf(address).call()
            decimals = contract.functions.decimals().call()
            
            # Convert to human readable format
            balance = balance_wei / (10 ** decimals)
            
            return {
                'success': True,
                'balance': str(balance),
                'balance_wei': str(balance_wei),
                'token': token_symbol,
                'network': network,
                'contract_address': contract_address
            }
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to get {token_symbol} balance: {str(e)}",
                'network': network
            }
    
    def send_token_transaction(self, from_address: str, to_address: str, amount: str,
                              private_key: str, network: str, token_symbol: str) -> Dict:
        """Send ERC20 token transaction"""
        try:
            if not WEB3_AVAILABLE:
                if self.demo_mode:
                    tx_hash = '0x' + secrets.token_hex(32)
                    return {
                        'success': True,
                        'transaction_hash': tx_hash,
                        'status': 'pending',
                        'network': network,
                        'token': token_symbol,
                        'mock': True
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Web3 not available and RPC not configured'
                    }
            
            web3 = self.get_web3_instance(network)
            contracts = self.get_token_contracts()
            
            if not web3 or network not in contracts or token_symbol not in contracts[network]:
                return {
                    'success': False,
                    'error': f'Token {token_symbol} not supported on {network} or RPC not configured'
                }
            
            # Get token contract
            contract_address = contracts[network][token_symbol]
            contract = web3.eth.contract(address=contract_address, abi=self.get_erc20_abi())
            
            # Get decimals and convert amount
            decimals = contract.functions.decimals().call()
            amount_wei = int(float(amount) * (10 ** decimals))
            
            # Build transaction
            account = Account.from_key(private_key)
            nonce = web3.eth.get_transaction_count(from_address)
            
            transaction = contract.functions.transfer(to_address, amount_wei).build_transaction({
                'chainId': self.networks[network]['chain_id'],
                'gas': 100000,
                'gasPrice': web3.eth.gas_price,
                'nonce': nonce,
            })
            
            # Sign and send transaction
            signed_txn = web3.eth.account.sign_transaction(transaction, private_key)
            tx_hash = web3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            return {
                'success': True,
                'transaction_hash': tx_hash.hex(),
                'status': 'pending',
                'network': network,
                'token': token_symbol
            }
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to send {token_symbol} transaction: {str(e)}"
            }

    def _load_config(self):
        """Load configuration from Flask app if available"""
        try:
            # Only try to access current_app if we're in an application context
            if current_app:
                network_mode = current_app.config.get('NETWORK_MODE', 'testnet')
                
                if network_mode == 'mainnet':
                    self.networks['ethereum']['rpc_url'] = current_app.config.get('ETHEREUM_RPC_URL')
                    self.networks['polygon']['rpc_url'] = current_app.config.get('POLYGON_RPC_URL')
                else:
                    rpc_configs = {
                        'ethereum': (os.getenv('ETHEREUM_RPC_URL'), os.getenv('ETHEREUM_TESTNET_RPC_URL')),
                        'polygon': (os.getenv('POLYGON_RPC_URL'), os.getenv('POLYGON_TESTNET_RPC_URL')),
                        'bsc': (os.getenv('BSC_RPC_URL'), os.getenv('BSC_TESTNET_RPC_URL')),
                        'arbitrum': (os.getenv('ARBITRUM_RPC_URL'), os.getenv('ARBITRUM_TESTNET_RPC_URL')),
                        'optimism': (os.getenv('OPTIMISM_RPC_URL'), os.getenv('OPTIMISM_TESTNET_RPC_URL'))
                    }
                    for network, (_, rpc_url) in rpc_configs.items():
                        self.networks[network]['rpc_url'] = rpc_url
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
                if self.demo_mode:
                    # Mock wallet generation when web3 is not available (demo mode)
                    private_key = secrets.token_hex(32)
                    mock_address = '0x' + secrets.token_hex(20)
                    return {
                        'success': True,
                        'address': mock_address,
                        'private_key': private_key,
                        'network': network,
                        'network_info': self.networks.get(network, {}),
                        'mock': True
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Web3 not available and RPC not configured. Please configure real RPC URLs.'
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
                if self.demo_mode:
                    return {
                        'success': True,
                        'balance': '0.0',
                        'balance_wei': '0',
                        'network': network,
                        'mock': True
                    }
                else:
                    return {
                        'success': False,
                        'error': 'RPC not configured or unreachable. Please configure valid RPC URLs.',
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
                if self.demo_mode:
                    base_fees = {'ethereum': 0.001, 'polygon': 0.0001, 'bsc': 0.0001}
                    return {
                        'success': True,
                        'gas_fee': str(base_fees.get(network, 0.001)),
                        'gas_price': '20000000000',
                        'gas_limit': '21000',
                        'mock': True
                    }
                else:
                    return {
                        'success': False,
                        'error': 'RPC not configured or unreachable. Cannot estimate gas.',
                        'network': network
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
                    if self.demo_mode:
                        tx_hash = '0x' + secrets.token_hex(32)
                        return {
                            'success': True,
                            'transaction_hash': tx_hash,
                            'status': 'pending',
                            'network': network,
                            'mock': True
                        }
                    else:
                        return {
                            'success': False,
                            'error': 'RPC not configured or unreachable. Cannot send transaction.',
                            'network': network
                        }

                # Create account from private key
                account = Account.from_key(private_key)

                # Get nonce
                nonce = web3.eth.get_transaction_count(from_address)

                # Convert amount to Wei
                amount_wei = web3.to_wei(float(amount), 'ether')

                # Build transaction
                transaction = {
                    'to': to_address,
                    'value': amount_wei,
                    'gas': 21000,
                    'gasPrice': web3.eth.gas_price,
                    'nonce': nonce,
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
                    'network': network
                }
            else:
                if self.demo_mode:
                    # Mock transaction when web3 is not available
                    tx_hash = '0x' + secrets.token_hex(32)
                    return {
                        'success': True,
                        'transaction_hash': tx_hash,
                        'status': 'pending',
                        'network': network,
                        'mock': True
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Web3 not available and RPC not configured. Cannot send transaction.'
                    }
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to send transaction: {str(e)}"
            }
    
    def get_transaction_status(self, tx_hash: str, network: str) -> Dict:
        """Get transaction status"""
        try:
            web3 = self.get_web3_instance(network)
            
            if not web3:
                if self.demo_mode:
                    return {
                        'success': True,
                        'status': 'confirmed',
                        'confirmations': 12,
                        'block_number': 18500000,
                        'network': network,
                        'mock': True
                    }
                else:
                    return {
                        'success': False,
                        'error': 'RPC not configured or unreachable. Cannot get transaction status.',
                        'network': network
                    }
            
            # Get transaction receipt
            try:
                receipt = web3.eth.get_transaction_receipt(tx_hash)
                current_block = web3.eth.block_number
                confirmations = current_block - receipt.blockNumber
                
                status = 'confirmed' if receipt.status == 1 else 'failed'
                
                return {
                    'success': True,
                    'status': status,
                    'confirmations': confirmations,
                    'block_number': receipt.blockNumber,
                    'gas_used': receipt.gasUsed,
                    'network': network
                }
            except Exception:
                # Transaction not found or pending
                return {
                    'success': True,
                    'status': 'pending',
                    'confirmations': 0,
                    'network': network
                }
        except Exception as e:
            return {
                'success': False,
                'error': f"Failed to get transaction status: {str(e)}"
            }
    
    def validate_address(self, address: str, network: str) -> bool:
        """Validate cryptocurrency address"""
        try:
            if not address or not address.startswith('0x'):
                return False
            
            if len(address) != 42:
                return False
            
            # Try to convert to checksum address
            if WEB3_AVAILABLE:
                try:
                    Web3.to_checksum_address(address)
                    return True
                except Exception:
                    return False
            else:
                # Basic validation when web3 is not available
                return all(c in '0123456789abcdefABCDEF' for c in address[2:])
        except Exception:
            return False

class PriceService:
    """Cryptocurrency price service"""
    
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.api_key = os.getenv('COINGECKO_API_KEY')
        # Demo mode flag
        try:
            if current_app:
                self.demo_mode = bool(current_app.config.get('DEMO_MODE', False))
            else:
                self.demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'
        except RuntimeError:
            self.demo_mode = os.getenv('DEMO_MODE', 'false').lower() == 'true'
    
    async def get_price(self, symbol: str, vs_currency: str = 'usd') -> Dict:
        """Get current price for cryptocurrency"""
        try:
            if self.demo_mode or not self.api_key:
                # Return mock prices when in demo mode or no API key
                mock_prices = {
                    'bitcoin': {'usd': 43250.12, 'change_24h': -2.1},
                    'ethereum': {'usd': 2456.78, 'change_24h': 5.2},
                    'matic-network': {'usd': 1.12, 'change_24h': 8.4},
                    'binancecoin': {'usd': 345.67, 'change_24h': 3.7},
                    'tether': {'usd': 1.00, 'change_24h': 0.1},
                    'usd-coin': {'usd': 1.00, 'change_24h': 0.0}
                }
                
                price_data = mock_prices.get(symbol.lower(), {'usd': 1.0, 'change_24h': 0.0})
                
                return {
                    'success': True,
                    'symbol': symbol,
                    'price': price_data[vs_currency],
                    'change_24h': price_data['change_24h'],
                    'vs_currency': vs_currency,
                    'mock': True
                }
            
            # Real API call
            url = f"{self.base_url}/simple/price"
            params = {
                'ids': symbol,
                'vs_currencies': vs_currency,
                'include_24hr_change': 'true'
            }
            
            if self.api_key:
                params['x_cg_demo_api_key'] = self.api_key
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if symbol in data:
                        price_info = data[symbol]
                        return {
                            'success': True,
                            'symbol': symbol,
                            'price': price_info[vs_currency],
                            'change_24h': price_info.get(f'{vs_currency}_24h_change', 0),
                            'vs_currency': vs_currency
                        }
                    else:
                        return {
                            'success': False,
                            'error': f'Price data not found for {symbol}'
                        }
                else:
                    return {
                        'success': False,
                        'error': f'API request failed with status {response.status_code}'
                    }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get price: {str(e)}'
            }

# Global service instances
blockchain_service = None
price_service = None

def get_blockchain_service():
    """Get or create blockchain service instance"""
    global blockchain_service
    if blockchain_service is None:
        blockchain_service = BlockchainService()
    return blockchain_service

def get_price_service():
    """Get or create price service instance"""
    global price_service
    if price_service is None:
        price_service = PriceService()
    return price_service
