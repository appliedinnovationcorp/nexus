"""
Authentication & Authorization Domain Models
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any, Set
from pydantic import Field, validator, EmailStr
from enum import Enum
import uuid
import hashlib
import secrets
from shared.domain import AggregateRoot, ValueObject
from shared.events import BaseEvent


class UserRole(str, Enum):
    """User roles in the system"""
    SUPER_ADMIN = "SuperAdmin"
    ADMIN = "Admin"
    PROJECT_MANAGER = "ProjectManager"
    TEAM_MEMBER = "TeamMember"
    CLIENT_ADMIN = "ClientAdmin"
    CLIENT_USER = "ClientUser"
    VIEWER = "Viewer"


class UserStatus(str, Enum):
    """User account status"""
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    SUSPENDED = "Suspended"
    PENDING_VERIFICATION = "PendingVerification"
    PASSWORD_RESET_REQUIRED = "PasswordResetRequired"


class AuthProvider(str, Enum):
    """Authentication providers"""
    LOCAL = "Local"
    KEYCLOAK = "Keycloak"
    GOOGLE = "Google"
    MICROSOFT = "Microsoft"
    GITHUB = "GitHub"
    SAML = "SAML"


class PermissionType(str, Enum):
    """Permission types"""
    READ = "Read"
    WRITE = "Write"
    DELETE = "Delete"
    ADMIN = "Admin"
    EXECUTE = "Execute"


class ResourceType(str, Enum):
    """Resource types for permissions"""
    CLIENT = "Client"
    PROJECT = "Project"
    INVOICE = "Invoice"
    SUBSCRIPTION = "Subscription"
    MODEL = "Model"
    DOCUMENT = "Document"
    USER = "User"
    SYSTEM = "System"


class SessionStatus(str, Enum):
    """Session status"""
    ACTIVE = "Active"
    EXPIRED = "Expired"
    REVOKED = "Revoked"


class Permission(ValueObject):
    """Permission for a specific resource"""
    resource_type: ResourceType
    resource_id: Optional[str] = None  # None means all resources of this type
    permission_type: PermissionType
    granted_by: str
    granted_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    conditions: Dict[str, Any] = Field(default_factory=dict)  # Additional conditions
    
    def is_expired(self) -> bool:
        """Check if permission has expired"""
        return self.expires_at is not None and self.expires_at < datetime.utcnow()
    
    def matches_resource(self, resource_type: ResourceType, resource_id: str = None) -> bool:
        """Check if permission matches the given resource"""
        if self.resource_type != resource_type:
            return False
        
        # If permission is for all resources of this type
        if self.resource_id is None:
            return True
        
        # If permission is for specific resource
        return self.resource_id == resource_id


class Role(ValueObject):
    """Role with associated permissions"""
    name: str
    display_name: str
    description: Optional[str] = None
    permissions: List[Permission] = Field(default_factory=list)
    is_system_role: bool = False
    client_id: Optional[str] = None  # Client-specific role
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def has_permission(
        self, 
        resource_type: ResourceType, 
        permission_type: PermissionType,
        resource_id: str = None
    ) -> bool:
        """Check if role has specific permission"""
        for permission in self.permissions:
            if (permission.permission_type == permission_type and 
                permission.matches_resource(resource_type, resource_id) and
                not permission.is_expired()):
                return True
        return False


class APIKey(ValueObject):
    """API key for programmatic access"""
    key_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    key_hash: str  # Hashed version of the actual key
    name: str
    description: Optional[str] = None
    permissions: List[Permission] = Field(default_factory=list)
    rate_limit: Optional[int] = None  # Requests per minute
    allowed_ips: List[str] = Field(default_factory=list)
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    usage_count: int = 0
    is_active: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @classmethod
    def create(
        cls,
        name: str,
        created_by: str,
        permissions: List[Permission] = None,
        description: str = None,
        expires_at: datetime = None,
        rate_limit: int = None
    ) -> tuple['APIKey', str]:
        """Create API key and return both the model and the actual key"""
        # Generate actual API key
        actual_key = f"aic_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(actual_key.encode()).hexdigest()
        
        api_key = cls(
            key_hash=key_hash,
            name=name,
            description=description,
            permissions=permissions or [],
            rate_limit=rate_limit,
            expires_at=expires_at,
            created_by=created_by
        )
        
        return api_key, actual_key
    
    def is_expired(self) -> bool:
        """Check if API key has expired"""
        return self.expires_at is not None and self.expires_at < datetime.utcnow()
    
    def is_valid(self) -> bool:
        """Check if API key is valid for use"""
        return self.is_active and not self.is_expired()
    
    def record_usage(self, ip_address: str = None):
        """Record API key usage"""
        self.last_used_at = datetime.utcnow()
        self.usage_count += 1


class UserSession(ValueObject):
    """User session information"""
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    status: SessionStatus = SessionStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime
    last_activity_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    device_info: Dict[str, Any] = Field(default_factory=dict)
    
    def is_expired(self) -> bool:
        """Check if session has expired"""
        return self.expires_at < datetime.utcnow()
    
    def is_active(self) -> bool:
        """Check if session is active"""
        return self.status == SessionStatus.ACTIVE and not self.is_expired()
    
    def extend_session(self, duration_hours: int = 24):
        """Extend session expiration"""
        self.expires_at = datetime.utcnow() + timedelta(hours=duration_hours)
        self.last_activity_at = datetime.utcnow()
    
    def revoke(self):
        """Revoke the session"""
        self.status = SessionStatus.REVOKED


class User(AggregateRoot):
    """User aggregate root"""
    email: EmailStr
    username: str
    first_name: str
    last_name: str
    password_hash: Optional[str] = None  # None for external auth providers
    status: UserStatus = UserStatus.PENDING_VERIFICATION
    roles: List[UserRole] = Field(default_factory=list)
    custom_roles: List[Role] = Field(default_factory=list)
    permissions: List[Permission] = Field(default_factory=list)  # Direct permissions
    client_id: Optional[str] = None  # Associated client
    auth_provider: AuthProvider = AuthProvider.LOCAL
    external_id: Optional[str] = None  # ID from external auth provider
    profile_data: Dict[str, Any] = Field(default_factory=dict)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    last_login_at: Optional[datetime] = None
    password_changed_at: Optional[datetime] = None
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None
    email_verified: bool = False
    phone_number: Optional[str] = None
    phone_verified: bool = False
    two_factor_enabled: bool = False
    two_factor_secret: Optional[str] = None
    backup_codes: List[str] = Field(default_factory=list)
    api_keys: List[APIKey] = Field(default_factory=list)
    active_sessions: List[UserSession] = Field(default_factory=list)
    
    @classmethod
    def create(
        cls,
        email: str,
        username: str,
        first_name: str,
        last_name: str,
        password: str = None,
        client_id: str = None,
        auth_provider: AuthProvider = AuthProvider.LOCAL,
        external_id: str = None
    ) -> 'User':
        """Factory method to create a new user"""
        
        password_hash = None
        if password and auth_provider == AuthProvider.LOCAL:
            password_hash = cls._hash_password(password)
        
        user = cls(
            email=email,
            username=username,
            first_name=first_name,
            last_name=last_name,
            password_hash=password_hash,
            client_id=client_id,
            auth_provider=auth_provider,
            external_id=external_id
        )
        
        # Add domain event
        user.add_domain_event(UserCreated(
            aggregate_id=user.id,
            email=email,
            username=username,
            client_id=client_id,
            auth_provider=auth_provider.value
        ))
        
        return user
    
    @staticmethod
    def _hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        import bcrypt
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def verify_password(self, password: str) -> bool:
        """Verify password against hash"""
        if not self.password_hash:
            return False
        
        import bcrypt
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def change_password(self, new_password: str, changed_by: str):
        """Change user password"""
        self.password_hash = self._hash_password(new_password)
        self.password_changed_at = datetime.utcnow()
        self.failed_login_attempts = 0
        self.locked_until = None
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(UserPasswordChanged(
            aggregate_id=self.id,
            changed_by=changed_by
        ))
    
    def add_role(self, role: UserRole):
        """Add role to user"""
        if role not in self.roles:
            self.roles.append(role)
            self.updated_at = datetime.utcnow()
            self.version += 1
            
            # Add domain event
            self.add_domain_event(UserRoleAdded(
                aggregate_id=self.id,
                role=role.value
            ))
    
    def remove_role(self, role: UserRole):
        """Remove role from user"""
        if role in self.roles:
            self.roles.remove(role)
            self.updated_at = datetime.utcnow()
            self.version += 1
            
            # Add domain event
            self.add_domain_event(UserRoleRemoved(
                aggregate_id=self.id,
                role=role.value
            ))
    
    def add_permission(self, permission: Permission):
        """Add direct permission to user"""
        self.permissions.append(permission)
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def has_permission(
        self, 
        resource_type: ResourceType, 
        permission_type: PermissionType,
        resource_id: str = None
    ) -> bool:
        """Check if user has specific permission"""
        
        # Check direct permissions
        for permission in self.permissions:
            if (permission.permission_type == permission_type and 
                permission.matches_resource(resource_type, resource_id) and
                not permission.is_expired()):
                return True
        
        # Check role permissions
        for role in self.custom_roles:
            if role.has_permission(resource_type, permission_type, resource_id):
                return True
        
        # Check system role permissions (simplified)
        if UserRole.SUPER_ADMIN in self.roles:
            return True
        
        if UserRole.ADMIN in self.roles and permission_type != PermissionType.DELETE:
            return True
        
        return False
    
    def create_session(
        self, 
        duration_hours: int = 24,
        ip_address: str = None,
        user_agent: str = None
    ) -> UserSession:
        """Create new user session"""
        
        session = UserSession(
            user_id=self.id,
            expires_at=datetime.utcnow() + timedelta(hours=duration_hours),
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self.active_sessions.append(session)
        self.last_login_at = datetime.utcnow()
        self.failed_login_attempts = 0
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(UserLoggedIn(
            aggregate_id=self.id,
            session_id=session.session_id,
            ip_address=ip_address
        ))
        
        return session
    
    def revoke_session(self, session_id: str):
        """Revoke specific session"""
        for session in self.active_sessions:
            if session.session_id == session_id:
                session.revoke()
                break
        
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def revoke_all_sessions(self):
        """Revoke all active sessions"""
        for session in self.active_sessions:
            session.revoke()
        
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(UserSessionsRevoked(
            aggregate_id=self.id
        ))
    
    def create_api_key(
        self,
        name: str,
        permissions: List[Permission] = None,
        description: str = None,
        expires_at: datetime = None,
        rate_limit: int = None
    ) -> tuple[APIKey, str]:
        """Create API key for user"""
        
        api_key, actual_key = APIKey.create(
            name=name,
            created_by=self.id,
            permissions=permissions,
            description=description,
            expires_at=expires_at,
            rate_limit=rate_limit
        )
        
        self.api_keys.append(api_key)
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(APIKeyCreated(
            aggregate_id=self.id,
            api_key_id=api_key.key_id,
            api_key_name=name
        ))
        
        return api_key, actual_key
    
    def revoke_api_key(self, key_id: str):
        """Revoke API key"""
        for api_key in self.api_keys:
            if api_key.key_id == key_id:
                api_key.is_active = False
                break
        
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(APIKeyRevoked(
            aggregate_id=self.id,
            api_key_id=key_id
        ))
    
    def record_failed_login(self):
        """Record failed login attempt"""
        self.failed_login_attempts += 1
        
        # Lock account after 5 failed attempts
        if self.failed_login_attempts >= 5:
            self.locked_until = datetime.utcnow() + timedelta(minutes=30)
            self.status = UserStatus.SUSPENDED
        
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def is_locked(self) -> bool:
        """Check if account is locked"""
        return (self.locked_until is not None and 
                self.locked_until > datetime.utcnow())
    
    def unlock_account(self):
        """Unlock user account"""
        self.locked_until = None
        self.failed_login_attempts = 0
        if self.status == UserStatus.SUSPENDED:
            self.status = UserStatus.ACTIVE
        
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def verify_email(self):
        """Mark email as verified"""
        self.email_verified = True
        if self.status == UserStatus.PENDING_VERIFICATION:
            self.status = UserStatus.ACTIVE
        
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(UserEmailVerified(
            aggregate_id=self.id
        ))
    
    def enable_two_factor(self, secret: str, backup_codes: List[str]):
        """Enable two-factor authentication"""
        self.two_factor_enabled = True
        self.two_factor_secret = secret
        self.backup_codes = backup_codes
        
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(UserTwoFactorEnabled(
            aggregate_id=self.id
        ))
    
    def disable_two_factor(self):
        """Disable two-factor authentication"""
        self.two_factor_enabled = False
        self.two_factor_secret = None
        self.backup_codes = []
        
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(UserTwoFactorDisabled(
            aggregate_id=self.id
        ))
    
    @property
    def full_name(self) -> str:
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def display_name(self) -> str:
        """Get user's display name"""
        return self.full_name or self.username
    
    def get_active_sessions(self) -> List[UserSession]:
        """Get all active sessions"""
        return [s for s in self.active_sessions if s.is_active()]
    
    def get_valid_api_keys(self) -> List[APIKey]:
        """Get all valid API keys"""
        return [k for k in self.api_keys if k.is_valid()]


