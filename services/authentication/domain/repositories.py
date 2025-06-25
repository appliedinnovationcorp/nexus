"""
Authentication Repository Interfaces
"""
from abc import abstractmethod
from typing import List, Optional
from datetime import datetime
from shared.domain import Repository
from .models import User, UserRole, UserStatus, AuthProvider


class UserRepository(Repository[User]):
    """User repository interface"""
    
    @abstractmethod
    async def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email"""
        pass
    
    @abstractmethod
    async def find_by_username(self, username: str) -> Optional[User]:
        """Find user by username"""
        pass
    
    @abstractmethod
    async def find_by_external_id(self, provider: AuthProvider, external_id: str) -> Optional[User]:
        """Find user by external provider ID"""
        pass
    
    @abstractmethod
    async def find_by_client_id(self, client_id: str) -> List[User]:
        """Find users by client ID"""
        pass
    
    @abstractmethod
    async def find_by_role(self, role: UserRole) -> List[User]:
        """Find users by role"""
        pass
    
    @abstractmethod
    async def find_by_status(self, status: UserStatus) -> List[User]:
        """Find users by status"""
        pass
    
    @abstractmethod
    async def find_active_users(self) -> List[User]:
        """Find all active users"""
        pass
    
    @abstractmethod
    async def search_users(
        self,
        query: str,
        client_id: Optional[str] = None,
        role: Optional[UserRole] = None,
        status: Optional[UserStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[User]:
        """Search users with filters"""
        pass
    
    @abstractmethod
    async def get_user_statistics(self) -> dict:
        """Get user statistics"""
        pass


class SessionRepository:
    """Session repository interface"""
    
    @abstractmethod
    async def get_session(self, session_id: str) -> Optional[dict]:
        """Get session by ID"""
        pass
    
    @abstractmethod
    async def create_session(self, session_data: dict) -> str:
        """Create new session"""
        pass
    
    @abstractmethod
    async def update_session(self, session_id: str, session_data: dict) -> bool:
        """Update session"""
        pass
    
    @abstractmethod
    async def delete_session(self, session_id: str) -> bool:
        """Delete session"""
        pass
    
    @abstractmethod
    async def delete_user_sessions(self, user_id: str) -> int:
        """Delete all sessions for user"""
        pass
    
    @abstractmethod
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions"""
        pass


class TokenRepository:
    """Token repository for JWT blacklist and refresh tokens"""
    
    @abstractmethod
    async def is_token_blacklisted(self, token_jti: str) -> bool:
        """Check if token is blacklisted"""
        pass
    
    @abstractmethod
    async def blacklist_token(self, token_jti: str, expires_at: datetime) -> bool:
        """Add token to blacklist"""
        pass
    
    @abstractmethod
    async def store_refresh_token(
        self, 
        user_id: str, 
        token_hash: str, 
        expires_at: datetime
    ) -> str:
        """Store refresh token"""
        pass
    
    @abstractmethod
    async def validate_refresh_token(self, user_id: str, token_hash: str) -> bool:
        """Validate refresh token"""
        pass
    
    @abstractmethod
    async def revoke_refresh_token(self, user_id: str, token_hash: str) -> bool:
        """Revoke refresh token"""
        pass
    
    @abstractmethod
    async def revoke_all_refresh_tokens(self, user_id: str) -> int:
        """Revoke all refresh tokens for user"""
        pass
