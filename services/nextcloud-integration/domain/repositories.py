"""
Nextcloud Integration Repository Interfaces
"""
from abc import abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
from shared.domain import Repository
from .models import NextcloudDocument, DocumentFolder, DocumentType, DocumentStatus


class NextcloudDocumentRepository(Repository[NextcloudDocument]):
    """Nextcloud document repository interface"""
    
    @abstractmethod
    async def find_by_client_id(self, client_id: str) -> List[NextcloudDocument]:
        """Find documents by client ID"""
        pass
    
    @abstractmethod
    async def find_by_project_id(self, project_id: str) -> List[NextcloudDocument]:
        """Find documents by project ID"""
        pass
    
    @abstractmethod
    async def find_by_owner_id(self, owner_id: str) -> List[NextcloudDocument]:
        """Find documents by owner ID"""
        pass
    
    @abstractmethod
    async def find_by_nextcloud_file_id(self, nextcloud_file_id: str) -> Optional[NextcloudDocument]:
        """Find document by Nextcloud file ID"""
        pass
    
    @abstractmethod
    async def find_by_status(self, status: DocumentStatus) -> List[NextcloudDocument]:
        """Find documents by status"""
        pass
    
    @abstractmethod
    async def find_by_document_type(self, document_type: DocumentType) -> List[NextcloudDocument]:
        """Find documents by type"""
        pass
    
    @abstractmethod
    async def find_shared_with_user(self, user_id: str) -> List[NextcloudDocument]:
        """Find documents shared with specific user"""
        pass
    
    @abstractmethod
    async def find_by_tags(self, tags: List[str]) -> List[NextcloudDocument]:
        """Find documents by tags"""
        pass
    
    @abstractmethod
    async def find_recent_documents(
        self, 
        user_id: str, 
        days: int = 7, 
        limit: int = 10
    ) -> List[NextcloudDocument]:
        """Find recently accessed documents for user"""
        pass
    
    @abstractmethod
    async def search_documents(
        self,
        query: str,
        client_id: Optional[str] = None,
        project_id: Optional[str] = None,
        document_type: Optional[DocumentType] = None,
        status: Optional[DocumentStatus] = None,
        owner_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[NextcloudDocument]:
        """Search documents with filters"""
        pass
    
    @abstractmethod
    async def get_document_statistics(self, client_id: str = None) -> Dict[str, Any]:
        """Get document statistics"""
        pass


class DocumentFolderRepository(Repository[DocumentFolder]):
    """Document folder repository interface"""
    
    @abstractmethod
    async def find_by_client_id(self, client_id: str) -> List[DocumentFolder]:
        """Find folders by client ID"""
        pass
    
    @abstractmethod
    async def find_by_project_id(self, project_id: str) -> List[DocumentFolder]:
        """Find folders by project ID"""
        pass
    
    @abstractmethod
    async def find_by_parent_folder(self, parent_folder_id: str) -> List[DocumentFolder]:
        """Find subfolders by parent folder ID"""
        pass
    
    @abstractmethod
    async def find_by_nextcloud_folder_id(self, nextcloud_folder_id: str) -> Optional[DocumentFolder]:
        """Find folder by Nextcloud folder ID"""
        pass
    
    @abstractmethod
    async def get_folder_tree(self, client_id: str, project_id: str = None) -> Dict[str, Any]:
        """Get hierarchical folder structure"""
        pass


class NextcloudAPIRepository:
    """Repository for direct Nextcloud API operations"""
    
    @abstractmethod
    async def upload_file(
        self,
        file_path: str,
        content: bytes,
        client_id: str,
        project_id: str = None
    ) -> Dict[str, Any]:
        """Upload file to Nextcloud"""
        pass
    
    @abstractmethod
    async def download_file(self, file_path: str) -> bytes:
        """Download file from Nextcloud"""
        pass
    
    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from Nextcloud"""
        pass
    
    @abstractmethod
    async def create_folder(self, folder_path: str) -> Dict[str, Any]:
        """Create folder in Nextcloud"""
        pass
    
    @abstractmethod
    async def list_folder_contents(self, folder_path: str) -> List[Dict[str, Any]]:
        """List contents of a folder"""
        pass
    
    @abstractmethod
    async def create_share(
        self,
        file_path: str,
        share_type: int,
        share_with: str = None,
        permissions: int = 1,
        password: str = None,
        expire_date: str = None
    ) -> Dict[str, Any]:
        """Create file/folder share"""
        pass
    
    @abstractmethod
    async def update_share(
        self,
        share_id: str,
        permissions: int = None,
        password: str = None,
        expire_date: str = None
    ) -> Dict[str, Any]:
        """Update existing share"""
        pass
    
    @abstractmethod
    async def delete_share(self, share_id: str) -> bool:
        """Delete share"""
        pass
    
    @abstractmethod
    async def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get file information and metadata"""
        pass
    
    @abstractmethod
    async def get_file_versions(self, file_path: str) -> List[Dict[str, Any]]:
        """Get file version history"""
        pass
    
    @abstractmethod
    async def restore_file_version(self, file_path: str, version_id: str) -> bool:
        """Restore specific file version"""
        pass
    
    @abstractmethod
    async def create_user(
        self,
        user_id: str,
        password: str,
        display_name: str = None,
        email: str = None,
        groups: List[str] = None
    ) -> Dict[str, Any]:
        """Create Nextcloud user"""
        pass
    
    @abstractmethod
    async def create_group(self, group_id: str) -> Dict[str, Any]:
        """Create Nextcloud group"""
        pass
    
    @abstractmethod
    async def add_user_to_group(self, user_id: str, group_id: str) -> bool:
        """Add user to group"""
        pass
    
    @abstractmethod
    async def set_user_quota(self, user_id: str, quota: str) -> bool:
        """Set user storage quota"""
        pass
