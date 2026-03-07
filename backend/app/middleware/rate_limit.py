"""
Rate limiting middleware to prevent API abuse
"""

from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from datetime import datetime, timedelta
import time

from app.core.config import get_settings
from app.core.security import hash_ip_address

settings = get_settings()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware
    
    Tracks requests per IP address and enforces rate limits
    Note: For production with multiple servers, use Redis instead
    """
    
    def __init__(self, app):
        super().__init__(app)
        # Store: {ip_hash: [(timestamp, path), ...]}
        self.requests: defaultdict = defaultdict(list)
        self.cleanup_interval = 60  # Cleanup old entries every 60 seconds
        self.last_cleanup = time.time()
    
    async def dispatch(self, request: Request, call_next):
        """
        Process incoming request and enforce rate limits
        """
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Get client IP (handle proxies)
        client_ip = self._get_client_ip(request)
        ip_hash = hash_ip_address(client_ip)
        
        # Cleanup old entries periodically
        current_time = time.time()
        if current_time - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_entries()
            self.last_cleanup = current_time
        
        # Check rate limit
        if self._is_rate_limited(ip_hash):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {settings.RATE_LIMIT_PER_MINUTE} requests per minute."
            )
        
        # Record this request
        self.requests[ip_hash].append((current_time, request.url.path))
        
        # Process request
        response = await call_next(request)
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """
        Extract client IP address, handling proxy headers
        """
        # Check for proxy headers
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection
        if request.client:
            return request.client.host
        
        return "unknown"
    
    def _is_rate_limited(self, ip_hash: str) -> bool:
        """
        Check if IP has exceeded rate limit
        """
        now = time.time()
        window_start = now - 60  # 1 minute window
        
        # Get recent requests from this IP
        recent_requests = [
            (ts, path) for ts, path in self.requests[ip_hash]
            if ts > window_start
        ]
        
        # Update stored requests to only recent ones
        self.requests[ip_hash] = recent_requests
        
        # Check if over limit
        return len(recent_requests) >= settings.RATE_LIMIT_PER_MINUTE
    
    def _cleanup_old_entries(self):
        """
        Remove old request records to prevent memory bloat
        """
        now = time.time()
        cutoff = now - 300  # Keep last 5 minutes
        
        for ip_hash in list(self.requests.keys()):
            # Filter to recent requests only
            recent = [
                (ts, path) for ts, path in self.requests[ip_hash]
                if ts > cutoff
            ]
            
            if recent:
                self.requests[ip_hash] = recent
            else:
                # Remove IP if no recent requests
                del self.requests[ip_hash]


# ============================================================================
# ADVANCED RATE LIMITING (Future Enhancement)
# ============================================================================
"""
For production with multiple servers, use Redis-based rate limiting:

from redis import asyncio as aioredis
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

# In startup:
redis = await aioredis.from_url("redis://localhost")
await FastAPILimiter.init(redis)

# In routes:
@router.get("/endpoint", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def limited_endpoint():
    pass
"""
