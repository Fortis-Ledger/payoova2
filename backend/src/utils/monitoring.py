"""
Advanced Monitoring and Logging System for Payoova 2.0
"""

import os
import json
import time
import logging
from datetime import datetime, timedelta
from functools import wraps
from flask import request, current_app, g
from collections import defaultdict, deque
import threading
from typing import Dict, List, Optional

class PerformanceMonitor:
    """Monitor API performance and response times"""
    
    def __init__(self):
        self.metrics = defaultdict(lambda: {
            'count': 0,
            'total_time': 0,
            'min_time': float('inf'),
            'max_time': 0,
            'errors': 0,
            'recent_times': deque(maxlen=100)
        })
        self.lock = threading.Lock()
    
    def record_request(self, endpoint: str, duration: float, success: bool = True):
        """Record request metrics"""
        with self.lock:
            metric = self.metrics[endpoint]
            metric['count'] += 1
            metric['total_time'] += duration
            metric['min_time'] = min(metric['min_time'], duration)
            metric['max_time'] = max(metric['max_time'], duration)
            metric['recent_times'].append(duration)
            
            if not success:
                metric['errors'] += 1
    
    def get_metrics(self) -> Dict:
        """Get performance metrics"""
        with self.lock:
            result = {}
            for endpoint, metric in self.metrics.items():
                avg_time = metric['total_time'] / metric['count'] if metric['count'] > 0 else 0
                recent_avg = sum(metric['recent_times']) / len(metric['recent_times']) if metric['recent_times'] else 0
                
                result[endpoint] = {
                    'total_requests': metric['count'],
                    'error_count': metric['errors'],
                    'error_rate': metric['errors'] / metric['count'] if metric['count'] > 0 else 0,
                    'avg_response_time': round(avg_time, 3),
                    'min_response_time': round(metric['min_time'], 3) if metric['min_time'] != float('inf') else 0,
                    'max_response_time': round(metric['max_time'], 3),
                    'recent_avg_time': round(recent_avg, 3)
                }
            
            return result
    
    def get_health_status(self) -> Dict:
        """Get overall system health"""
        metrics = self.get_metrics()
        
        # Calculate overall health score
        total_requests = sum(m['total_requests'] for m in metrics.values())
        total_errors = sum(m['error_count'] for m in metrics.values())
        avg_error_rate = total_errors / total_requests if total_requests > 0 else 0
        
        # Determine health status
        if avg_error_rate < 0.01:  # Less than 1% error rate
            status = 'healthy'
        elif avg_error_rate < 0.05:  # Less than 5% error rate
            status = 'warning'
        else:
            status = 'critical'
        
        return {
            'status': status,
            'total_requests': total_requests,
            'total_errors': total_errors,
            'error_rate': round(avg_error_rate, 4),
            'uptime': self._get_uptime(),
            'timestamp': datetime.now().isoformat()
        }
    
    def _get_uptime(self) -> str:
        """Get application uptime"""
        # This is a simplified version - in production, you'd track actual start time
        return "Available"

class SecurityMonitor:
    """Monitor security events and suspicious activities"""
    
    def __init__(self):
        self.security_events = deque(maxlen=1000)
        self.failed_attempts = defaultdict(lambda: deque(maxlen=10))
        self.lock = threading.Lock()
    
    def log_security_event(self, event_type: str, user_id: Optional[int] = None, 
                          ip_address: Optional[str] = None, details: Optional[Dict] = None):
        """Log security event"""
        event = {
            'timestamp': datetime.now().isoformat(),
            'type': event_type,
            'user_id': user_id,
            'ip_address': ip_address,
            'details': details or {}
        }
        
        with self.lock:
            self.security_events.append(event)
        
        # Log to file as well
        current_app.logger.warning(f"SECURITY: {event_type} - IP: {ip_address} - User: {user_id}")
    
    def log_failed_login(self, email: str, ip_address: str):
        """Log failed login attempt"""
        with self.lock:
            self.failed_attempts[ip_address].append({
                'timestamp': datetime.now(),
                'email': email
            })
        
        self.log_security_event('FAILED_LOGIN', ip_address=ip_address, details={'email': email})
    
    def is_ip_blocked(self, ip_address: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
        """Check if IP should be blocked due to failed attempts"""
        with self.lock:
            attempts = self.failed_attempts[ip_address]
            if not attempts:
                return False
            
            # Count recent attempts
            cutoff_time = datetime.now() - timedelta(minutes=window_minutes)
            recent_attempts = [a for a in attempts if a['timestamp'] > cutoff_time]
            
            return len(recent_attempts) >= max_attempts
    
    def get_security_summary(self) -> Dict:
        """Get security summary"""
        with self.lock:
            recent_events = [e for e in self.security_events 
                           if datetime.fromisoformat(e['timestamp']) > datetime.now() - timedelta(hours=24)]
            
            event_types = defaultdict(int)
            for event in recent_events:
                event_types[event['type']] += 1
            
            return {
                'total_events_24h': len(recent_events),
                'event_types': dict(event_types),
                'blocked_ips': len([ip for ip, attempts in self.failed_attempts.items() 
                                  if self.is_ip_blocked(ip)]),
                'timestamp': datetime.now().isoformat()
            }

class SystemLogger:
    """Enhanced logging system"""
    
    def __init__(self):
        self.setup_logging()
    
    def setup_logging(self):
        """Setup logging configuration"""
        log_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        # Create formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d]'
        )
        
        simple_formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s'
        )
        
        # Setup file handlers
        error_handler = logging.FileHandler(os.path.join(log_dir, 'error.log'))
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(detailed_formatter)
        
        info_handler = logging.FileHandler(os.path.join(log_dir, 'info.log'))
        info_handler.setLevel(logging.INFO)
        info_handler.setFormatter(simple_formatter)
        
        security_handler = logging.FileHandler(os.path.join(log_dir, 'security.log'))
        security_handler.setLevel(logging.WARNING)
        security_handler.setFormatter(detailed_formatter)
        
        # Get root logger
        root_logger = logging.getLogger()
        root_logger.setLevel(logging.INFO)
        root_logger.addHandler(error_handler)
        root_logger.addHandler(info_handler)
        root_logger.addHandler(security_handler)

# Global instances
performance_monitor = PerformanceMonitor()
security_monitor = SecurityMonitor()
system_logger = SystemLogger()

def monitor_performance(f):
    """Decorator to monitor API performance"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        success = True
        
        try:
            result = f(*args, **kwargs)
            return result
        except Exception as e:
            success = False
            raise
        finally:
            duration = time.time() - start_time
            endpoint = request.endpoint or 'unknown'
            performance_monitor.record_request(endpoint, duration, success)
    
    return decorated_function

def log_user_activity(activity_type: str, details: Optional[Dict] = None):
    """Log user activity"""
    user_id = getattr(g, 'user_id', None) if hasattr(g, 'user_id') else None
    ip_address = request.remote_addr if request else None
    
    current_app.logger.info(f"USER_ACTIVITY: {activity_type} - User: {user_id} - IP: {ip_address} - Details: {details}")

def check_rate_limit_security(ip_address: str) -> bool:
    """Check if IP should be blocked for security reasons"""
    return security_monitor.is_ip_blocked(ip_address)

def get_system_metrics() -> Dict:
    """Get comprehensive system metrics"""
    return {
        'performance': performance_monitor.get_metrics(),
        'health': performance_monitor.get_health_status(),
        'security': security_monitor.get_security_summary(),
        'timestamp': datetime.now().isoformat()
    }
