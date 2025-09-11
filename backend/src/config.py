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
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get('TOKEN_EXPIRY_HOURS', 24)) * 3600  # in seconds
    
    # Encryption Keys
    WALLET_ENCRYPTION_KEY = os.environ.get('WALLET_ENCRYPTION_KEY')
    
    # Blockchain Configuration
    ETHEREUM_RPC_URL = os.environ.get('ETHEREUM_RPC_URL', 'https://eth-sepolia.g.alchemy.com/v2/Bo80P-brwtM1N9eghAii3')
    POLYGON_RPC_URL = os.environ.get('POLYGON_RPC_URL', 'https://polygon-amoy.g.alchemy.com/v2/Bo80P-brwtM1N9eghAii3')
    BSC_RPC_URL = os.environ.get('BSC_RPC_URL', 'https://bnb-testnet.g.alchemy.com/v2/Bo80P-brwtM1N9eghAii3')
    INFURA_PROJECT_ID = os.environ.get('INFURA_PROJECT_ID', 'Bo80P-brwtM1N9eghAii3')
    
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
    BCRYPT_LOG_ROUNDS = int(os.environ.get('BCRYPT_ROUNDS', 12))
    
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
