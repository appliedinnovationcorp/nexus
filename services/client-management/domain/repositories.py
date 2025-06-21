"""
Client Management Repository Interfaces
"""
from abc import abstractmethod
from typing import List, Optional
from shared.domain import Repository, ClientType
from .models import Client


class ClientRepository(Repository[Client]):
    """Client repository interface"""
    
    @abstractmethod
    async def find_by_email(self, email: str) -> Optional[Client]:
        """Find client by email address"""
        pass
    
    @abstractmethod
    async def find_by_type(self, client_type: ClientType) -> List[Client]:
        """Find clients by type"""
        pass
    
    @abstractmethod
    async def find_by_account_manager(self, manager_id: str) -> List[Client]:
        """Find clients assigned to account manager"""
        pass
    
    @abstractmethod
    async def find_by_tag(self, tag: str) -> List[Client]:
        """Find clients with specific tag"""
        pass
    
    @abstractmethod
    async def find_active_clients(self) -> List[Client]:
        """Find all active clients"""
        pass
    
    @abstractmethod
    async def find_high_value_clients(self, min_score: int = 80) -> List[Client]:
        """Find high value clients by lead score"""
        pass
    
    @abstractmethod
    async def search_clients(
        self, 
        query: str, 
        client_type: Optional[ClientType] = None,
        is_active: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Client]:
        """Search clients with filters"""
        pass
    
    @abstractmethod
    async def get_client_count_by_type(self) -> dict:
        """Get count of clients by type"""
        pass
