"""
Nextcloud Integration DTOs (Data Transfer Objects)
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from shared.domain import PaginationRequest
from ..domain.models import (
    NextcloudDocument, DocumentFolder, DocumentType, DocumentStatus, 
    SharePermission, DocumentMetadata, DocumentVersion, DocumentShare
)


class UploadDocumentRequest(BaseModel):
    """Request DTO for uploading a document"""
    file_name: str = Field(..., min_length=1, max_length=255)
    file_content: bytes
    client_id: str
    project_id: Optional[str] = None
    uploaded_by: str
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    custom_properties: Optional[Dict[str, Any]] = None
    compliance_classification: Optional[str] = None
    retention_period_days: Optional[int] = None


class UpdateDocumentRequest(BaseModel):
    """Request DTO for updating document metadata"""
    metadata_updates: Optional[Dict[str, Any]] = None
    status: Optional[DocumentStatus] = None
    updated_by: str


class ShareDocumentRequest(BaseModel):
    """Request DTO for sharing a document"""
    share_with_user: Optional[str] = None  # User ID for user share
    permissions: List[SharePermission]
    shared_by: str
    password: Optional[str] = None
    expires_at: Optional[datetime] = None


class CreateFolderRequest(BaseModel):
    """Request DTO for creating a folder"""
    folder_name: str = Field(..., min_length=1, max_length=255)
    client_id: str
    project_id: Optional[str] = None
    parent_folder_id: Optional[str] = None
    created_by: str


class DocumentVersionResponse(BaseModel):
    """Response DTO for document version"""
    version_number: str
    nextcloud_file_id: str
    file_size: int
    created_by: str
    created_at: datetime
    comment: Optional[str] = None
    is_current: bool
    
    @classmethod
    def from_domain(cls, version: DocumentVersion) -> 'DocumentVersionResponse':
        """Convert domain model to response DTO"""
        return cls(
            version_number=version.version_number,
            nextcloud_file_id=version.nextcloud_file_id,
            file_size=version.file_size,
            created_by=version.created_by,
            created_at=version.created_at,
            comment=version.comment,
            is_current=version.is_current
        )


class DocumentShareResponse(BaseModel):
    """Response DTO for document share"""
    share_id: str
    shared_with: str
    permissions: List[SharePermission]
    share_token: Optional[str] = None
    password_protected: bool
    expires_at: Optional[datetime] = None
    created_by: str
    created_at: datetime
    
    @classmethod
    def from_domain(cls, share: DocumentShare) -> 'DocumentShareResponse':
        """Convert domain model to response DTO"""
        return cls(
            share_id=share.share_id,
            shared_with=share.shared_with,
            permissions=share.permissions,
            share_token=share.share_token,
            password_protected=share.password_protected,
            expires_at=share.expires_at,
            created_by=share.created_by,
            created_at=share.created_at
        )


class DocumentMetadataResponse(BaseModel):
    """Response DTO for document metadata"""
    title: str
    description: Optional[str] = None
    document_type: DocumentType
    tags: List[str]
    custom_properties: Dict[str, Any]
    compliance_classification: Optional[str] = None
    retention_period_days: Optional[int] = None
    
    @classmethod
    def from_domain(cls, metadata: DocumentMetadata) -> 'DocumentMetadataResponse':
        """Convert domain model to response DTO"""
        return cls(
            title=metadata.title,
            description=metadata.description,
            document_type=metadata.document_type,
            tags=metadata.tags,
            custom_properties=metadata.custom_properties,
            compliance_classification=metadata.compliance_classification,
            retention_period_days=metadata.retention_period_days
        )


class DocumentResponse(BaseModel):
    """Response DTO for document"""
    id: str
    nextcloud_file_id: str
    file_name: str
    file_path: str
    client_id: str
    project_id: Optional[str] = None
    owner_id: str
    metadata: DocumentMetadataResponse
    status: DocumentStatus
    current_version: str
    versions: List[DocumentVersionResponse]
    shares: List[DocumentShareResponse]
    file_size: int
    mime_type: str
    checksum: Optional[str] = None
    last_accessed: Optional[datetime] = None
    download_count: int
    created_at: datetime
    updated_at: datetime
    version: int
    
    @classmethod
    def from_domain(cls, document: NextcloudDocument) -> 'DocumentResponse':
        """Convert domain model to response DTO"""
        return cls(
            id=document.id,
            nextcloud_file_id=document.nextcloud_file_id,
            file_name=document.file_name,
            file_path=document.file_path,
            client_id=document.client_id,
            project_id=document.project_id,
            owner_id=document.owner_id,
            metadata=DocumentMetadataResponse.from_domain(document.metadata),
            status=document.status,
            current_version=document.current_version,
            versions=[DocumentVersionResponse.from_domain(v) for v in document.versions],
            shares=[DocumentShareResponse.from_domain(s) for s in document.shares],
            file_size=document.file_size,
            mime_type=document.mime_type,
            checksum=document.checksum,
            last_accessed=document.last_accessed,
            download_count=document.download_count,
            created_at=document.created_at,
            updated_at=document.updated_at,
            version=document.version
        )


class FolderResponse(BaseModel):
    """Response DTO for folder"""
    id: str
    nextcloud_folder_id: str
    folder_name: str
    folder_path: str
    parent_folder_id: Optional[str] = None
    client_id: str
    project_id: Optional[str] = None
    owner_id: str
    permissions: Dict[str, List[str]]
    is_shared: bool
    document_count: int
    subfolder_count: int
    created_at: datetime
    updated_at: datetime
    
    @classmethod
    def from_domain(cls, folder: DocumentFolder) -> 'FolderResponse':
        """Convert domain model to response DTO"""
        return cls(
            id=folder.id,
            nextcloud_folder_id=folder.nextcloud_folder_id,
            folder_name=folder.folder_name,
            folder_path=folder.folder_path,
            parent_folder_id=folder.parent_folder_id,
            client_id=folder.client_id,
            project_id=folder.project_id,
            owner_id=folder.owner_id,
            permissions=folder.permissions,
            is_shared=folder.is_shared,
            document_count=folder.document_count,
            subfolder_count=folder.subfolder_count,
            created_at=folder.created_at,
            updated_at=folder.updated_at
        )


class DocumentSearchRequest(BaseModel):
    """Request DTO for searching documents"""
    query: str = ""
    client_id: Optional[str] = None
    project_id: Optional[str] = None
    document_type: Optional[DocumentType] = None
    status: Optional[DocumentStatus] = None
    owner_id: Optional[str] = None
    tags: Optional[List[str]] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    file_size_min: Optional[int] = None
    file_size_max: Optional[int] = None
    pagination: PaginationRequest = Field(default_factory=PaginationRequest)


class DocumentAnalyticsResponse(BaseModel):
    """Response DTO for document analytics"""
    total_documents: int
    total_size_bytes: int
    average_size_bytes: float
    document_type_distribution: Dict[str, int]
    recent_uploads_count: int
    recent_accesses_count: int
    most_accessed_documents: List[DocumentResponse]


class BulkDocumentOperationRequest(BaseModel):
    """Request DTO for bulk document operations"""
    document_ids: List[str]
    operation: str = Field(..., regex="^(delete|archive|share|move)$")
    operation_params: Optional[Dict[str, Any]] = None
    performed_by: str


class BulkDocumentOperationResponse(BaseModel):
    """Response DTO for bulk document operations"""
    processed_count: int
    failed_count: int
    success_ids: List[str]
    failed_operations: List[Dict[str, str]]  # document_id -> error_message


class DocumentAccessLogRequest(BaseModel):
    """Request DTO for document access logging"""
    document_id: str
    accessed_by: str
    access_type: str = Field(..., regex="^(view|download|edit|share)$")
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None


class DocumentComplianceRequest(BaseModel):
    """Request DTO for document compliance operations"""
    document_ids: List[str]
    compliance_action: str = Field(..., regex="^(classify|audit|retain|purge)$")
    classification: Optional[str] = None
    retention_period_days: Optional[int] = None
    audit_reason: Optional[str] = None


class DocumentComplianceResponse(BaseModel):
    """Response DTO for document compliance operations"""
    processed_documents: int
    compliance_violations: List[Dict[str, str]]
    actions_taken: List[Dict[str, Any]]
    next_review_date: Optional[datetime] = None


class WorkspaceProvisionRequest(BaseModel):
    """Request DTO for workspace provisioning"""
    client_id: str
    client_name: str
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    workspace_type: str = Field(..., regex="^(client|project)$")
    storage_quota_gb: Optional[int] = None
    user_permissions: Optional[Dict[str, List[str]]] = None


class WorkspaceProvisionResponse(BaseModel):
    """Response DTO for workspace provisioning"""
    workspace_id: str
    workspace_path: str
    folders_created: List[str]
    users_provisioned: List[str]
    groups_created: List[str]
    storage_quota_set: bool
    provisioning_status: str


class DocumentVersionRequest(BaseModel):
    """Request DTO for document versioning"""
    document_id: str
    new_content: bytes
    version_comment: Optional[str] = None
    created_by: str


class DocumentRestoreRequest(BaseModel):
    """Request DTO for document restoration"""
    document_id: str
    version_to_restore: str
    restore_reason: str
    restored_by: str


class FolderTreeResponse(BaseModel):
    """Response DTO for folder tree structure"""
    folder: FolderResponse
    subfolders: List['FolderTreeResponse']
    documents: List[DocumentResponse]
    
    class Config:
        # Enable forward references for recursive model
        arbitrary_types_allowed = True


# Update forward reference
FolderTreeResponse.model_rebuild()
