"""
Authentication Domain Services
"""
import jwt
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from shared.domain import DomainService
from .models import User, UserSession, APIKey, Permission, PermissionType, ResourceType
from .repositories import UserRepository, SessionRepository, TokenRepository


class JWTService(DomainService):
    """Service for JWT token management"""
    
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    def generate_access_token(
        self, 
        user: User, 
        expires_in_minutes: int = 60
    ) -> str:
        """Generate JWT access token"""
        
        payload = {
            "sub": user.id,
            "email": user.email,
            "username": user.username,
            "roles": [role.value for role in user.roles],
            "client_id": user.client_id,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes=expires_in_minutes),
            "jti": secrets.token_urlsafe(16)  # JWT ID for blacklisting
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def generate_refresh_token(self, user: User) -> str:
        """Generate refresh token"""
        
        payload = {
            "sub": user.id,
            "type": "refresh",
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(days=30),
            "jti": secrets.token_urlsafe(16)
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def decode_token(self, token: str) -> Dict[str, Any]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm]
            )
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")
    
    def get_token_jti(self, token: str) -> Optional[str]:
        """Get JWT ID from token without validation"""
        try:
            unverified_payload = jwt.decode(
                token, 
                options={"verify_signature": False}
            )
            return unverified_payload.get("jti")
        except:
            return None


