"""
Authentication DTOs (Data Transfer Objects)
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr
from ..domain.models import User, UserRole, UserStatus, AuthProvider, Permission


class RegisterUserRequest(BaseModel):
    """Request DTO for user registration"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    password: Optional[str] = Field(None, min_length=8)
    client_id: Optional[str] = None
    auth_provider: Optional[AuthProvider] = AuthProvider.LOCAL


class LoginRequest(BaseModel):
    """Request DTO for user login"""
    email: str  # Can be email or username
    password: str
    totp_code: Optional[str] = None
    remember_me: bool = False
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    """Request DTO for password change"""
    current_password: str
    new_password: str = Field(..., min_length=8)
    keep_current_session: bool = True
    current_session_id: Optional[str] = None


class CreateAPIKeyRequest(BaseModel):
    """Request DTO for API key creation"""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    permissions: Optional[List[Permission]] = None
    expires_at: Optional[datetime] = None
    rate_limit: Optional[int] = None


class EnableTwoFactorRequest(BaseModel):
    """Request DTO for enabling 2FA"""
    totp_code: str = Field(..., min_length=6, max_length=6)
    secret: Optional[str] = None


class UserResponse(BaseModel):
    """Response DTO for user"""
    id: str
    email: str
    username: str
    first_name: str
    last_name: str
    full_name: str
    status: UserStatus
    roles: List[UserRole]
    client_id: Optional[str] = None
    auth_provider: AuthProvider
    email_verified: bool
    phone_verified: bool
    two_factor_enabled: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    @classmethod
    def from_domain(cls, user: User) -> 'UserResponse':
        """Convert domain model to response DTO"""
        return cls(
            id=user.id,
            email=user.email,
            username=user.username,
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name,
            status=user.status,
            roles=user.roles,
            client_id=user.client_id,
            auth_provider=user.auth_provider,
            email_verified=user.email_verified,
            phone_verified=user.phone_verified,
            two_factor_enabled=user.two_factor_enabled,
            last_login_at=user.last_login_at,
            created_at=user.created_at,
            updated_at=user.updated_at
        )


class LoginResponse(BaseModel):
    """Response DTO for login"""
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_in: Optional[int] = None
    user: Optional[UserResponse] = None
    session_id: Optional[str] = None
    requires_2fa: bool = False
    user_id: Optional[str] = None


class APIKeyResponse(BaseModel):
    """Response DTO for API key"""
    key_id: str
    name: str
    key: Optional[str] = None  # Only returned on creation
    permissions: List[Permission]
    expires_at: Optional[datetime] = None
    created_at: datetime
    last_used_at: Optional[datetime] = None
    usage_count: int = 0


class TwoFactorResponse(BaseModel):
    """Response DTO for 2FA operations"""
    enabled: bool
    backup_codes: Optional[List[str]] = None
    qr_code_url: Optional[str] = None


class TokenValidationResponse(BaseModel):
    """Response DTO for token validation"""
    valid: bool
    user_id: Optional[str] = None
    email: Optional[str] = None
    roles: Optional[List[str]] = None
    client_id: Optional[str] = None
    expires_at: Optional[datetime] = None
