import time
import threading
from functools import wraps
from flask import request, jsonify, current_app
from collections import defaultdict, deque

class InMemoryRateLimiter:
    """In-memory rate limiter for development/testing"""

    def __init__(self):
        self.requests = defaultdict(lambda: deque())
        self.lock = threading.Lock()

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Check if request is allowed"""
        current_time = time.time()

        with self.lock:
            # Clean old requests
            while self.requests[key] and current_time - self.requests[key][0] > window_seconds:
                self.requests[key].popleft()

            # Check if under limit
            if len(self.requests[key]) < max_requests:
                self.requests[key].append(current_time)
                return True

            return False

    def get_remaining_requests(self, key: str, max_requests: int, window_seconds: int) -> int:
        """Get remaining requests in current window"""
        current_time = time.time()

        with self.lock:
            # Clean old requests
            while self.requests[key] and current_time - self.requests[key][0] > window_seconds:
                self.requests[key].popleft()

            return max(0, max_requests - len(self.requests[key]))

    def get_reset_time(self, key: str, window_seconds: int) -> float:
        """Get time until reset"""
        if not self.requests[key]:
            return 0

        current_time = time.time()
        oldest_request = self.requests[key][0]
        return max(0, window_seconds - (current_time - oldest_request))

class RedisRateLimiter:
    """Redis-based rate limiter for production"""

    def __init__(self, redis_client=None):
        self.redis = redis_client

    def is_allowed(self, key: str, max_requests: int, window_seconds: int) -> bool:
        """Check if request is allowed using Redis"""
        if not self.redis:
            return True  # Allow all if Redis not available

        try:
            current_time = int(time.time())
            window_start = current_time - window_seconds

            # Use Redis sorted set to track requests
            self.redis.zremrangebyscore(key, '-inf', window_start)
            request_count = self.redis.zcard(key)

            if request_count < max_requests:
                self.redis.zadd(key, {str(current_time): current_time})
                self.redis.expire(key, window_seconds)
                return True

            return False
        except Exception as e:
            current_app.logger.error(f'Redis rate limiter error: {e}')
            return True  # Allow on error

    def get_remaining_requests(self, key: str, max_requests: int, window_seconds: int) -> int:
        """Get remaining requests using Redis"""
        if not self.redis:
            return max_requests

        try:
            current_time = int(time.time())
            window_start = current_time - window_seconds

            self.redis.zremrangebyscore(key, '-inf', window_start)
            request_count = self.redis.zcard(key)

            return max(0, max_requests - request_count)
        except Exception as e:
            current_app.logger.error(f'Redis rate limiter error: {e}')
            return max_requests

    def get_reset_time(self, key: str, window_seconds: int) -> float:
        """Get time until reset using Redis"""
        if not self.redis:
            return 0

        try:
            # Get the oldest request in the current window
            oldest = self.redis.zrange(key, 0, 0, withscores=True)
            if oldest:
                current_time = time.time()
                return max(0, window_seconds - (current_time - oldest[0][1]))
            return 0
        except Exception as e:
            current_app.logger.error(f'Redis rate limiter error: {e}')
            return 0

# Global rate limiter instances
_memory_limiter = InMemoryRateLimiter()
_redis_limiter = None

def get_rate_limiter():
    """Get the appropriate rate limiter based on configuration"""
    global _redis_limiter

    # Try to use Redis if configured
    redis_url = current_app.config.get('RATELIMIT_STORAGE_URL')
    if redis_url and redis_url.startswith('redis://'):
        if _redis_limiter is None:
            try:
                import redis
                redis_client = redis.from_url(redis_url)
                _redis_limiter = RedisRateLimiter(redis_client)
            except ImportError:
                current_app.logger.warning('Redis not available, falling back to in-memory rate limiting')
            except Exception as e:
                current_app.logger.error(f'Failed to connect to Redis: {e}')
                current_app.logger.warning('Falling back to in-memory rate limiting')

    return _redis_limiter if _redis_limiter else _memory_limiter

def rate_limit(max_requests: int = None, window_seconds: int = None, key_func=None):
    """Rate limiting decorator"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Get rate limit settings from function or use defaults
            limit = max_requests or current_app.config.get('RATELIMIT_DEFAULT_REQUESTS', 100)
            window = window_seconds or current_app.config.get('RATELIMIT_DEFAULT_WINDOW', 900)

            # Generate key for rate limiting
            if key_func:
                key = key_func()
            else:
                # Default key based on IP address
                client_ip = request.remote_addr or request.headers.get('X-Forwarded-For', 'unknown')
                key = f"rate_limit:{client_ip}:{request.endpoint}"

            limiter = get_rate_limiter()

            if not limiter.is_allowed(key, limit, window):
                # Calculate reset time
                reset_time = limiter.get_reset_time(key, window)
                remaining = limiter.get_remaining_requests(key, limit, window)

                response = jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Try again in {int(reset_time)} seconds.',
                    'retry_after': int(reset_time),
                    'remaining_requests': remaining
                })

                response.status_code = 429
                response.headers['X-RateLimit-Limit'] = str(limit)
                response.headers['X-RateLimit-Remaining'] = str(remaining)
                response.headers['X-RateLimit-Reset'] = str(int(time.time() + reset_time))
                response.headers['Retry-After'] = str(int(reset_time))

                return response

            return f(*args, **kwargs)
        return wrapper
    return decorator

