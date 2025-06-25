"""
Authentication Infrastructure - Repository Implementations
"""
import json
import redis.asyncio as redis
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncpg
from ..domain.models import User, UserRole, UserStatus, AuthProvider, Permission, Role, APIKey, UserSession
from ..domain.repositories import UserRepository, SessionRepository, TokenRepository


class PostgreSQLUserRepository(UserRepository):
    """PostgreSQL implementation of UserRepository"""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.pool = None
    
    async def initialize(self):
        """Initialize connection pool"""
        self.pool = await asyncpg.create_pool(self.connection_string)
        await self._create_tables()
    
    async def _create_tables(self):
        """Create necessary tables"""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(36) PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(100) UNIQUE NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    password_hash VARCHAR(255),
                    status VARCHAR(50) NOT NULL DEFAULT 'PendingVerification',
                    roles TEXT[] DEFAULT '{}',
                    custom_roles JSONB DEFAULT '[]',
                    permissions JSONB DEFAULT '[]',
                    client_id VARCHAR(36),
                    auth_provider VARCHAR(50) NOT NULL DEFAULT 'Local',
                    external_id VARCHAR(255),
                    profile_data JSONB DEFAULT '{}',
                    preferences JSONB DEFAULT '{}',
                    last_login_at TIMESTAMP WITH TIME ZONE,
                    password_changed_at TIMESTAMP WITH TIME ZONE,
                    failed_login_attempts INTEGER DEFAULT 0,
                    locked_until TIMESTAMP WITH TIME ZONE,
                    email_verified BOOLEAN DEFAULT FALSE,
                    phone_number VARCHAR(20),
                    phone_verified BOOLEAN DEFAULT FALSE,
                    two_factor_enabled BOOLEAN DEFAULT FALSE,
                    two_factor_secret VARCHAR(255),
                    backup_codes TEXT[] DEFAULT '{}',
                    api_keys JSONB DEFAULT '[]',
                    active_sessions JSONB DEFAULT '[]',
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    version INTEGER NOT NULL DEFAULT 1
                );
                
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
                CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);
                CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
                CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
                CREATE INDEX IF NOT EXISTS idx_users_external_id ON users(external_id);
                CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN(roles);
            """)
    
    async def get_by_id(self, id: str) -> Optional[User]:
        """Get user by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE id = $1", id)
            return self._row_to_user(row) if row else None
    
    async def save(self, user: User) -> User:
        """Save user"""
        async with self.pool.acquire() as conn:
            # Check if user exists
            existing = await conn.fetchrow("SELECT version FROM users WHERE id = $1", user.id)
            
            if existing:
                # Update existing user
                if existing['version'] != user.version - 1:
                    raise ValueError("Optimistic locking violation")
                
                await conn.execute("""
                    UPDATE users SET
                        email = $2, username = $3, first_name = $4, last_name = $5,
                        password_hash = $6, status = $7, roles = $8, custom_roles = $9,
                        permissions = $10, client_id = $11, auth_provider = $12,
                        external_id = $13, profile_data = $14, preferences = $15,
                        last_login_at = $16, password_changed_at = $17,
                        failed_login_attempts = $18, locked_until = $19,
                        email_verified = $20, phone_number = $21, phone_verified = $22,
                        two_factor_enabled = $23, two_factor_secret = $24,
                        backup_codes = $25, api_keys = $26, active_sessions = $27,
                        updated_at = $28, version = $29
                    WHERE id = $1
                """, 
                    user.id, user.email, user.username, user.first_name, user.last_name,
                    user.password_hash, user.status.value, [r.value for r in user.roles],
                    json.dumps([r.dict() for r in user.custom_roles]),
                    json.dumps([p.dict() for p in user.permissions]),
                    user.client_id, user.auth_provider.value, user.external_id,
                    json.dumps(user.profile_data), json.dumps(user.preferences),
                    user.last_login_at, user.password_changed_at,
                    user.failed_login_attempts, user.locked_until,
                    user.email_verified, user.phone_number, user.phone_verified,
                    user.two_factor_enabled, user.two_factor_secret,
                    user.backup_codes, json.dumps([k.dict() for k in user.api_keys]),
                    json.dumps([s.dict() for s in user.active_sessions]),
                    user.updated_at, user.version
                )
            else:
                # Insert new user
                await conn.execute("""
                    INSERT INTO users (
                        id, email, username, first_name, last_name, password_hash,
                        status, roles, custom_roles, permissions, client_id,
                        auth_provider, external_id, profile_data, preferences,
                        last_login_at, password_changed_at, failed_login_attempts,
                        locked_until, email_verified, phone_number, phone_verified,
                        two_factor_enabled, two_factor_secret, backup_codes,
                        api_keys, active_sessions, created_at, updated_at, version
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24,
                        $25, $26, $27, $28, $29, $30
                    )
                """,
                    user.id, user.email, user.username, user.first_name, user.last_name,
                    user.password_hash, user.status.value, [r.value for r in user.roles],
                    json.dumps([r.dict() for r in user.custom_roles]),
                    json.dumps([p.dict() for p in user.permissions]),
                    user.client_id, user.auth_provider.value, user.external_id,
                    json.dumps(user.profile_data), json.dumps(user.preferences),
                    user.last_login_at, user.password_changed_at,
                    user.failed_login_attempts, user.locked_until,
                    user.email_verified, user.phone_number, user.phone_verified,
                    user.two_factor_enabled, user.two_factor_secret,
                    user.backup_codes, json.dumps([k.dict() for k in user.api_keys]),
                    json.dumps([s.dict() for s in user.active_sessions]),
                    user.created_at, user.updated_at, user.version
                )
        
        return user
    
    async def delete(self, id: str) -> bool:
        """Delete user (soft delete by setting status to inactive)"""
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE users SET status = 'Inactive', updated_at = NOW() WHERE id = $1",
                id
            )
            return result == "UPDATE 1"
    
    async def find_all(self, limit: int = 100, offset: int = 0) -> List[User]:
        """Find all users"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                limit, offset
            )
            return [self._row_to_user(row) for row in rows]
    
    async def find_by_email(self, email: str) -> Optional[User]:
        """Find user by email"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE email = $1", email)
            return self._row_to_user(row) if row else None
    
    async def find_by_username(self, username: str) -> Optional[User]:
        """Find user by username"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE username = $1", username)
            return self._row_to_user(row) if row else None
    
    async def find_by_external_id(self, provider: AuthProvider, external_id: str) -> Optional[User]:
        """Find user by external provider ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM users WHERE auth_provider = $1 AND external_id = $2",
                provider.value, external_id
            )
            return self._row_to_user(row) if row else None
    
    async def find_by_client_id(self, client_id: str) -> List[User]:
        """Find users by client ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM users WHERE client_id = $1 ORDER BY created_at DESC",
                client_id
            )
            return [self._row_to_user(row) for row in rows]
    
    async def find_by_role(self, role: UserRole) -> List[User]:
        """Find users by role"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM users WHERE $1 = ANY(roles) ORDER BY created_at DESC",
                role.value
            )
            return [self._row_to_user(row) for row in rows]
    
    async def find_by_status(self, status: UserStatus) -> List[User]:
        """Find users by status"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM users WHERE status = $1 ORDER BY created_at DESC",
                status.value
            )
            return [self._row_to_user(row) for row in rows]
    
    async def find_active_users(self) -> List[User]:
        """Find all active users"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM users WHERE status = 'Active' ORDER BY last_login_at DESC"
            )
            return [self._row_to_user(row) for row in rows]
    
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
        conditions = []
        params = []
        param_count = 0
        
        if query:
            param_count += 1
            conditions.append(f"(first_name ILIKE ${param_count} OR last_name ILIKE ${param_count} OR email ILIKE ${param_count} OR username ILIKE ${param_count})")
            params.append(f"%{query}%")
        
        if client_id:
            param_count += 1
            conditions.append(f"client_id = ${param_count}")
            params.append(client_id)
        
        if role:
            param_count += 1
            conditions.append(f"${param_count} = ANY(roles)")
            params.append(role.value)
        
        if status:
            param_count += 1
            conditions.append(f"status = ${param_count}")
            params.append(status.value)
        
        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        
        param_count += 1
        params.append(limit)
        param_count += 1
        params.append(offset)
        
        sql = f"""
            SELECT * FROM users 
            WHERE {where_clause}
            ORDER BY created_at DESC 
            LIMIT ${param_count-1} OFFSET ${param_count}
        """
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(sql, *params)
            return [self._row_to_user(row) for row in rows]
    
    async def get_user_statistics(self) -> dict:
        """Get user statistics"""
        async with self.pool.acquire() as conn:
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_users,
                    COUNT(CASE WHEN status = 'PendingVerification' THEN 1 END) as pending_users,
                    COUNT(CASE WHEN two_factor_enabled = TRUE THEN 1 END) as users_with_2fa,
                    COUNT(CASE WHEN last_login_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_logins
                FROM users
            """)
            
            role_stats = await conn.fetch("""
                SELECT unnest(roles) as role, COUNT(*) as count 
                FROM users 
                GROUP BY unnest(roles)
            """)
            
            return {
                'total_users': stats['total_users'],
                'active_users': stats['active_users'],
                'pending_users': stats['pending_users'],
                'users_with_2fa': stats['users_with_2fa'],
                'recent_logins': stats['recent_logins'],
                'users_by_role': {row['role']: row['count'] for row in role_stats}
            }
    
    def _row_to_user(self, row) -> User:
        """Convert database row to User domain model"""
        if not row:
            return None
        
        # Parse roles
        roles = [UserRole(role) for role in row['roles']] if row['roles'] else []
        
        # Parse custom roles
        custom_roles_data = json.loads(row['custom_roles']) if row['custom_roles'] else []
        custom_roles = [Role(**role_data) for role_data in custom_roles_data]
        
        # Parse permissions
        permissions_data = json.loads(row['permissions']) if row['permissions'] else []
        permissions = [Permission(**perm_data) for perm_data in permissions_data]
        
        # Parse API keys
        api_keys_data = json.loads(row['api_keys']) if row['api_keys'] else []
        api_keys = [APIKey(**key_data) for key_data in api_keys_data]
        
        # Parse active sessions
        sessions_data = json.loads(row['active_sessions']) if row['active_sessions'] else []
        active_sessions = [UserSession(**session_data) for session_data in sessions_data]
        
        # Create user
        user = User(
            id=row['id'],
            email=row['email'],
            username=row['username'],
            first_name=row['first_name'],
            last_name=row['last_name'],
            password_hash=row['password_hash'],
            status=UserStatus(row['status']),
            roles=roles,
            custom_roles=custom_roles,
            permissions=permissions,
            client_id=row['client_id'],
            auth_provider=AuthProvider(row['auth_provider']),
            external_id=row['external_id'],
            profile_data=json.loads(row['profile_data']) if row['profile_data'] else {},
            preferences=json.loads(row['preferences']) if row['preferences'] else {},
            last_login_at=row['last_login_at'],
            password_changed_at=row['password_changed_at'],
            failed_login_attempts=row['failed_login_attempts'],
            locked_until=row['locked_until'],
            email_verified=row['email_verified'],
            phone_number=row['phone_number'],
            phone_verified=row['phone_verified'],
            two_factor_enabled=row['two_factor_enabled'],
            two_factor_secret=row['two_factor_secret'],
            backup_codes=list(row['backup_codes']) if row['backup_codes'] else [],
            api_keys=api_keys,
            active_sessions=active_sessions,
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            version=row['version']
        )
        
        return user


class RedisSessionRepository(SessionRepository):
    """Redis implementation of SessionRepository"""
    
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.redis_client = None
    
    async def initialize(self):
        """Initialize Redis connection"""
        self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
    
    async def get_session(self, session_id: str) -> Optional[dict]:
        """Get session by ID"""
        session_key = f"session:{session_id}"
        session_data = await self.redis_client.hgetall(session_key)
        
        if not session_data:
            return None
        
        # Convert string timestamps back to datetime
        if session_data.get('expires_at'):
            session_data['expires_at'] = datetime.fromisoformat(session_data['expires_at'])
        if session_data.get('created_at'):
            session_data['created_at'] = datetime.fromisoformat(session_data['created_at'])
        if session_data.get('last_activity_at'):
            session_data['last_activity_at'] = datetime.fromisoformat(session_data['last_activity_at'])
        
        return session_data
    
    async def create_session(self, session_data: dict) -> str:
        """Create new session"""
        session_id = session_data['session_id']
        session_key = f"session:{session_id}"
        
        # Convert datetime objects to ISO strings for Redis storage
        redis_data = session_data.copy()
        for key in ['expires_at', 'created_at', 'last_activity_at']:
            if key in redis_data and isinstance(redis_data[key], datetime):
                redis_data[key] = redis_data[key].isoformat()
        
        # Store session data
        await self.redis_client.hset(session_key, mapping=redis_data)
        
        # Set expiration
        expires_at = session_data.get('expires_at')
        if expires_at:
            ttl = int((expires_at - datetime.utcnow()).total_seconds())
            if ttl > 0:
                await self.redis_client.expire(session_key, ttl)
        
        # Add to user's session set
        user_sessions_key = f"user_sessions:{session_data['user_id']}"
        await self.redis_client.sadd(user_sessions_key, session_id)
        
        return session_id
    
    async def update_session(self, session_id: str, session_data: dict) -> bool:
        """Update session"""
        session_key = f"session:{session_id}"
        
        # Check if session exists
        if not await self.redis_client.exists(session_key):
            return False
        
        # Convert datetime objects to ISO strings
        redis_data = session_data.copy()
        for key in ['expires_at', 'created_at', 'last_activity_at']:
            if key in redis_data and isinstance(redis_data[key], datetime):
                redis_data[key] = redis_data[key].isoformat()
        
        # Update session data
        await self.redis_client.hset(session_key, mapping=redis_data)
        
        # Update expiration
        expires_at = session_data.get('expires_at')
        if expires_at:
            ttl = int((expires_at - datetime.utcnow()).total_seconds())
            if ttl > 0:
                await self.redis_client.expire(session_key, ttl)
        
        return True
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete session"""
        session_key = f"session:{session_id}"
        
        # Get user ID before deleting
        session_data = await self.redis_client.hgetall(session_key)
        user_id = session_data.get('user_id')
        
        # Delete session
        deleted = await self.redis_client.delete(session_key)
        
        # Remove from user's session set
        if user_id:
            user_sessions_key = f"user_sessions:{user_id}"
            await self.redis_client.srem(user_sessions_key, session_id)
        
        return deleted > 0
    
    async def delete_user_sessions(self, user_id: str) -> int:
        """Delete all sessions for user"""
        user_sessions_key = f"user_sessions:{user_id}"
        
        # Get all session IDs for user
        session_ids = await self.redis_client.smembers(user_sessions_key)
        
        if not session_ids:
            return 0
        
        # Delete all sessions
        session_keys = [f"session:{session_id}" for session_id in session_ids]
        deleted = await self.redis_client.delete(*session_keys)
        
        # Clear user's session set
        await self.redis_client.delete(user_sessions_key)
        
        return deleted
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions"""
        # Redis automatically expires keys, but we need to clean up user session sets
        # This is a simplified implementation - in production, you'd use Redis keyspace notifications
        
        # Get all user session keys
        user_session_keys = await self.redis_client.keys("user_sessions:*")
        cleaned_count = 0
        
        for user_sessions_key in user_session_keys:
            session_ids = await self.redis_client.smembers(user_sessions_key)
            
            for session_id in session_ids:
                session_key = f"session:{session_id}"
                if not await self.redis_client.exists(session_key):
                    # Session expired, remove from user's set
                    await self.redis_client.srem(user_sessions_key, session_id)
                    cleaned_count += 1
        
        return cleaned_count


class RedisTokenRepository(TokenRepository):
    """Redis implementation of TokenRepository"""
    
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.redis_client = None
    
    async def initialize(self):
        """Initialize Redis connection"""
        self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
    
    async def is_token_blacklisted(self, token_jti: str) -> bool:
        """Check if token is blacklisted"""
        blacklist_key = f"blacklist:{token_jti}"
        return await self.redis_client.exists(blacklist_key)
    
    async def blacklist_token(self, token_jti: str, expires_at: datetime) -> bool:
        """Add token to blacklist"""
        blacklist_key = f"blacklist:{token_jti}"
        
        # Set blacklist entry with expiration
        await self.redis_client.set(blacklist_key, "1")
        
        # Set TTL based on token expiration
        ttl = int((expires_at - datetime.utcnow()).total_seconds())
        if ttl > 0:
            await self.redis_client.expire(blacklist_key, ttl)
        
        return True
    
    async def store_refresh_token(
        self, 
        user_id: str, 
        token_hash: str, 
        expires_at: datetime
    ) -> str:
        """Store refresh token"""
        refresh_key = f"refresh:{user_id}:{token_hash}"
        
        # Store refresh token
        await self.redis_client.set(refresh_key, expires_at.isoformat())
        
        # Set TTL
        ttl = int((expires_at - datetime.utcnow()).total_seconds())
        if ttl > 0:
            await self.redis_client.expire(refresh_key, ttl)
        
        # Add to user's refresh token set
        user_refresh_key = f"user_refresh:{user_id}"
        await self.redis_client.sadd(user_refresh_key, token_hash)
        
        return token_hash
    
    async def validate_refresh_token(self, user_id: str, token_hash: str) -> bool:
        """Validate refresh token"""
        refresh_key = f"refresh:{user_id}:{token_hash}"
        return await self.redis_client.exists(refresh_key)
    
    async def revoke_refresh_token(self, user_id: str, token_hash: str) -> bool:
        """Revoke refresh token"""
        refresh_key = f"refresh:{user_id}:{token_hash}"
        
        # Delete refresh token
        deleted = await self.redis_client.delete(refresh_key)
        
        # Remove from user's refresh token set
        user_refresh_key = f"user_refresh:{user_id}"
        await self.redis_client.srem(user_refresh_key, token_hash)
        
        return deleted > 0
    
    async def revoke_all_refresh_tokens(self, user_id: str) -> int:
        """Revoke all refresh tokens for user"""
        user_refresh_key = f"user_refresh:{user_id}"
        
        # Get all refresh token hashes for user
        token_hashes = await self.redis_client.smembers(user_refresh_key)
        
        if not token_hashes:
            return 0
        
        # Delete all refresh tokens
        refresh_keys = [f"refresh:{user_id}:{token_hash}" for token_hash in token_hashes]
        deleted = await self.redis_client.delete(*refresh_keys)
        
        # Clear user's refresh token set
        await self.redis_client.delete(user_refresh_key)
        
        return deleted
