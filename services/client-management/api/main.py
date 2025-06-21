"""
Client Management Service API
FastAPI application following hexagonal architecture
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn

from shared.domain import ClientType, PaginationRequest
from ..application.services import ClientManagementService
from ..application.dtos import (
    CreateClientRequest, UpdateClientRequest, ClientResponse,
    ClientSearchRequest, ClientSegmentationResponse
)
from ..domain.services import ClientLeadScoringService, ClientSegmentationService
from ..infrastructure.repositories import PostgreSQLClientRepository, MongoDBClientReadRepository

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instances
client_service: Optional[ClientManagementService] = None
postgres_repo: Optional[PostgreSQLClientRepository] = None
mongo_repo: Optional[MongoDBClientReadRepository] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global client_service, postgres_repo, mongo_repo
    
    # Initialize repositories
    postgres_conn = os.getenv("POSTGRES_URL", "postgresql://aicuser:aicpass@localhost:5432/aicsynergy")
    mongo_conn = os.getenv("MONGODB_URL", "mongodb://aicuser:aicpass@localhost:27017")
    
    postgres_repo = PostgreSQLClientRepository(postgres_conn)
    await postgres_repo.initialize()
    
    mongo_repo = MongoDBClientReadRepository(mongo_conn)
    await mongo_repo.initialize()
    
    # Initialize services
    lead_scoring_service = ClientLeadScoringService()
    segmentation_service = ClientSegmentationService(postgres_repo)
    
    client_service = ClientManagementService(
        client_repository=postgres_repo,
        lead_scoring_service=lead_scoring_service,
        segmentation_service=segmentation_service
    )
    
    logger.info("Client Management Service initialized")
    yield
    
    # Cleanup
    if postgres_repo and postgres_repo.pool:
        await postgres_repo.pool.close()
    if mongo_repo and mongo_repo.client:
        mongo_repo.client.close()
    
    logger.info("Client Management Service shutdown")


# Create FastAPI app
app = FastAPI(
    title="AIC Synergy - Client Management Service",
    description="Client management microservice for AIC Synergy platform",
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


def get_client_service() -> ClientManagementService:
    """Dependency injection for client service"""
    if not client_service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return client_service


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "client-management"}


@app.post("/api/v1/clients", response_model=ClientResponse, status_code=201)
async def create_client(
    request: CreateClientRequest,
    service: ClientManagementService = Depends(get_client_service)
):
    """Create a new client"""
    try:
        return await service.create_client(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating client: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/clients/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: str = Path(..., description="Client ID"),
    service: ClientManagementService = Depends(get_client_service)
):
    """Get client by ID"""
    try:
        client = await service.get_client(client_id)
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")
        return client
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting client {client_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.put("/api/v1/clients/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str = Path(..., description="Client ID"),
    request: UpdateClientRequest = ...,
    service: ClientManagementService = Depends(get_client_service)
):
    """Update client information"""
    try:
        return await service.update_client(client_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating client {client_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/clients/{client_id}/deactivate", response_model=ClientResponse)
async def deactivate_client(
    client_id: str = Path(..., description="Client ID"),
    reason: str = Query(..., description="Reason for deactivation"),
    service: ClientManagementService = Depends(get_client_service)
):
    """Deactivate a client"""
    try:
        return await service.deactivate_client(client_id, reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error deactivating client {client_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/clients/{client_id}/reactivate", response_model=ClientResponse)
async def reactivate_client(
    client_id: str = Path(..., description="Client ID"),
    service: ClientManagementService = Depends(get_client_service)
):
    """Reactivate a client"""
    try:
        return await service.reactivate_client(client_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error reactivating client {client_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/clients", response_model=List[ClientResponse])
async def search_clients(
    query: str = Query("", description="Search query"),
    client_type: Optional[ClientType] = Query(None, description="Filter by client type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    service: ClientManagementService = Depends(get_client_service)
):
    """Search clients with filters"""
    try:
        search_request = ClientSearchRequest(
            query=query,
            client_type=client_type,
            is_active=is_active,
            pagination=PaginationRequest(page=page, size=size)
        )
        result = await service.search_clients(search_request)
        return result.items
    except Exception as e:
        logger.error(f"Error searching clients: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/clients/by-type/{client_type}", response_model=List[ClientResponse])
async def get_clients_by_type(
    client_type: ClientType = Path(..., description="Client type"),
    service: ClientManagementService = Depends(get_client_service)
):
    """Get clients by type"""
    try:
        return await service.get_clients_by_type(client_type)
    except Exception as e:
        logger.error(f"Error getting clients by type {client_type}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/clients/high-value", response_model=List[ClientResponse])
async def get_high_value_clients(
    min_score: int = Query(80, ge=0, le=100, description="Minimum lead score"),
    service: ClientManagementService = Depends(get_client_service)
):
    """Get high value clients"""
    try:
        return await service.get_high_value_clients(min_score)
    except Exception as e:
        logger.error(f"Error getting high value clients: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/clients/segmentation", response_model=ClientSegmentationResponse)
async def get_client_segmentation(
    service: ClientManagementService = Depends(get_client_service)
):
    """Get client segmentation analysis"""
    try:
        return await service.get_client_segmentation()
    except Exception as e:
        logger.error(f"Error getting client segmentation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/clients/recalculate-scores")
async def recalculate_lead_scores(
    service: ClientManagementService = Depends(get_client_service)
):
    """Recalculate lead scores for all clients"""
    try:
        updated_scores = await service.recalculate_all_lead_scores()
        return {
            "message": "Lead scores recalculated",
            "updated_count": len(updated_scores),
            "updated_scores": updated_scores
        }
    except Exception as e:
        logger.error(f"Error recalculating lead scores: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Dashboard endpoints for read-optimized queries
@app.get("/api/v1/dashboard/clients")
async def get_dashboard_clients(
    client_type: Optional[ClientType] = Query(None),
    min_lead_score: Optional[int] = Query(None, ge=0, le=100),
    tags: Optional[List[str]] = Query(None)
):
    """Get clients optimized for dashboard display"""
    try:
        if not mongo_repo:
            raise HTTPException(status_code=500, detail="Read repository not available")
        
        filters = {}
        if client_type:
            filters['client_type'] = client_type.value
        if min_lead_score:
            filters['min_lead_score'] = min_lead_score
        if tags:
            filters['tags'] = tags
        
        clients = await mongo_repo.find_clients_for_dashboard("user_id", filters)
        return clients
    except Exception as e:
        logger.error(f"Error getting dashboard clients: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/analytics/clients")
async def get_client_analytics():
    """Get client analytics data"""
    try:
        if not mongo_repo:
            raise HTTPException(status_code=500, detail="Read repository not available")
        
        analytics = await mongo_repo.get_client_analytics()
        type_distribution = await mongo_repo.get_client_type_distribution()
        
        return {
            "summary": analytics,
            "type_distribution": type_distribution
        }
    except Exception as e:
        logger.error(f"Error getting client analytics: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
