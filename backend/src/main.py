import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_mail import Mail
from datetime import datetime
from src.models.user import db
from sqlalchemy import text
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.wallet_simple import wallet_bp
from src.routes.qr_routes import qr_bp
from src.routes.admin import admin_bp
from src.config import get_config
from src.utils.rate_limiter import init_rate_limiter
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

# Initialize database
db.init_app(app)

# Create tables
with app.app_context():
    db.create_all()

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
    app.run(host='0.0.0.0', port=5000, debug=True)
