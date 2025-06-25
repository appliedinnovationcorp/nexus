"""
Nextcloud Integration Application Services
"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import hashlib
import mimetypes
from shared.domain import ApplicationService, PaginationRequest, PaginationResponse
from shared.event_bus import publish_event
from ..domain.models import (
    NextcloudDocument, DocumentFolder, DocumentMetadata, DocumentType,
    DocumentStatus, SharePermission, DocumentVersion, DocumentShare
)
from ..domain.repositories import NextcloudDocumentRepository, DocumentFolderRepository, NextcloudAPIRepository
from .dtos import (
    UploadDocumentRequest, DocumentResponse, ShareDocumentRequest,
    CreateFolderRequest, FolderResponse, DocumentSearchRequest,
    UpdateDocumentRequest, DocumentAnalyticsResponse
)


class NextcloudIntegrationService(ApplicationService):
    """Application service for Nextcloud integration operations"""
    
    def __init__(
        self,
        document_repository: NextcloudDocumentRepository,
        folder_repository: DocumentFolderRepository,
        nextcloud_api: NextcloudAPIRepository
    ):
        self.document_repository = document_repository
        self.folder_repository = folder_repository
        self.nextcloud_api = nextcloud_api
    
    async def upload_document(self, request: UploadDocumentRequest) -> DocumentResponse:
        """Upload document to Nextcloud and create database record"""
        
        # Determine document type from file extension
        document_type = self._determine_document_type(request.file_name)
        
        # Create metadata
        metadata = DocumentMetadata(
            title=request.title or request.file_name,
            description=request.description,
            document_type=document_type,
            tags=request.tags or [],
            custom_properties=request.custom_properties or {},
            compliance_classification=request.compliance_classification,
            retention_period_days=request.retention_period_days
        )
        
        # Upload to Nextcloud
        upload_result = await self.nextcloud_api.upload_file(
            file_path=request.file_name,
            content=request.file_content,
            client_id=request.client_id,
            project_id=request.project_id
        )
        
        if not upload_result.get('success'):
            raise ValueError(f"Upload failed: {upload_result.get('error')}")
        
        # Calculate checksum
        checksum = hashlib.sha256(request.file_content).hexdigest()
        
        # Create document record
        document = NextcloudDocument.create(
            nextcloud_file_id=upload_result['file_id'],
            file_name=request.file_name,
            file_path=upload_result['file_path'],
            client_id=request.client_id,
            owner_id=request.uploaded_by,
            metadata=metadata,
            file_size=len(request.file_content),
            mime_type=mimetypes.guess_type(request.file_name)[0] or 'application/octet-stream',
            project_id=request.project_id
        )
        
        document.checksum = checksum
        
        # Save document
        saved_document = await self.document_repository.save(document)
        
        # Update folder document count
        await self._update_folder_document_count(request.client_id, request.project_id, 1)
        
        # Publish domain events
        for event in saved_document.domain_events:
            await publish_event(event)
        saved_document.clear_domain_events()
        
        return DocumentResponse.from_domain(saved_document)
    
    async def get_document(self, document_id: str) -> Optional[DocumentResponse]:
        """Get document by ID"""
        document = await self.document_repository.get_by_id(document_id)
        return DocumentResponse.from_domain(document) if document else None
    
    async def update_document(self, document_id: str, request: UpdateDocumentRequest) -> DocumentResponse:
        """Update document metadata and properties"""
        document = await self.document_repository.get_by_id(document_id)
        if not document:
            raise ValueError(f"Document {document_id} not found")
        
        # Update metadata if provided
        if request.metadata_updates:
            current_metadata = document.metadata
            updated_metadata = DocumentMetadata(
                title=request.metadata_updates.get('title', current_metadata.title),
                description=request.metadata_updates.get('description', current_metadata.description),
                document_type=DocumentType(request.metadata_updates.get('document_type', current_metadata.document_type.value)),
                tags=request.metadata_updates.get('tags', current_metadata.tags),
                custom_properties=request.metadata_updates.get('custom_properties', current_metadata.custom_properties),
                compliance_classification=request.metadata_updates.get('compliance_classification', current_metadata.compliance_classification),
                retention_period_days=request.metadata_updates.get('retention_period_days', current_metadata.retention_period_days)
            )
            document.update_metadata(updated_metadata)
        
        # Update status if provided
        if request.status:
            document.update_status(request.status, request.updated_by)
        
        # Save document
        saved_document = await self.document_repository.save(document)
        
        # Publish domain events
        for event in saved_document.domain_events:
            await publish_event(event)
        saved_document.clear_domain_events()
        
        return DocumentResponse.from_domain(saved_document)
    
    async def share_document(self, document_id: str, request: ShareDocumentRequest) -> DocumentResponse:
        """Share document with users or create public link"""
        document = await self.document_repository.get_by_id(document_id)
        if not document:
            raise ValueError(f"Document {document_id} not found")
        
        # Create share in Nextcloud
        share_type = 0 if request.share_with_user else 3  # 0 = user, 3 = public link
        permissions = self._calculate_permissions(request.permissions)
        
        share_result = await self.nextcloud_api.create_share(
            file_path=document.file_path,
            share_type=share_type,
            share_with=request.share_with_user if share_type == 0 else None,
            permissions=permissions,
            password=request.password,
            expire_date=request.expires_at.isoformat() if request.expires_at else None
        )
        
        if not share_result.get('success'):
            raise ValueError(f"Share creation failed: {share_result.get('error')}")
        
        # Add share to document
        share_id = share_result['data'].get('id', str(len(document.shares) + 1))
        document.share_document(
            share_id=str(share_id),
            shared_with=request.share_with_user or 'public',
            permissions=request.permissions,
            created_by=request.shared_by,
            share_token=share_result['data'].get('token'),
            password_protected=bool(request.password),
            expires_at=request.expires_at
        )
        
        # Save document
        saved_document = await self.document_repository.save(document)
        
        # Publish domain events
        for event in saved_document.domain_events:
            await publish_event(event)
        saved_document.clear_domain_events()
        
        return DocumentResponse.from_domain(saved_document)
    
    async def download_document(self, document_id: str, user_id: str) -> Dict[str, Any]:
        """Download document content"""
        document = await self.document_repository.get_by_id(document_id)
        if not document:
            raise ValueError(f"Document {document_id} not found")
        
        # Check permissions
        if document.owner_id != user_id and not document.is_shared_with(user_id):
            raise ValueError("Access denied")
        
        # Download from Nextcloud
        content = await self.nextcloud_api.download_file(document.file_path)
        
        # Record access
        document.record_access(user_id)
        await self.document_repository.save(document)
        
        # Publish domain events
        for event in document.domain_events:
            await publish_event(event)
        document.clear_domain_events()
        
        return {
            'content': content,
            'file_name': document.file_name,
            'mime_type': document.mime_type,
            'file_size': document.file_size
        }
    
    async def create_folder(self, request: CreateFolderRequest) -> FolderResponse:
        """Create folder in Nextcloud and database"""
        
        # Construct folder path
        if request.project_id:
            folder_path = f"clients/{request.client_id}/projects/{request.project_id}/{request.folder_name}"
        else:
            folder_path = f"clients/{request.client_id}/{request.folder_name}"
        
        # Create folder in Nextcloud
        create_result = await self.nextcloud_api.create_folder(folder_path)
        
        if not create_result.get('success'):
            raise ValueError(f"Folder creation failed: {create_result.get('error')}")
        
        # Create folder record
        folder = DocumentFolder.create(
            nextcloud_folder_id=folder_path,  # Use path as ID for now
            folder_name=request.folder_name,
            folder_path=folder_path,
            client_id=request.client_id,
            owner_id=request.created_by,
            parent_folder_id=request.parent_folder_id,
            project_id=request.project_id
        )
        
        # Save folder
        saved_folder = await self.folder_repository.save(folder)
        
        # Publish domain events
        for event in saved_folder.domain_events:
            await publish_event(event)
        saved_folder.clear_domain_events()
        
        return FolderResponse.from_domain(saved_folder)
    
    async def get_client_documents(self, client_id: str, project_id: str = None) -> List[DocumentResponse]:
        """Get all documents for a client or project"""
        if project_id:
            documents = await self.document_repository.find_by_project_id(project_id)
        else:
            documents = await self.document_repository.find_by_client_id(client_id)
        
        return [DocumentResponse.from_domain(doc) for doc in documents]
    
    async def get_user_documents(self, user_id: str) -> List[DocumentResponse]:
        """Get documents owned by or shared with user"""
        owned_docs = await self.document_repository.find_by_owner_id(user_id)
        shared_docs = await self.document_repository.find_shared_with_user(user_id)
        
        # Combine and deduplicate
        all_docs = {doc.id: doc for doc in owned_docs + shared_docs}
        
        return [DocumentResponse.from_domain(doc) for doc in all_docs.values()]
    
    async def search_documents(self, request: DocumentSearchRequest) -> PaginationResponse[DocumentResponse]:
        """Search documents with filters"""
        documents = await self.document_repository.search_documents(
            query=request.query,
            client_id=request.client_id,
            project_id=request.project_id,
            document_type=request.document_type,
            status=request.status,
            owner_id=request.owner_id,
            limit=request.pagination.size,
            offset=request.pagination.offset
        )
        
        document_responses = [DocumentResponse.from_domain(doc) for doc in documents]
        
        # Get total count (simplified)
        total = len(document_responses)
        
        return PaginationResponse.create(document_responses, total, request.pagination)
    
    async def get_recent_documents(self, user_id: str, days: int = 7) -> List[DocumentResponse]:
        """Get recently accessed documents for user"""
        documents = await self.document_repository.find_recent_documents(user_id, days)
        return [DocumentResponse.from_domain(doc) for doc in documents]
    
    async def get_document_analytics(self, client_id: str = None) -> DocumentAnalyticsResponse:
        """Get document analytics and statistics"""
        stats = await self.document_repository.get_document_statistics(client_id)
        
        # Get additional analytics
        if client_id:
            documents = await self.document_repository.find_by_client_id(client_id)
        else:
            documents = await self.document_repository.find_all(limit=1000)
        
        # Calculate analytics
        total_size = sum(doc.file_size for doc in documents)
        avg_size = total_size / len(documents) if documents else 0
        
        # Document type distribution
        type_distribution = {}
        for doc in documents:
            doc_type = doc.metadata.document_type.value
            type_distribution[doc_type] = type_distribution.get(doc_type, 0) + 1
        
        # Recent activity (last 30 days)
        recent_cutoff = datetime.utcnow() - timedelta(days=30)
        recent_uploads = [doc for doc in documents if doc.created_at >= recent_cutoff]
        recent_accesses = [doc for doc in documents if doc.last_accessed and doc.last_accessed >= recent_cutoff]
        
        return DocumentAnalyticsResponse(
            total_documents=len(documents),
            total_size_bytes=total_size,
            average_size_bytes=avg_size,
            document_type_distribution=type_distribution,
            recent_uploads_count=len(recent_uploads),
            recent_accesses_count=len(recent_accesses),
            most_accessed_documents=[
                DocumentResponse.from_domain(doc) 
                for doc in sorted(documents, key=lambda d: d.download_count, reverse=True)[:10]
            ]
        )
    
    async def provision_client_workspace(self, client_id: str, client_name: str) -> Dict[str, Any]:
        """Provision Nextcloud workspace for new client"""
        
        # Create client folder structure
        folders_to_create = [
            f"clients/{client_id}",
            f"clients/{client_id}/projects",
            f"clients/{client_id}/contracts",
            f"clients/{client_id}/reports",
            f"clients/{client_id}/shared"
        ]
        
        created_folders = []
        for folder_path in folders_to_create:
            result = await self.nextcloud_api.create_folder(folder_path)
            if result.get('success'):
                created_folders.append(folder_path)
        
        # Create client group in Nextcloud
        group_id = f"client_{client_id}"
        group_result = await self.nextcloud_api.create_group(group_id)
        
        return {
            'client_id': client_id,
            'workspace_created': True,
            'folders_created': created_folders,
            'group_created': group_result.get('success', False),
            'group_id': group_id
        }
    
    async def provision_project_workspace(self, client_id: str, project_id: str, project_name: str) -> Dict[str, Any]:
        """Provision Nextcloud workspace for new project"""
        
        # Create project folder structure
        base_path = f"clients/{client_id}/projects/{project_id}"
        folders_to_create = [
            base_path,
            f"{base_path}/documents",
            f"{base_path}/deliverables",
            f"{base_path}/resources",
            f"{base_path}/archive"
        ]
        
        created_folders = []
        for folder_path in folders_to_create:
            result = await self.nextcloud_api.create_folder(folder_path)
            if result.get('success'):
                created_folders.append(folder_path)
        
        return {
            'project_id': project_id,
            'workspace_created': True,
            'folders_created': created_folders,
            'base_path': base_path
        }
    
    def _determine_document_type(self, file_name: str) -> DocumentType:
        """Determine document type from file extension"""
        extension = file_name.lower().split('.')[-1] if '.' in file_name else ''
        
        type_mapping = {
            'pdf': DocumentType.REPORT,
            'doc': DocumentType.REPORT,
            'docx': DocumentType.REPORT,
            'ppt': DocumentType.PRESENTATION,
            'pptx': DocumentType.PRESENTATION,
            'xls': DocumentType.SPREADSHEET,
            'xlsx': DocumentType.SPREADSHEET,
            'jpg': DocumentType.IMAGE,
            'jpeg': DocumentType.IMAGE,
            'png': DocumentType.IMAGE,
            'gif': DocumentType.IMAGE,
            'mp4': DocumentType.VIDEO,
            'avi': DocumentType.VIDEO,
            'mov': DocumentType.VIDEO,
            'zip': DocumentType.ARCHIVE,
            'rar': DocumentType.ARCHIVE,
            'tar': DocumentType.ARCHIVE,
            'gz': DocumentType.ARCHIVE
        }
        
        return type_mapping.get(extension, DocumentType.OTHER)
    
    def _calculate_permissions(self, permissions: List[SharePermission]) -> int:
        """Calculate Nextcloud permissions integer from permission list"""
        permission_map = {
            SharePermission.READ: 1,
            SharePermission.EDIT: 2,
            SharePermission.SHARE: 16,
            SharePermission.DELETE: 8
        }
        
        total = 0
        for perm in permissions:
            total |= permission_map.get(perm, 0)
        
        return total
    
    async def _update_folder_document_count(self, client_id: str, project_id: str = None, delta: int = 1):
        """Update document count in folder"""
        # This would find and update the appropriate folder
        # Simplified implementation for now
        pass
