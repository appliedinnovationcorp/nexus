"""Redis Repository Implementations"""
import redis.asyncio as redis
from typing import Optional
from datetime import datetime
from ..domain.repositories import SessionRepository, TokenRepository


class RedisSessionRepository(SessionRepository):
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.redis_client = None
    
    async def initialize(self):
        self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
    
    async def get_session(self, session_id: str) -> Optional[dict]:
        session_key = f"session:{session_id}"
        return await self.redis_client.hgetall(session_key)
    
    async def create_session(self, session_data: dict) -> str:
        session_id = session_data['session_id']
        session_key = f"session:{session_id}"
        await self.redis_client.hset(session_key, mapping=session_data)
        return session_id
    
    async def update_session(self, session_id: str, session_data: dict) -> bool:
        session_key = f"session:{session_id}"
        await self.redis_client.hset(session_key, mapping=session_data)
        return True
    
    async def delete_session(self, session_id: str) -> bool:
        session_key = f"session:{session_id}"
        deleted = await self.redis_client.delete(session_key)
        return deleted > 0
    
    async def delete_user_sessions(self, user_id: str) -> int:
        return 0
    
    async def cleanup_expired_sessions(self) -> int:
        return 0


class RedisTokenRepository(TokenRepository):
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self.redis_client = None
    
    async def initialize(self):
        self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
    
    async def is_token_blacklisted(self, token_jti: str) -> bool:
        return await self.redis_client.exists(f"blacklist:{token_jti}")
    
    async def blacklist_token(self, token_jti: str, expires_at: datetime) -> bool:
        await self.redis_client.set(f"blacklist:{token_jti}", "1")
        return True
    
    async def store_refresh_token(self, user_id: str, token_hash: str, expires_at: datetime) -> str:
        await self.redis_client.set(f"refresh:{user_id}:{token_hash}", expires_at.isoformat())
        return token_hash
    
    async def validate_refresh_token(self, user_id: str, token_hash: str) -> bool:
        return await self.redis_client.exists(f"refresh:{user_id}:{token_hash}")
    
    async def revoke_refresh_token(self, user_id: str, token_hash: str) -> bool:
        deleted = await self.redis_client.delete(f"refresh:{user_id}:{token_hash}")
        return deleted > 0
    
    async def revoke_all_refresh_tokens(self, user_id: str) -> int:
        return 0