class PasswordService(DomainService):
    """Service for password operations"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        import bcrypt
        return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
    
    @staticmethod
    def generate_password(length: int = 12) -> str:
        """Generate secure random password"""
        import string
        import random
        
        characters = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(random.choice(characters) for _ in range(length))
    
    @staticmethod
    def validate_password_strength(password: str) -> Dict[str, Any]:
        """Validate password strength"""
        import re
        
        result = {
            "is_valid": True,
            "score": 0,
            "issues": []
        }
        
        # Length check
        if len(password) < 8:
            result["issues"].append("Password must be at least 8 characters long")
            result["is_valid"] = False
        else:
            result["score"] += 1
        
        # Uppercase check
        if not re.search(r"[A-Z]", password):
            result["issues"].append("Password must contain at least one uppercase letter")
        else:
            result["score"] += 1
        
        # Lowercase check
        if not re.search(r"[a-z]", password):
            result["issues"].append("Password must contain at least one lowercase letter")
        else:
            result["score"] += 1
        
        # Number check
        if not re.search(r"\d", password):
            result["issues"].append("Password must contain at least one number")
        else:
            result["score"] += 1
        
        # Special character check
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            result["issues"].append("Password must contain at least one special character")
        else:
            result["score"] += 1
        
        # Common password check (simplified)
        common_passwords = ["password", "123456", "qwerty", "admin"]
        if password.lower() in common_passwords:
            result["issues"].append("Password is too common")
            result["is_valid"] = False
        
        return result


class AuthorizationService(DomainService):
    """Service for authorization checks"""
    
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
    
    async def check_permission(
        self,
        user_id: str,
        resource_type: ResourceType,
        permission_type: PermissionType,
        resource_id: str = None
    ) -> bool:
        """Check if user has permission for resource"""
        
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            return False
        
        return user.has_permission(resource_type, permission_type, resource_id)
    
    async def get_user_permissions(
        self,
        user_id: str,
        resource_type: ResourceType = None
    ) -> List[Permission]:
        """Get all permissions for user"""
        
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            return []
        
        permissions = user.permissions.copy()
        
        # Add permissions from custom roles
        for role in user.custom_roles:
            permissions.extend(role.permissions)
        
        # Filter by resource type if specified
        if resource_type:
            permissions = [p for p in permissions if p.resource_type == resource_type]
        
        return permissions
    
    def can_access_client_data(self, user: User, client_id: str) -> bool:
        """Check if user can access client data"""
        
        # Super admin can access everything
        if user.has_permission(ResourceType.SYSTEM, PermissionType.ADMIN):
            return True
        
        # User's own client data
        if user.client_id == client_id:
            return True
        
        # Check specific client permissions
        return user.has_permission(ResourceType.CLIENT, PermissionType.READ, client_id)


class TwoFactorService(DomainService):
    """Service for two-factor authentication"""
    
    @staticmethod
    def generate_secret() -> str:
        """Generate TOTP secret"""
        import pyotp
        return pyotp.random_base32()
    
    @staticmethod
    def generate_qr_code_url(secret: str, user_email: str, issuer: str = "AIC Nexus") -> str:
        """Generate QR code URL for TOTP setup"""
        import pyotp
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=user_email,
            issuer_name=issuer
        )
    
    @staticmethod
    def verify_totp_code(secret: str, code: str) -> bool:
        """Verify TOTP code"""
        import pyotp
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=1)  # Allow 1 window tolerance
    
    @staticmethod
    def generate_backup_codes(count: int = 10) -> List[str]:
        """Generate backup codes"""
        return [secrets.token_hex(4).upper() for _ in range(count)]
    
    @staticmethod
    def verify_backup_code(backup_codes: List[str], code: str) -> bool:
        """Verify backup code"""
        return code.upper() in backup_codes


class APIKeyService(DomainService):
    """Service for API key management"""
    
    @staticmethod
    def generate_api_key() -> str:
        """Generate API key"""
        return f"aic_{secrets.token_urlsafe(32)}"
    
    @staticmethod
    def hash_api_key(api_key: str) -> str:
        """Hash API key for storage"""
        return hashlib.sha256(api_key.encode()).hexdigest()
    
    @staticmethod
    def verify_api_key(api_key: str, key_hash: str) -> bool:
        """Verify API key against hash"""
        return hashlib.sha256(api_key.encode()).hexdigest() == key_hash
    
    async def validate_api_key_permissions(
        self,
        api_key: APIKey,
        resource_type: ResourceType,
        permission_type: PermissionType,
        resource_id: str = None
    ) -> bool:
        """Validate API key permissions"""
        
        if not api_key.is_valid():
            return False
        
        # Check permissions
        for permission in api_key.permissions:
            if (permission.permission_type == permission_type and 
                permission.matches_resource(resource_type, resource_id) and
                not permission.is_expired()):
                return True
        
        return False


class SessionService(DomainService):
    """Service for session management"""
    
    def __init__(self, session_repository: SessionRepository):
        self.session_repository = session_repository
    
    async def create_session(
        self,
        user: User,
        duration_hours: int = 24,
        ip_address: str = None,
        user_agent: str = None
    ) -> UserSession:
        """Create new user session"""
        
        session = user.create_session(duration_hours, ip_address, user_agent)
        
        # Store session data in repository
        session_data = {
            "user_id": user.id,
            "session_id": session.session_id,
            "expires_at": session.expires_at,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "created_at": session.created_at
        }
        
        await self.session_repository.create_session(session_data)
        
        return session
    
    async def validate_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Validate session"""
        
        session_data = await self.session_repository.get_session(session_id)
        if not session_data:
            return None
        
        # Check if session is expired
        if session_data["expires_at"] < datetime.utcnow():
            await self.session_repository.delete_session(session_id)
            return None
        
        return session_data
    
    async def extend_session(self, session_id: str, duration_hours: int = 24) -> bool:
        """Extend session expiration"""
        
        session_data = await self.session_repository.get_session(session_id)
        if not session_data:
            return False
        
        session_data["expires_at"] = datetime.utcnow() + timedelta(hours=duration_hours)
        session_data["last_activity_at"] = datetime.utcnow()
        
        return await self.session_repository.update_session(session_id, session_data)
    
    async def revoke_session(self, session_id: str) -> bool:
        """Revoke session"""
        return await self.session_repository.delete_session(session_id)
    
    async def revoke_all_user_sessions(self, user_id: str) -> int:
        """Revoke all sessions for user"""
        return await self.session_repository.delete_user_sessions(user_id)
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions"""
        return await self.session_repository.cleanup_expired_sessions()
