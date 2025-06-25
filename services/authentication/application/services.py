"""
Authentication Application Services
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from shared.domain import ApplicationService
from shared.event_bus import publish_event
from ..domain.models import User, UserRole, UserStatus, AuthProvider, Permission
from ..domain.repositories import UserRepository, SessionRepository, TokenRepository
from ..domain.services import (
    JWTService, PasswordService, AuthorizationService, 
    TwoFactorService, APIKeyService, SessionService
)
from .dtos import (
    RegisterUserRequest, LoginRequest, LoginResponse,
    UserResponse, ChangePasswordRequest, CreateAPIKeyRequest,
    APIKeyResponse, EnableTwoFactorRequest, TwoFactorResponse
)


class AuthenticationService(ApplicationService):
    """Application service for authentication operations"""
    
    def __init__(
        self,
        user_repository: UserRepository,
        session_repository: SessionRepository,
        token_repository: TokenRepository,
        jwt_service: JWTService,
        password_service: PasswordService,
        session_service: SessionService
    ):
        self.user_repository = user_repository
        self.session_repository = session_repository
        self.token_repository = token_repository
        self.jwt_service = jwt_service
        self.password_service = password_service
        self.session_service = session_service
    
    async def register_user(self, request: RegisterUserRequest) -> UserResponse:
        """Register a new user"""
        
        # Check if user already exists
        existing_user = await self.user_repository.find_by_email(request.email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        existing_username = await self.user_repository.find_by_username(request.username)
        if existing_username:
            raise ValueError("Username already taken")
        
        # Validate password strength
        if request.password:
            password_validation = self.password_service.validate_password_strength(request.password)
            if not password_validation["is_valid"]:
                raise ValueError(f"Password validation failed: {', '.join(password_validation['issues'])}")
        
        # Create user
        user = User.create(
            email=request.email,
            username=request.username,
            first_name=request.first_name,
            last_name=request.last_name,
            password=request.password,
            client_id=request.client_id,
            auth_provider=request.auth_provider or AuthProvider.LOCAL
        )
        
        # Add default role
        if request.client_id:
            user.add_role(UserRole.CLIENT_USER)
        else:
            user.add_role(UserRole.TEAM_MEMBER)
        
        # Save user
        saved_user = await self.user_repository.save(user)
        
        # Publish domain events
        for event in saved_user.domain_events:
            await publish_event(event)
        saved_user.clear_domain_events()
        
        return UserResponse.from_domain(saved_user)
    
    async def login(self, request: LoginRequest) -> LoginResponse:
        """Authenticate user and create session"""
        
        # Find user
        user = await self.user_repository.find_by_email(request.email)
        if not user:
            user = await self.user_repository.find_by_username(request.email)  # Allow login with username
        
        if not user:
            raise ValueError("Invalid credentials")
        
        # Check if account is locked
        if user.is_locked():
            raise ValueError("Account is temporarily locked due to failed login attempts")
        
        # Check account status
        if user.status not in [UserStatus.ACTIVE, UserStatus.PASSWORD_RESET_REQUIRED]:
            raise ValueError("Account is not active")
        
        # Verify password
        if not user.verify_password(request.password):
            user.record_failed_login()
            await self.user_repository.save(user)
            raise ValueError("Invalid credentials")
        
        # Check two-factor authentication
        if user.two_factor_enabled:
            if not request.totp_code:
                return LoginResponse(
                    requires_2fa=True,
                    user_id=user.id
                )
            
            if not TwoFactorService.verify_totp_code(user.two_factor_secret, request.totp_code):
                # Check backup codes
                if not request.totp_code in user.backup_codes:
                    raise ValueError("Invalid two-factor authentication code")
                else:
                    # Remove used backup code
                    user.backup_codes.remove(request.totp_code)
                    await self.user_repository.save(user)
        
        # Create session
        session = await self.session_service.create_session(
            user=user,
            duration_hours=24,
            ip_address=request.ip_address,
            user_agent=request.user_agent
        )
        
        # Generate tokens
        access_token = self.jwt_service.generate_access_token(user)
        refresh_token = self.jwt_service.generate_refresh_token(user)
        
        # Store refresh token
        await self.token_repository.store_refresh_token(
            user_id=user.id,
            token_hash=refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        
        # Update user
        await self.user_repository.save(user)
        
        # Publish domain events
        for event in user.domain_events:
            await publish_event(event)
        user.clear_domain_events()
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=3600,  # 1 hour
            user=UserResponse.from_domain(user),
            session_id=session.session_id
        )
    
    async def refresh_token(self, refresh_token: str) -> LoginResponse:
        """Refresh access token"""
        
        try:
            payload = self.jwt_service.decode_token(refresh_token)
        except ValueError:
            raise ValueError("Invalid refresh token")
        
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        
        user_id = payload.get("sub")
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Validate refresh token
        if not await self.token_repository.validate_refresh_token(user_id, refresh_token):
            raise ValueError("Invalid refresh token")
        
        # Generate new tokens
        access_token = self.jwt_service.generate_access_token(user)
        new_refresh_token = self.jwt_service.generate_refresh_token(user)
        
        # Revoke old refresh token and store new one
        await self.token_repository.revoke_refresh_token(user_id, refresh_token)
        await self.token_repository.store_refresh_token(
            user_id=user_id,
            token_hash=new_refresh_token,
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=new_refresh_token,
            expires_in=3600,
            user=UserResponse.from_domain(user)
        )
    
    async def logout(self, user_id: str, session_id: str = None, access_token: str = None):
        """Logout user"""
        
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            return
        
        # Revoke session
        if session_id:
            user.revoke_session(session_id)
            await self.session_service.revoke_session(session_id)
        
        # Blacklist access token
        if access_token:
            token_jti = self.jwt_service.get_token_jti(access_token)
            if token_jti:
                try:
                    payload = self.jwt_service.decode_token(access_token)
                    expires_at = datetime.fromtimestamp(payload.get("exp", 0))
                    await self.token_repository.blacklist_token(token_jti, expires_at)
                except:
                    pass  # Token might be expired already
        
        # Save user
        await self.user_repository.save(user)
        
        # Publish domain events
        for event in user.domain_events:
            await publish_event(event)
        user.clear_domain_events()
    
    async def change_password(self, user_id: str, request: ChangePasswordRequest) -> UserResponse:
        """Change user password"""
        
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Verify current password
        if not user.verify_password(request.current_password):
            raise ValueError("Current password is incorrect")
        
        # Validate new password
        password_validation = self.password_service.validate_password_strength(request.new_password)
        if not password_validation["is_valid"]:
            raise ValueError(f"Password validation failed: {', '.join(password_validation['issues'])}")
        
        # Change password
        user.change_password(request.new_password, user_id)
        
        # Revoke all sessions except current one
        if request.keep_current_session and request.current_session_id:
            for session in user.active_sessions:
                if session.session_id != request.current_session_id:
                    session.revoke()
        else:
            user.revoke_all_sessions()
        
        # Save user
        saved_user = await self.user_repository.save(user)
        
        # Publish domain events
        for event in saved_user.domain_events:
            await publish_event(event)
        saved_user.clear_domain_events()
        
        return UserResponse.from_domain(saved_user)
    
    async def enable_two_factor(self, user_id: str, request: EnableTwoFactorRequest) -> TwoFactorResponse:
        """Enable two-factor authentication"""
        
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        if user.two_factor_enabled:
            raise ValueError("Two-factor authentication is already enabled")
        
        # Generate secret if not provided
        if not request.secret:
            secret = TwoFactorService.generate_secret()
        else:
            secret = request.secret
        
        # Verify TOTP code
        if not TwoFactorService.verify_totp_code(secret, request.totp_code):
            raise ValueError("Invalid TOTP code")
        
        # Generate backup codes
        backup_codes = TwoFactorService.generate_backup_codes()
        
        # Enable 2FA
        user.enable_two_factor(secret, backup_codes)
        
        # Save user
        saved_user = await self.user_repository.save(user)
        
        # Publish domain events
        for event in saved_user.domain_events:
            await publish_event(event)
        saved_user.clear_domain_events()
        
        return TwoFactorResponse(
            enabled=True,
            backup_codes=backup_codes,
            qr_code_url=TwoFactorService.generate_qr_code_url(secret, user.email)
        )
    
    async def disable_two_factor(self, user_id: str, password: str) -> UserResponse:
        """Disable two-factor authentication"""
        
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Verify password
        if not user.verify_password(password):
            raise ValueError("Invalid password")
        
        # Disable 2FA
        user.disable_two_factor()
        
        # Save user
        saved_user = await self.user_repository.save(user)
        
        # Publish domain events
        for event in saved_user.domain_events:
            await publish_event(event)
        saved_user.clear_domain_events()
        
        return UserResponse.from_domain(saved_user)
    
    async def create_api_key(self, user_id: str, request: CreateAPIKeyRequest) -> APIKeyResponse:
        """Create API key for user"""
        
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Create API key
        api_key, actual_key = user.create_api_key(
            name=request.name,
            permissions=request.permissions or [],
            description=request.description,
            expires_at=request.expires_at,
            rate_limit=request.rate_limit
        )
        
        # Save user
        saved_user = await self.user_repository.save(user)
        
        # Publish domain events
        for event in saved_user.domain_events:
            await publish_event(event)
        saved_user.clear_domain_events()
        
        return APIKeyResponse(
            key_id=api_key.key_id,
            name=api_key.name,
            key=actual_key,  # Only returned once
            permissions=api_key.permissions,
            expires_at=api_key.expires_at,
            created_at=api_key.created_at
        )
    
    async def revoke_api_key(self, user_id: str, key_id: str) -> UserResponse:
        """Revoke API key"""
        
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        user.revoke_api_key(key_id)
        
        # Save user
        saved_user = await self.user_repository.save(user)
        
        # Publish domain events
        for event in saved_user.domain_events:
            await publish_event(event)
        saved_user.clear_domain_events()
        
        return UserResponse.from_domain(saved_user)
    
    async def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate JWT token"""
        
        try:
            payload = self.jwt_service.decode_token(token)
            
            # Check if token is blacklisted
            token_jti = payload.get("jti")
            if token_jti and await self.token_repository.is_token_blacklisted(token_jti):
                return None
            
            return payload
        except ValueError:
            return None
    
    async def get_user_by_id(self, user_id: str) -> Optional[UserResponse]:
        """Get user by ID"""
        user = await self.user_repository.get_by_id(user_id)
        return UserResponse.from_domain(user) if user else None
    
    async def verify_email(self, user_id: str) -> UserResponse:
        """Verify user email"""
        user = await self.user_repository.get_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        user.verify_email()
        saved_user = await self.user_repository.save(user)
        
        # Publish domain events
        for event in saved_user.domain_events:
            await publish_event(event)
        saved_user.clear_domain_events()
        
        return UserResponse.from_domain(saved_user)
