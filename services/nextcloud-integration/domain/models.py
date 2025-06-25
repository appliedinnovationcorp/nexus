"""
Nextcloud Integration Domain Models
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import Field, validator
from enum import Enum
from shared.domain import AggregateRoot, ValueObject
from shared.events import BaseEvent


class DocumentType(str, Enum):
    """Document types in the system"""
    CONTRACT = "Contract"
    PROPOSAL = "Proposal"
    REPORT = "Report"
    PRESENTATION = "Presentation"
    SPREADSHEET = "Spreadsheet"
    IMAGE = "Image"
    VIDEO = "Video"
    ARCHIVE = "Archive"
    OTHER = "Other"


class SharePermission(str, Enum):
    """Document sharing permissions"""
    READ = "read"
    EDIT = "edit"
    SHARE = "share"
    DELETE = "delete"
    ALL = "all"


class DocumentStatus(str, Enum):
    """Document lifecycle status"""
    DRAFT = "Draft"
    REVIEW = "Review"
    APPROVED = "Approved"
    PUBLISHED = "Published"
    ARCHIVED = "Archived"


class DocumentVersion(ValueObject):
    """Document version information"""
    version_number: str
    nextcloud_file_id: str
    file_size: int
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    comment: Optional[str] = None
    is_current: bool = False


class DocumentShare(ValueObject):
    """Document sharing information"""
    share_id: str
    shared_with: str  # User ID or email
    permissions: List[SharePermission]
    share_token: Optional[str] = None
    password_protected: bool = False
    expires_at: Optional[datetime] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class DocumentMetadata(ValueObject):
    """Document metadata and properties"""
    title: str
    description: Optional[str] = None
    document_type: DocumentType
    tags: List[str] = Field(default_factory=list)
    custom_properties: Dict[str, Any] = Field(default_factory=dict)
    compliance_classification: Optional[str] = None  # Public, Internal, Confidential, Restricted
    retention_period_days: Optional[int] = None


class NextcloudDocument(AggregateRoot):
    """Document stored in Nextcloud with AIC integration"""
    nextcloud_file_id: str
    file_name: str
    file_path: str
    client_id: str
    project_id: Optional[str] = None
    owner_id: str
    metadata: DocumentMetadata
    status: DocumentStatus = DocumentStatus.DRAFT
    current_version: str = "1.0"
    versions: List[DocumentVersion] = Field(default_factory=list)
    shares: List[DocumentShare] = Field(default_factory=list)
    file_size: int
    mime_type: str
    checksum: Optional[str] = None
    last_accessed: Optional[datetime] = None
    download_count: int = 0
    
    @classmethod
    def create(
        cls,
        nextcloud_file_id: str,
        file_name: str,
        file_path: str,
        client_id: str,
        owner_id: str,
        metadata: DocumentMetadata,
        file_size: int,
        mime_type: str,
        project_id: str = None
    ) -> 'NextcloudDocument':
        """Factory method to create a new document"""
        
        # Create initial version
        initial_version = DocumentVersion(
            version_number="1.0",
            nextcloud_file_id=nextcloud_file_id,
            file_size=file_size,
            created_by=owner_id,
            is_current=True
        )
        
        document = cls(
            nextcloud_file_id=nextcloud_file_id,
            file_name=file_name,
            file_path=file_path,
            client_id=client_id,
            project_id=project_id,
            owner_id=owner_id,
            metadata=metadata,
            versions=[initial_version],
            file_size=file_size,
            mime_type=mime_type
        )
        
        # Add domain event
        document.add_domain_event(DocumentUploaded(
            aggregate_id=document.id,
            client_id=client_id,
            project_id=project_id,
            file_name=file_name,
            file_size=file_size,
            uploaded_by=owner_id,
            document_type=metadata.document_type.value
        ))
        
        return document
    
    def add_version(
        self,
        nextcloud_file_id: str,
        version_number: str,
        file_size: int,
        created_by: str,
        comment: str = None
    ):
        """Add a new version of the document"""
        
        # Mark current version as not current
        for version in self.versions:
            version.is_current = False
        
        # Add new version
        new_version = DocumentVersion(
            version_number=version_number,
            nextcloud_file_id=nextcloud_file_id,
            file_size=file_size,
            created_by=created_by,
            comment=comment,
            is_current=True
        )
        
        self.versions.append(new_version)
        self.current_version = version_number
        self.nextcloud_file_id = nextcloud_file_id
        self.file_size = file_size
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(DocumentVersionAdded(
            aggregate_id=self.id,
            version_number=version_number,
            created_by=created_by,
            comment=comment or ""
        ))
    
    def share_document(
        self,
        share_id: str,
        shared_with: str,
        permissions: List[SharePermission],
        created_by: str,
        share_token: str = None,
        password_protected: bool = False,
        expires_at: datetime = None
    ):
        """Share document with user or external party"""
        
        # Check if already shared with this user
        existing_share = next((s for s in self.shares if s.shared_with == shared_with), None)
        if existing_share:
            raise ValueError(f"Document already shared with {shared_with}")
        
        share = DocumentShare(
            share_id=share_id,
            shared_with=shared_with,
            permissions=permissions,
            share_token=share_token,
            password_protected=password_protected,
            expires_at=expires_at,
            created_by=created_by
        )
        
        self.shares.append(share)
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(DocumentShared(
            aggregate_id=self.id,
            shared_with=shared_with,
            permissions=[p.value for p in permissions],
            shared_by=created_by,
            expires_at=expires_at
        ))
    
    def update_metadata(self, metadata: DocumentMetadata):
        """Update document metadata"""
        old_metadata = self.metadata
        self.metadata = metadata
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(DocumentMetadataUpdated(
            aggregate_id=self.id,
            old_metadata=old_metadata.dict(),
            new_metadata=metadata.dict()
        ))
    
    def update_status(self, new_status: DocumentStatus, updated_by: str):
        """Update document status"""
        old_status = self.status
        self.status = new_status
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(DocumentStatusChanged(
            aggregate_id=self.id,
            old_status=old_status.value,
            new_status=new_status.value,
            updated_by=updated_by
        ))
    
    def record_access(self, accessed_by: str):
        """Record document access for analytics"""
        self.last_accessed = datetime.utcnow()
        self.download_count += 1
        
        # Add domain event
        self.add_domain_event(DocumentAccessed(
            aggregate_id=self.id,
            accessed_by=accessed_by,
            access_time=self.last_accessed
        ))
    
    def get_current_version(self) -> Optional[DocumentVersion]:
        """Get the current version of the document"""
        return next((v for v in self.versions if v.is_current), None)
    
    def is_shared_with(self, user_id: str) -> bool:
        """Check if document is shared with specific user"""
        return any(share.shared_with == user_id for share in self.shares)
    
    def get_user_permissions(self, user_id: str) -> List[SharePermission]:
        """Get user's permissions for this document"""
        share = next((s for s in self.shares if s.shared_with == user_id), None)
        return share.permissions if share else []
    
    def is_expired_share(self, user_id: str) -> bool:
        """Check if user's share has expired"""
        share = next((s for s in self.shares if s.shared_with == user_id), None)
        if not share or not share.expires_at:
            return False
        return share.expires_at < datetime.utcnow()