def user_rate_limit(max_requests: int = None, window_seconds: int = None):
    """Rate limiting decorator based on user ID"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # Get user ID from request context
            user_id = None
            if hasattr(request, 'current_user'):
                user_id = request.current_user.get('user_id')

            if user_id:
                key_func = lambda: f"user_rate_limit:{user_id}:{request.endpoint}"
            else:
                # Fallback to IP-based limiting
                client_ip = request.remote_addr or request.headers.get('X-Forwarded-For', 'unknown')
                key_func = lambda: f"ip_rate_limit:{client_ip}:{request.endpoint}"

            return rate_limit(max_requests, window_seconds, key_func)(f)(*args, **kwargs)
        return wrapper
    return decorator

def wallet_rate_limit(max_requests: int = 10, window_seconds: int = 300):
    """Rate limiting for wallet operations (stricter limits)"""
    return user_rate_limit(max_requests, window_seconds)

def transaction_rate_limit(max_requests: int = 5, window_seconds: int = 300):
    """Rate limiting for transaction operations (strictest limits)"""
    return user_rate_limit(max_requests, window_seconds)

def auth_rate_limit(max_requests: int = 5, window_seconds: int = 300):
    """Rate limiting for authentication operations"""
    return rate_limit(max_requests, window_seconds)

def admin_rate_limit(max_requests: int = 100, window_seconds: int = 60):
    """Rate limiting for admin operations"""
    return user_rate_limit(max_requests, window_seconds)

def kyc_rate_limit(max_requests: int = 3, window_seconds: int = 3600):
    """Rate limiting for KYC operations (very strict - 3 per hour)"""
    return user_rate_limit(max_requests, window_seconds)

class RateLimitExceeded(Exception):
    """Exception raised when rate limit is exceeded"""

    def __init__(self, retry_after: int, remaining: int):
        self.retry_after = retry_after
        self.remaining = remaining
        super().__init__(f'Rate limit exceeded. Retry after {retry_after} seconds.')

def get_rate_limit_status(key: str, max_requests: int = None, window_seconds: int = None):
    """Get current rate limit status for a key"""
    limiter = get_rate_limiter()
    limit = max_requests or current_app.config.get('RATELIMIT_DEFAULT_REQUESTS', 100)
    window = window_seconds or current_app.config.get('RATELIMIT_DEFAULT_WINDOW', 900)

    remaining = limiter.get_remaining_requests(key, limit, window)
    reset_time = limiter.get_reset_time(key, window)

    return {
        'limit': limit,
        'remaining': remaining,
        'reset_time': reset_time,
        'reset_in_seconds': int(reset_time)
    }

# Initialize rate limiter on app startup
def init_rate_limiter(app):
    """Initialize rate limiter for the Flask app"""
    global _redis_limiter

    # Test Redis connection if configured
    redis_url = app.config.get('RATELIMIT_STORAGE_URL')
    if redis_url and redis_url.startswith('redis://'):
        try:
            import redis
            redis_client = redis.from_url(redis_url)
            redis_client.ping()  # Test connection
            _redis_limiter = RedisRateLimiter(redis_client)
            app.logger.info('Redis rate limiter initialized successfully')
        except ImportError:
            app.logger.warning('Redis not available, using in-memory rate limiting')
        except Exception as e:
            app.logger.error(f'Failed to initialize Redis rate limiter: {e}')
            app.logger.warning('Using in-memory rate limiting as fallback')
    else:
        app.logger.info('Using in-memory rate limiting')
