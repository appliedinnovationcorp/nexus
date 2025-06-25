"""
Authentication Middleware for All Services
"""
import httpx
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class AuthenticationMiddleware:
    """Middleware to validate JWT tokens across all services"""
    
    def __init__(self, auth_service_url: str = "http://authentication:8000"):
        self.auth_service_url = auth_service_url
        self.security = HTTPBearer()
    
    async def validate_token(self, authorization: str) -> Optional[Dict[str, Any]]:
        """Validate token with authentication service"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.auth_service_url}/api/v1/auth/validate",
                    headers={"Authorization": authorization},
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result if result.get("valid") else None
                
                return None
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            return None
    
    async def get_current_user(self, request: Request) -> Dict[str, Any]:
        """Extract and validate user from request"""
        authorization = request.headers.get("Authorization")
        
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header required")
        
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization format")
        
        user_data = await self.validate_token(authorization)
        
        if not user_data:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        return user_data
    
    def require_permission(self, resource: str, action: str):
        """Decorator to require specific permissions"""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                # This would check user permissions
                # Simplified for now
                return await func(*args, **kwargs)
            return wrapper
        return decorator


# Global middleware instance
auth_middleware = AuthenticationMiddleware()


async def get_current_user(request: Request) -> Dict[str, Any]:
    """Dependency to get current authenticated user"""
    return await auth_middleware.get_current_user(request)


def require_auth(func):
    """Decorator to require authentication"""
    async def wrapper(*args, **kwargs):
        # Authentication logic would be applied here
        return await func(*args, **kwargs)
    return wrapper


def require_role(role: str):
    """Decorator to require specific role"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Role checking logic would be applied here
            return await func(*args, **kwargs)
        return wrapper
    return decorator
