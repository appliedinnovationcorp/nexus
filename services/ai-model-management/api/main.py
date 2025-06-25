"""
AI Model Management Service API
FastAPI application following hexagonal architecture
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, Query, Path, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn

from ..application.services import AIModelManagementService
from ..application.dtos import (
    CreateModelRequest, UpdateModelRequest, ModelResponse,
    CreateVersionRequest, ModelVersionResponse,
    CreateDeploymentRequest, DeploymentResponse,
    ModelSearchRequest, ModelAnalyticsResponse,
    PredictionRequest, PredictionResponse
)
from ..domain.services import (
    ModelVersioningService, ModelDeploymentService,
    ModelMonitoringService, ABTestingService
)
from ..domain.models import ModelType, ModelStatus, DeploymentStatus
from ..infrastructure.repositories import (
    PostgreSQLAIModelRepository, FileSystemModelArtifactRepository,
    TimescaleDBModelMetricsRepository
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instances
model_service: Optional[AIModelManagementService] = None
model_repo: Optional[PostgreSQLAIModelRepository] = None
artifact_repo: Optional[FileSystemModelArtifactRepository] = None
metrics_repo: Optional[TimescaleDBModelMetricsRepository] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global model_service, model_repo, artifact_repo, metrics_repo
    
    # Initialize repositories
    postgres_conn = os.getenv("POSTGRES_URL", "postgresql://aicuser:aicpass@localhost:5432/aicsynergy")
    timescale_conn = os.getenv("TIMESCALEDB_URL", "postgresql://aicuser:aicpass@localhost:5433/timeseries")
    artifacts_path = os.getenv("ARTIFACTS_PATH", "/app/model_artifacts")
    
    model_repo = PostgreSQLAIModelRepository(postgres_conn)
    await model_repo.initialize()
    
    artifact_repo = FileSystemModelArtifactRepository(artifacts_path)
    
    metrics_repo = TimescaleDBModelMetricsRepository(timescale_conn)
    await metrics_repo.initialize()
    
    # Initialize services
    versioning_service = ModelVersioningService()
    deployment_service = ModelDeploymentService(artifact_repo)
    monitoring_service = ModelMonitoringService(metrics_repo)
    ab_testing_service = ABTestingService()
    
    model_service = AIModelManagementService(
        model_repository=model_repo,
        artifact_repository=artifact_repo,
        metrics_repository=metrics_repo,
        versioning_service=versioning_service,
        deployment_service=deployment_service,
        monitoring_service=monitoring_service,
        ab_testing_service=ab_testing_service
    )
    
    logger.info("AI Model Management Service initialized")
    yield
    
    # Cleanup
    if model_repo and model_repo.pool:
        await model_repo.pool.close()
    if metrics_repo and metrics_repo.pool:
        await metrics_repo.pool.close()
    
    logger.info("AI Model Management Service shutdown")


# Create FastAPI app
app = FastAPI(
    title="AIC Nexus - AI Model Management Service",
    description="AI model management microservice for AIC Nexus platform",
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


def get_model_service() -> AIModelManagementService:
    """Dependency injection for model service"""
    if not model_service:
        raise HTTPException(status_code=500, detail="Service not initialized")
    return model_service


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ai-model-management"}


# Model Management Endpoints
@app.post("/api/v1/models", response_model=ModelResponse, status_code=201)
async def create_model(
    request: CreateModelRequest,
    service: AIModelManagementService = Depends(get_model_service)
):
    """Create a new AI model"""
    try:
        return await service.create_model(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating model: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/models/{model_id}", response_model=ModelResponse)
async def get_model(
    model_id: str = Path(..., description="Model ID"),
    service: AIModelManagementService = Depends(get_model_service)
):
    """Get model by ID"""
    try:
        model = await service.get_model(model_id)
        if not model:
            raise HTTPException(status_code=404, detail="Model not found")
        return model
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.put("/api/v1/models/{model_id}", response_model=ModelResponse)
async def update_model(
    model_id: str = Path(..., description="Model ID"),
    request: UpdateModelRequest = ...,
    service: AIModelManagementService = Depends(get_model_service)
):
    """Update model information"""
    try:
        return await service.update_model(model_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/models/{model_id}/versions", response_model=ModelVersionResponse, status_code=201)
async def add_model_version(
    model_id: str = Path(..., description="Model ID"),
    request: CreateVersionRequest = ...,
    service: AIModelManagementService = Depends(get_model_service)
):
    """Add a new version to a model"""
    try:
        return await service.add_model_version(model_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding version to model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/models/{model_id}/deploy", response_model=DeploymentResponse, status_code=201)
async def deploy_model(
    model_id: str = Path(..., description="Model ID"),
    request: CreateDeploymentRequest = ...,
    service: AIModelManagementService = Depends(get_model_service)
):
    """Deploy a model version"""
    try:
        return await service.deploy_model(model_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error deploying model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.patch("/api/v1/models/{model_id}/deployments/{deployment_id}/status", response_model=DeploymentResponse)
async def update_deployment_status(
    model_id: str = Path(..., description="Model ID"),
    deployment_id: str = Path(..., description="Deployment ID"),
    status: DeploymentStatus = Query(..., description="New deployment status"),
    endpoint_url: Optional[str] = Query(None, description="Deployment endpoint URL"),
    health_status: Optional[str] = Query(None, description="Health status"),
    service: AIModelManagementService = Depends(get_model_service)
):
    """Update deployment status"""
    try:
        return await service.update_deployment_status(
            model_id, deployment_id, status, endpoint_url, health_status
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating deployment status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/models/{model_id}/deployments/{deployment_id}/predict", response_model=PredictionResponse)
async def make_prediction(
    model_id: str = Path(..., description="Model ID"),
    deployment_id: str = Path(..., description="Deployment ID"),
    request: PredictionRequest = ...,
    service: AIModelManagementService = Depends(get_model_service)
):
    """Make a prediction using deployed model"""
    try:
        # This would integrate with actual ML serving infrastructure
        # For now, we'll record the request and return a mock response
        import time
        start_time = time.time()
        
        # Mock prediction logic
        prediction_result = {"prediction": "mock_result", "confidence": 0.95}
        
        response_time = (time.time() - start_time) * 1000  # Convert to ms
        
        # Record the prediction request
        await service.record_prediction(
            model_id=model_id,
            deployment_id=deployment_id,
            response_time_ms=response_time,
            success=True,
            client_id=request.client_id
        )
        
        return PredictionResponse(
            prediction=prediction_result["prediction"],
            confidence=prediction_result["confidence"],
            model_version="1.0.0",  # Would get from deployment
            response_time_ms=response_time,
            request_id=f"req_{int(time.time())}"
        )
    except Exception as e:
        logger.error(f"Error making prediction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/models/{model_id}/analytics", response_model=ModelAnalyticsResponse)
async def get_model_analytics(
    model_id: str = Path(..., description="Model ID"),
    service: AIModelManagementService = Depends(get_model_service)
):
    """Get comprehensive model analytics"""
    try:
        return await service.get_model_analytics(model_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting model analytics {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/models", response_model=List[ModelResponse])
async def search_models(
    query: str = Query("", description="Search query"),
    model_type: Optional[ModelType] = Query(None, description="Filter by model type"),
    status: Optional[ModelStatus] = Query(None, description="Filter by status"),
    owner_id: Optional[str] = Query(None, description="Filter by owner ID"),
    client_id: Optional[str] = Query(None, description="Filter by client ID"),
    is_public: Optional[bool] = Query(None, description="Filter by public status"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    service: AIModelManagementService = Depends(get_model_service)
):
    """Search models with filters"""
    try:
        from shared.domain import PaginationRequest
        search_request = ModelSearchRequest(
            query=query,
            model_type=model_type,
            status=status,
            owner_id=owner_id,
            client_id=client_id,
            is_public=is_public,
            pagination=PaginationRequest(page=page, size=size)
        )
        result = await service.search_models(search_request)
        return result.items
    except Exception as e:
        logger.error(f"Error searching models: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/models/owner/{owner_id}", response_model=List[ModelResponse])
async def get_models_by_owner(
    owner_id: str = Path(..., description="Owner ID"),
    service: AIModelManagementService = Depends(get_model_service)
):
    """Get all models owned by a user"""
    try:
        return await service.get_models_by_owner(owner_id)
    except Exception as e:
        logger.error(f"Error getting models for owner {owner_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/models/client/{client_id}", response_model=List[ModelResponse])
async def get_models_by_client(
    client_id: str = Path(..., description="Client ID"),
    service: AIModelManagementService = Depends(get_model_service)
):
    """Get all models for a client"""
    try:
        return await service.get_models_by_client(client_id)
    except Exception as e:
        logger.error(f"Error getting models for client {client_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/marketplace/models", response_model=List[ModelResponse])
async def get_public_models(
    service: AIModelManagementService = Depends(get_model_service)
):
    """Get all public models in marketplace"""
    try:
        return await service.get_public_models()
    except Exception as e:
        logger.error(f"Error getting public models: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/models/{model_id}/promote/{version}", response_model=ModelResponse)
async def promote_to_production(
    model_id: str = Path(..., description="Model ID"),
    version: str = Path(..., description="Version to promote"),
    service: AIModelManagementService = Depends(get_model_service)
):
    """Promote a model version to production"""
    try:
        return await service.promote_to_production(model_id, version)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error promoting model {model_id} version {version}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/api/v1/models/{model_id}/marketplace")
async def add_to_marketplace(
    model_id: str = Path(..., description="Model ID"),
    metadata: dict = ...,
    service: AIModelManagementService = Depends(get_model_service)
):
    """Add model to marketplace"""
    try:
        return await service.add_to_marketplace(model_id, metadata)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error adding model {model_id} to marketplace: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/models/{model_id}/health")
async def get_model_health_report(
    model_id: str = Path(..., description="Model ID"),
    service: AIModelManagementService = Depends(get_model_service)
):
    """Get model health report"""
    try:
        return await service.get_model_health_report(model_id)
    except Exception as e:
        logger.error(f"Error getting health report for model {model_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Artifact Management
@app.post("/api/v1/models/{model_id}/versions/{version}/artifacts")
async def upload_artifact(
    model_id: str = Path(..., description="Model ID"),
    version: str = Path(..., description="Model version"),
    artifact_type: str = Query(..., description="Artifact type"),
    file: UploadFile = File(...),
    service: AIModelManagementService = Depends(get_model_service)
):
    """Upload model artifact"""
    try:
        content = await file.read()
        storage_path = await artifact_repo.store_artifact(
            model_id=model_id,
            version=version,
            artifact_type=artifact_type,
            file_path=file.filename,
            content=content
        )
        
        return {
            "message": "Artifact uploaded successfully",
            "storage_path": storage_path,
            "file_size": len(content)
        }
    except Exception as e:
        logger.error(f"Error uploading artifact: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/v1/models/{model_id}/versions/{version}/artifacts")
async def list_artifacts(
    model_id: str = Path(..., description="Model ID"),
    version: str = Path(..., description="Model version"),
    service: AIModelManagementService = Depends(get_model_service)
):
    """List model artifacts"""
    try:
        artifacts = await artifact_repo.list_artifacts(model_id, version)
        return {"artifacts": artifacts}
    except Exception as e:
        logger.error(f"Error listing artifacts: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Dashboard and Analytics
@app.get("/api/v1/dashboard/models")
async def get_dashboard_summary(
    owner_id: Optional[str] = Query(None, description="Filter by owner ID"),
    service: AIModelManagementService = Depends(get_model_service)
):
    """Get dashboard summary for models"""
    try:
        return await service.get_dashboard_summary(owner_id)
    except Exception as e:
        logger.error(f"Error getting dashboard summary: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
