"""
Performance Optimization Utilities for Payoova 2.0
"""

import time
import asyncio
import gzip
import json
from functools import wraps, lru_cache
from flask import request, current_app, g
from datetime import datetime, timedelta
import redis
from typing import Any, Optional, Dict, List
import hashlib
import pickle

class CacheManager:
    """Advanced caching system with Redis fallback"""
    
    def __init__(self):
        self.redis_client = None
        self.local_cache = {}
        self.cache_stats = {'hits': 0, 'misses': 0}
        self._init_redis()
    
    def _init_redis(self):
        """Initialize Redis connection"""
        try:
            redis_url = current_app.config.get('REDIS_URL')
            if redis_url:
                self.redis_client = redis.from_url(redis_url)
                self.redis_client.ping()  # Test connection
        except Exception as e:
            current_app.logger.warning(f"Redis not available, using local cache: {e}")
    
    def get(self, key: str) -> Any:
        """Get value from cache"""
        # Try Redis first
        if self.redis_client:
            try:
                value = self.redis_client.get(key)
                if value:
                    self.cache_stats['hits'] += 1
                    return pickle.loads(value)
            except Exception:
                pass
        
        # Fallback to local cache
        if key in self.local_cache:
            entry = self.local_cache[key]
            if entry['expires'] > datetime.now():
                self.cache_stats['hits'] += 1
                return entry['value']
            else:
                del self.local_cache[key]
        
        self.cache_stats['misses'] += 1
        return None
    
    def set(self, key: str, value: Any, ttl: int = 300):
        """Set value in cache with TTL"""
        # Try Redis first
        if self.redis_client:
            try:
                self.redis_client.setex(key, ttl, pickle.dumps(value))
                return
            except Exception:
                pass
        
        # Fallback to local cache
        self.local_cache[key] = {
            'value': value,
            'expires': datetime.now() + timedelta(seconds=ttl)
        }
        
        # Clean up expired entries
        self._cleanup_local_cache()
    
    def delete(self, key: str):
        """Delete key from cache"""
        if self.redis_client:
            try:
                self.redis_client.delete(key)
            except Exception:
                pass
        
        self.local_cache.pop(key, None)
    
    def _cleanup_local_cache(self):
        """Clean up expired local cache entries"""
        now = datetime.now()
        expired_keys = [k for k, v in self.local_cache.items() if v['expires'] <= now]
        for key in expired_keys:
            del self.local_cache[key]
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        total_requests = self.cache_stats['hits'] + self.cache_stats['misses']
        hit_rate = self.cache_stats['hits'] / total_requests if total_requests > 0 else 0
        
        return {
            'hits': self.cache_stats['hits'],
            'misses': self.cache_stats['misses'],
            'hit_rate': round(hit_rate, 3),
            'local_cache_size': len(self.local_cache),
            'redis_available': self.redis_client is not None
        }

class ResponseCompressor:
    """Compress API responses for better performance"""
    
    @staticmethod
    def compress_response(response_data: str) -> bytes:
        """Compress response data using gzip"""
        return gzip.compress(response_data.encode('utf-8'))
    
    @staticmethod
    def should_compress(response_size: int, content_type: str = None) -> bool:
        """Determine if response should be compressed"""
        # Only compress responses larger than 1KB
        if response_size < 1024:
            return False
        
        # Compress text-based responses
        compressible_types = [
            'application/json',
            'text/html',
            'text/css',
            'text/javascript',
            'application/javascript'
        ]
        
        return content_type in compressible_types if content_type else True

class QueryOptimizer:
    """Database query optimization utilities"""
    
    @staticmethod
    def paginate_results(query, page: int = 1, per_page: int = 20, max_per_page: int = 100):
        """Optimize pagination queries"""
        per_page = min(per_page, max_per_page)
        
        # Use offset pagination for small datasets
        if page * per_page < 10000:
            return query.paginate(
                page=page,
                per_page=per_page,
                error_out=False
            )
        
        # Use cursor-based pagination for large datasets
        # This would require additional implementation based on your models
        return query.paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
    
    @staticmethod
    def optimize_joins(query, eager_load: List[str] = None):
        """Optimize database joins to prevent N+1 queries"""
        if eager_load:
            for relationship in eager_load:
                query = query.options(joinedload(relationship))
        return query

class APIOptimizer:
    """API performance optimization"""
    
    def __init__(self):
        self.cache_manager = CacheManager()
        self.compressor = ResponseCompressor()
    
    def cached_response(self, ttl: int = 300):
        """Decorator for caching API responses"""
        def decorator(f):
            @wraps(f)
            def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = self._generate_cache_key(f.__name__, request)
                
                # Try to get from cache
                cached_result = self.cache_manager.get(cache_key)
                if cached_result:
                    return cached_result
                
                # Execute function and cache result
                result = f(*args, **kwargs)
                self.cache_manager.set(cache_key, result, ttl)
                
                return result
            return wrapper
        return decorator
    
    def _generate_cache_key(self, func_name: str, req) -> str:
        """Generate unique cache key for request"""
        key_parts = [
            func_name,
            req.method,
            req.path,
            req.query_string.decode('utf-8'),
        ]
        
        # Include user ID for personalized responses
        if hasattr(g, 'user_id'):
            key_parts.append(str(g.user_id))
        
        key_string = '|'.join(key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()

class PerformanceProfiler:
    """Profile API performance"""
    
    def __init__(self):
        self.profiles = {}
    
    def profile_endpoint(self, f):
        """Decorator to profile endpoint performance"""
        @wraps(f)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = f(*args, **kwargs)
                success = True
            except Exception as e:
                success = False
                raise
            finally:
                duration = time.time() - start_time
                self._record_profile(f.__name__, duration, success)
            
            return result
        return wrapper
    
    def _record_profile(self, endpoint: str, duration: float, success: bool):
        """Record performance profile"""
        if endpoint not in self.profiles:
            self.profiles[endpoint] = {
                'total_calls': 0,
                'total_time': 0,
                'avg_time': 0,
                'min_time': float('inf'),
                'max_time': 0,
                'errors': 0,
                'success_rate': 0
            }
        
        profile = self.profiles[endpoint]
        profile['total_calls'] += 1
        profile['total_time'] += duration
        profile['avg_time'] = profile['total_time'] / profile['total_calls']
        profile['min_time'] = min(profile['min_time'], duration)
        profile['max_time'] = max(profile['max_time'], duration)
        
        if not success:
            profile['errors'] += 1
        
        profile['success_rate'] = (profile['total_calls'] - profile['errors']) / profile['total_calls']
    
    def get_performance_report(self) -> Dict:
        """Get performance report"""
        return {
            'endpoints': self.profiles,
            'generated_at': datetime.now().isoformat()
        }

# Global instances
cache_manager = CacheManager()
api_optimizer = APIOptimizer()
performance_profiler = PerformanceProfiler()

# Decorators for easy use
def cached_response(ttl: int = 300):
    """Cache API response"""
    return api_optimizer.cached_response(ttl)

def profile_performance(f):
    """Profile endpoint performance"""
    return performance_profiler.profile_endpoint(f)

def optimize_db_query(eager_load: List[str] = None):
    """Optimize database queries"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            # This would be implemented based on your specific ORM usage
            return f(*args, **kwargs)
        return wrapper
    return decorator
