"""
Nextcloud Integration Service API
FastAPI application following hexagonal architecture
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Query, Path, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Optional
import uvicorn
import io

from ..application.services import NextcloudIntegrationService
from ..application.dtos import (
    UploadDocumentRequest, DocumentResponse, ShareDocumentRequest,
    CreateFolderRequest, FolderResponse, DocumentSearchRequest,
    UpdateDocumentRequest, DocumentAnalyticsResponse,
    WorkspaceProvisionRequest, WorkspaceProvisionResponse
)
from ..domain.models import DocumentType, DocumentStatus, SharePermission
from ..infrastructure.nextcloud_client import NextcloudAPIClient
from ..infrastructure.repositories import PostgreSQLDocumentRepository, PostgreSQLFolderRepository

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instances
nextcloud_service: Optional[NextcloudIntegrationService] = None
document_repo: Optional[PostgreSQLDocumentRepository] = None
folder_repo: Optional[PostgreSQLFolderRepository] = None
nextcloud_client: Optional[NextcloudAPIClient] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global nextcloud_service, document_repo, folder_repo, nextcloud_client
    
    # Initialize repositories
    postgres_conn = os.getenv("POSTGRES_URL", "postgresql://aicuser:aicpass@localhost:5432/aicsynergy")
    nextcloud_url = os.getenv("NEXTCLOUD_URL", "http://localhost:8013")
    nextcloud_user = os.getenv("NEXTCLOUD_ADMIN_USER", "aicadmin")
    nextcloud_pass = os.getenv("NEXTCLOUD_ADMIN_PASSWORD", "aicadmin123")
    
    document_repo = PostgreSQLDocumentRepository(postgres_conn)
    await document_repo.initialize()
    
    folder_repo = PostgreSQLFolderRepository(postgres_conn)
    await folder_repo.initialize()
    
    nextcloud_client = NextcloudAPIClient(nextcloud_url, nextcloud_user, nextcloud_pass)
    
    # Initialize service
    nextcloud_service = NextcloudIntegrationService(
        document_repository=document_repo,
        folder_repository=folder_repo,
        nextcloud_api=nextcloud_client
    )
    
    logger.info("Nextcloud Integration Service initialized")
    yield
    
    # Cleanup
    if document_repo and document_repo.pool:
        await document_repo.pool.close()
    if folder_repo and folder_repo.pool:
        await folder_repo.pool.close()
    
    logger.info("Nextcloud Integration Service shutdown")


# Create FastAPI app
app = FastAPI(
    title="AIC Nexus - Nextcloud Integration Service",
    description="Document management and collaboration service integrated with Nextcloud",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_nextcloud_service() -> NextcloudIntegrationService:
    """Dependency injection for nextcloud service"""
    if not nextcloud_service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return nextcloud_service


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "nextcloud-integration"}


# Document Management Endpoints
@app.post("/api/v1/documents/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    client_id: str = Form(...),
    uploaded_by: str = Form(...),
    project_id: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    tags: Optional[str] = Form(None),  # Comma-separated tags
    compliance_classification: Optional[str] = Form(None),
    retention_period_days: Optional[int] = Form(None),
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Upload document to Nextcloud"""
    try:
        # Read file content
        content = await file.read()
        
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(',')] if tags else []
        
        request = UploadDocumentRequest(
            file_name=file.filename,
            file_content=content,
            client_id=client_id,
            project_id=project_id,
            uploaded_by=uploaded_by,
            title=title,
            description=description,
            tags=tag_list,
            compliance_classification=compliance_classification,
            retention_period_days=retention_period_days
        )
        
        return await service.upload_document(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str = Path(..., description="Document ID"),
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Get document by ID"""
    try:
        document = await service.get_document(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.put("/api/v1/documents/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: str = Path(..., description="Document ID"),
    request: UpdateDocumentRequest = ...,
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Update document metadata"""
    try:
        return await service.update_document(document_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/documents/{document_id}/share", response_model=DocumentResponse)
async def share_document(
    document_id: str = Path(..., description="Document ID"),
    request: ShareDocumentRequest = ...,
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Share document with user or create public link"""
    try:
        return await service.share_document(document_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error sharing document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/documents/{document_id}/download")
async def download_document(
    document_id: str = Path(..., description="Document ID"),
    user_id: str = Query(..., description="User ID requesting download"),
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Download document content"""
    try:
        download_data = await service.download_document(document_id, user_id)
        
        # Create streaming response
        content_stream = io.BytesIO(download_data['content'])
        
        return StreamingResponse(
            io.BytesIO(download_data['content']),
            media_type=download_data['mime_type'],
            headers={
                "Content-Disposition": f"attachment; filename={download_data['file_name']}",
                "Content-Length": str(download_data['file_size'])
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error downloading document {document_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/documents/client/{client_id}", response_model=List[DocumentResponse])
async def get_client_documents(
    client_id: str = Path(..., description="Client ID"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Get all documents for a client or project"""
    try:
        return await service.get_client_documents(client_id, project_id)
    except Exception as e:
        logger.error(f"Error getting documents for client {client_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/documents/user/{user_id}", response_model=List[DocumentResponse])
async def get_user_documents(
    user_id: str = Path(..., description="User ID"),
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Get documents owned by or shared with user"""
    try:
        return await service.get_user_documents(user_id)
    except Exception as e:
        logger.error(f"Error getting documents for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/documents/recent/{user_id}", response_model=List[DocumentResponse])
async def get_recent_documents(
    user_id: str = Path(..., description="User ID"),
    days: int = Query(7, ge=1, le=30, description="Number of days to look back"),
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Get recently accessed documents for user"""
    try:
        return await service.get_recent_documents(user_id, days)
    except Exception as e:
        logger.error(f"Error getting recent documents for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/documents", response_model=List[DocumentResponse])
async def search_documents(
    query: str = Query("", description="Search query"),
    client_id: Optional[str] = Query(None, description="Filter by client ID"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    document_type: Optional[DocumentType] = Query(None, description="Filter by document type"),
    status: Optional[DocumentStatus] = Query(None, description="Filter by status"),
    owner_id: Optional[str] = Query(None, description="Filter by owner ID"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Search documents with filters"""
    try:
        from shared.domain import PaginationRequest
        search_request = DocumentSearchRequest(
            query=query,
            client_id=client_id,
            project_id=project_id,
            document_type=document_type,
            status=status,
            owner_id=owner_id,
            pagination=PaginationRequest(page=page, size=size)
        )
        result = await service.search_documents(search_request)
        return result.items
    except Exception as e:
        logger.error(f"Error searching documents: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Folder Management Endpoints
@app.post("/api/v1/folders", response_model=FolderResponse, status_code=201)
async def create_folder(
    request: CreateFolderRequest,
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Create folder in Nextcloud"""
    try:
        return await service.create_folder(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating folder: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Workspace Management Endpoints
@app.post("/api/v1/workspaces/provision", response_model=WorkspaceProvisionResponse)
async def provision_workspace(
    request: WorkspaceProvisionRequest,
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Provision Nextcloud workspace for client or project"""
    try:
        if request.workspace_type == "client":
            result = await service.provision_client_workspace(
                request.client_id, 
                request.client_name
            )
        elif request.workspace_type == "project":
            if not request.project_id or not request.project_name:
                raise ValueError("Project ID and name required for project workspace")
            result = await service.provision_project_workspace(
                request.client_id,
                request.project_id,
                request.project_name
            )
        else:
            raise ValueError("Invalid workspace type")
        
        return WorkspaceProvisionResponse(
            workspace_id=result.get('client_id') or result.get('project_id'),
            workspace_path=result.get('base_path', f"clients/{request.client_id}"),
            folders_created=result.get('folders_created', []),
            users_provisioned=[],
            groups_created=[result.get('group_id')] if result.get('group_created') else [],
            storage_quota_set=False,
            provisioning_status="completed" if result.get('workspace_created') else "failed"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error provisioning workspace: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Analytics Endpoints
@app.get("/api/v1/analytics/documents", response_model=DocumentAnalyticsResponse)
async def get_document_analytics(
    client_id: Optional[str] = Query(None, description="Filter by client ID"),
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Get document analytics and statistics"""
    try:
        return await service.get_document_analytics(client_id)
    except Exception as e:
        logger.error(f"Error getting document analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Integration Endpoints for Other Services
@app.post("/api/v1/integration/client-created")
async def handle_client_created(
    client_data: dict,
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Handle client creation event from Client Management Service"""
    try:
        result = await service.provision_client_workspace(
            client_data['client_id'],
            client_data['client_name']
        )
        return {"status": "success", "workspace_provisioned": result}
    except Exception as e:
        logger.error(f"Error handling client creation: {e}")
        return {"status": "error", "message": str(e)}


@app.post("/api/v1/integration/project-created")
async def handle_project_created(
    project_data: dict,
    service: NextcloudIntegrationService = Depends(get_nextcloud_service)
):
    """Handle project creation event from Project Management Service"""
    try:
        result = await service.provision_project_workspace(
            project_data['client_id'],
            project_data['project_id'],
            project_data['project_name']
        )
        return {"status": "success", "workspace_provisioned": result}
    except Exception as e:
        logger.error(f"Error handling project creation: {e}")
        return {"status": "error", "message": str(e)}


# Direct Nextcloud Access (for admin operations)
@app.get("/api/v1/nextcloud/info")
async def get_nextcloud_info():
    """Get Nextcloud instance information"""
    try:
        async with nextcloud_client as client:
            # This would call Nextcloud status API
            return {
                "nextcloud_url": os.getenv("NEXTCLOUD_URL"),
                "status": "connected",
                "version": "28.0.0"  # Would get from API
            }
    except Exception as e:
        logger.error(f"Error getting Nextcloud info: {e}")
        raise HTTPException(status_code=500, detail="Nextcloud connection error")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
