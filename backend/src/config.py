import os
from dotenv import load_dotenv
import secrets

# Load environment variables
load_dotenv()

class Config:
    """Base configuration class"""
    
    # Application Settings
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    FLASK_ENV = os.environ.get('NODE_ENV', 'development')
    DEBUG = FLASK_ENV == 'development'
    
    # Database Configuration
    DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///payoova.db')
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_ACCESS_SECRET = os.environ.get('JWT_ACCESS_SECRET') or secrets.token_hex(32)
    JWT_REFRESH_SECRET = os.environ.get('JWT_REFRESH_SECRET') or secrets.token_hex(32)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES', 24))
    JWT_REFRESH_TOKEN_EXPIRES = int(os.environ.get('JWT_REFRESH_TOKEN_EXPIRES', 720))
    
    # Encryption Keys
    WALLET_ENCRYPTION_KEY = os.environ.get('WALLET_ENCRYPTION_KEY')
    
    # Blockchain Configuration - RPCs must be provided via environment variables (no demo defaults)
    ETHEREUM_RPC_URL = os.getenv('ETHEREUM_RPC_URL', '')
    ETHEREUM_TESTNET_RPC_URL = os.getenv('ETHEREUM_TESTNET_RPC_URL', '')
    POLYGON_RPC_URL = os.getenv('POLYGON_RPC_URL', '')
    POLYGON_TESTNET_RPC_URL = os.getenv('POLYGON_TESTNET_RPC_URL', '')
    BSC_RPC_URL = os.getenv('BSC_RPC_URL', '')
    BSC_TESTNET_RPC_URL = os.getenv('BSC_TESTNET_RPC_URL', '')
    ARBITRUM_RPC_URL = os.getenv('ARBITRUM_RPC_URL', '')
    OPTIMISM_RPC_URL = os.getenv('OPTIMISM_RPC_URL', '')
    AVALANCHE_RPC_URL = os.getenv('AVALANCHE_RPC_URL', '')
    
    # Network Configuration
    NETWORK_MODE = os.getenv('NETWORK_MODE', 'testnet')  # 'mainnet' or 'testnet'
    
    # API Keys
    ALCHEMY_API_KEY = os.getenv('ALCHEMY_API_KEY', '')
    INFURA_PROJECT_ID = os.getenv('INFURA_PROJECT_ID', '')
    MORALIS_API_KEY = os.getenv('MORALIS_API_KEY', '')
    COINGECKO_API_KEY = os.environ.get('COINGECKO_API_KEY')
    
    # Explorer API Keys
    ETHERSCAN_API_KEY = os.environ.get('ETHERSCAN_API_KEY')
    POLYGONSCAN_API_KEY = os.environ.get('POLYGONSCAN_API_KEY')
    BSCSCAN_API_KEY = os.environ.get('BSCSCAN_API_KEY')
    
    # API Keys
    COINGECKO_API_KEY = os.environ.get('COINGECKO_API_KEY')
    
    # Email Configuration
    MAIL_SERVER = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('SMTP_PORT', 587))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.environ.get('SMTP_USER')
    MAIL_PASSWORD = os.environ.get('SMTP_PASS')
    MAIL_DEFAULT_SENDER = os.environ.get('SMTP_USER')
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL', "redis://localhost:6379")
    RATELIMIT_DEFAULT = os.environ.get('RATE_LIMIT_REQUESTS', '100') + " per " + str(int(os.environ.get('RATE_LIMIT_WINDOW', 900))) + " seconds"
    
    # Security Settings
    BCRYPT_LOG_ROUNDS = int(os.environ.get('BCRYPT_LOG_ROUNDS', 12))
    
    # KYC/AML Configuration
    KYC_API_KEY = os.environ.get('KYC_API_KEY')
    KYC_API_URL = os.environ.get('KYC_API_URL', 'https://api.jumio.com')
    AML_API_KEY = os.environ.get('AML_API_KEY')
    AML_API_URL = os.environ.get('AML_API_URL', 'https://api.worldcheck.com')
    
    # Compliance Settings
    KYC_REQUIRED_FOR_TRANSACTIONS = os.environ.get('KYC_REQUIRED_FOR_TRANSACTIONS', 'true').lower() == 'true'
    AML_SCREENING_ENABLED = os.environ.get('AML_SCREENING_ENABLED', 'true').lower() == 'true'
    TRANSACTION_MONITORING_ENABLED = os.environ.get('TRANSACTION_MONITORING_ENABLED', 'true').lower() == 'true'
    
    # CORS Settings
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://qjh9iec79z56.manus.space"
    ]

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///payoova_dev.db'

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    # Use PostgreSQL in production
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://user:pass@localhost/payoova'

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///payoova_test.db'
    WTF_CSRF_ENABLED = False

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_config():
    """Get configuration based on environment"""
    return config.get(os.environ.get('NODE_ENV', 'development'), DevelopmentConfig)