class DocumentFolder(AggregateRoot):
    """Folder structure in Nextcloud"""
    nextcloud_folder_id: str
    folder_name: str
    folder_path: str
    parent_folder_id: Optional[str] = None
    client_id: str
    project_id: Optional[str] = None
    owner_id: str
    permissions: Dict[str, List[str]] = Field(default_factory=dict)  # user_id -> permissions
    is_shared: bool = False
    document_count: int = 0
    subfolder_count: int = 0
    
    @classmethod
    def create(
        cls,
        nextcloud_folder_id: str,
        folder_name: str,
        folder_path: str,
        client_id: str,
        owner_id: str,
        parent_folder_id: str = None,
        project_id: str = None
    ) -> 'DocumentFolder':
        """Factory method to create a new folder"""
        
        folder = cls(
            nextcloud_folder_id=nextcloud_folder_id,
            folder_name=folder_name,
            folder_path=folder_path,
            parent_folder_id=parent_folder_id,
            client_id=client_id,
            project_id=project_id,
            owner_id=owner_id
        )
        
        # Add domain event
        folder.add_domain_event(FolderCreated(
            aggregate_id=folder.id,
            client_id=client_id,
            project_id=project_id,
            folder_name=folder_name,
            folder_path=folder_path,
            created_by=owner_id
        ))
        
        return folder
    
    def add_document(self):
        """Increment document count"""
        self.document_count += 1
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def remove_document(self):
        """Decrement document count"""
        if self.document_count > 0:
            self.document_count -= 1
            self.updated_at = datetime.utcnow()
            self.version += 1


# Domain Events
class DocumentUploaded(BaseEvent):
    event_type: str = "DocumentUploaded"
    aggregate_type: str = "Document"
    client_id: str
    project_id: Optional[str] = None
    file_name: str
    file_size: int
    uploaded_by: str
    document_type: str


class DocumentVersionAdded(BaseEvent):
    event_type: str = "DocumentVersionAdded"
    aggregate_type: str = "Document"
    version_number: str
    created_by: str
    comment: str


class DocumentShared(BaseEvent):
    event_type: str = "DocumentShared"
    aggregate_type: str = "Document"
    shared_with: str
    permissions: List[str]
    shared_by: str
    expires_at: Optional[datetime] = None


class DocumentMetadataUpdated(BaseEvent):
    event_type: str = "DocumentMetadataUpdated"
    aggregate_type: str = "Document"
    old_metadata: Dict[str, Any]
    new_metadata: Dict[str, Any]


class DocumentStatusChanged(BaseEvent):
    event_type: str = "DocumentStatusChanged"
    aggregate_type: str = "Document"
    old_status: str
    new_status: str
    updated_by: str


class DocumentAccessed(BaseEvent):
    event_type: str = "DocumentAccessed"
    aggregate_type: str = "Document"
    accessed_by: str
    access_time: datetime


class FolderCreated(BaseEvent):
    event_type: str = "FolderCreated"
    aggregate_type: str = "Folder"
    client_id: str
    project_id: Optional[str] = None
    folder_name: str
    folder_path: str
    created_by: str
