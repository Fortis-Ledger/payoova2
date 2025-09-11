import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_mail import Mail
from flask_socketio import SocketIO
from datetime import datetime
from src.models.user import db
from sqlalchemy import text
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.wallet_simple import wallet_bp
from src.routes.qr_routes import qr_bp
from src.routes.admin import admin_bp
from src.routes.kyc import kyc_bp
from src.routes.cards import cards_bp
from src.config import get_config
from src.utils.rate_limiter import init_rate_limiter
from src.services.websocket import init_websocket
import asyncio
import threading
# Monitoring imports (optional - will work without them)
try:
    from src.utils.monitoring import performance_monitor, security_monitor
    from src.utils.performance import cache_manager, performance_profiler
    MONITORING_AVAILABLE = True
except ImportError:
    MONITORING_AVAILABLE = False
    print("⚠️  Monitoring modules not available - running in basic mode")

# Initialize Flask app
app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Load configuration
config = get_config()
app.config.from_object(config)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins=app.config.get('CORS_ORIGINS', "*"), 
                   async_mode='threading', logger=True, engineio_logger=True)

# Initialize extensions
mail = Mail(app)
init_rate_limiter(app)

# Enable CORS with proper configuration
CORS(app, 
     origins=app.config['CORS_ORIGINS'], 
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)

# Register blueprints
app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(wallet_bp, url_prefix='/api')
app.register_blueprint(qr_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api')
app.register_blueprint(kyc_bp, url_prefix='/api')
app.register_blueprint(cards_bp, url_prefix='/api')

# Initialize database
db.init_app(app)

# Initialize WebSocket services
init_websocket(app, socketio)

# Create tables
with app.app_context():
    db.create_all()

# Start background monitoring services
def start_background_services():
    """Start background monitoring services"""
    from src.services.websocket import get_transaction_monitor, get_balance_monitor

    def run_transaction_monitor():
        with app.app_context():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            monitor = get_transaction_monitor()
            if monitor:
                loop.run_until_complete(monitor.start_monitoring())

    def run_balance_monitor():
        with app.app_context():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            monitor = get_balance_monitor()
            if monitor:
                loop.run_until_complete(monitor.start_monitoring())

    # Start monitors in separate threads
    tx_thread = threading.Thread(target=run_transaction_monitor, daemon=True)
    balance_thread = threading.Thread(target=run_balance_monitor, daemon=True)

    tx_thread.start()
    balance_thread.start()

# Start background services
start_background_services()

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Check database connection
        db.session.execute(text('SELECT 1'))
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'version': '2.0.0',
            'services': {
                'database': 'healthy',
                'api': 'healthy'
            }
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        }), 503

# Error handlers
@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({'error': 'Rate limit exceeded', 'message': str(e.description)}), 429

@app.errorhandler(404)
def not_found_handler(e):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error_handler(e):
    return jsonify({'error': 'Internal server error'}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