# Domain Events
class UserCreated(BaseEvent):
    event_type: str = "UserCreated"
    aggregate_type: str = "User"
    email: str
    username: str
    client_id: Optional[str] = None
    auth_provider: str


class UserPasswordChanged(BaseEvent):
    event_type: str = "UserPasswordChanged"
    aggregate_type: str = "User"
    changed_by: str


class UserRoleAdded(BaseEvent):
    event_type: str = "UserRoleAdded"
    aggregate_type: str = "User"
    role: str


class UserRoleRemoved(BaseEvent):
    event_type: str = "UserRoleRemoved"
    aggregate_type: str = "User"
    role: str


class UserLoggedIn(BaseEvent):
    event_type: str = "UserLoggedIn"
    aggregate_type: str = "User"
    session_id: str
    ip_address: Optional[str] = None


class UserSessionsRevoked(BaseEvent):
    event_type: str = "UserSessionsRevoked"
    aggregate_type: str = "User"


class APIKeyCreated(BaseEvent):
    event_type: str = "APIKeyCreated"
    aggregate_type: str = "User"
    api_key_id: str
    api_key_name: str


class APIKeyRevoked(BaseEvent):
    event_type: str = "APIKeyRevoked"
    aggregate_type: str = "User"
    api_key_id: str


class UserEmailVerified(BaseEvent):
    event_type: str = "UserEmailVerified"
    aggregate_type: str = "User"


class UserTwoFactorEnabled(BaseEvent):
    event_type: str = "UserTwoFactorEnabled"
    aggregate_type: str = "User"


class UserTwoFactorDisabled(BaseEvent):
    event_type: str = "UserTwoFactorDisabled"
    aggregate_type: str = "User"
