"""
AI Model Management DTOs (Data Transfer Objects)
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from shared.domain import PaginationRequest
from ..domain.models import (
    AIModel, ModelVersion, ModelDeployment, ModelType, ModelStatus,
    DeploymentStatus, ModelFramework, ModelMetrics
)


class DatasetInfoRequest(BaseModel):
    """Request DTO for dataset information"""
    name: str
    version: str
    source_path: str
    size_bytes: int
    row_count: int
    column_count: int
    data_schema: Optional[Dict[str, str]] = None
    data_quality_score: Optional[float] = Field(None, ge=0, le=1)


class ModelMetricsRequest(BaseModel):
    """Request DTO for model metrics"""
    accuracy: Optional[float] = Field(None, ge=0, le=1)
    precision: Optional[float] = Field(None, ge=0, le=1)
    recall: Optional[float] = Field(None, ge=0, le=1)
    f1_score: Optional[float] = Field(None, ge=0, le=1)
    auc_roc: Optional[float] = Field(None, ge=0, le=1)
    mse: Optional[float] = Field(None, ge=0)
    mae: Optional[float] = Field(None, ge=0)
    r2_score: Optional[float] = Field(None, ge=-1, le=1)
    custom_metrics: Optional[Dict[str, float]] = None


class CreateModelRequest(BaseModel):
    """Request DTO for creating a model"""
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    model_type: ModelType
    owner_id: str
    client_id: Optional[str] = None
    tags: Optional[List[str]] = None


class UpdateModelRequest(BaseModel):
    """Request DTO for updating a model"""
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ModelStatus] = None
    tags_to_add: Optional[List[str]] = None
    tags_to_remove: Optional[List[str]] = None
    marketplace_metadata: Optional[Dict[str, Any]] = None


class CreateVersionRequest(BaseModel):
    """Request DTO for creating a model version"""
    version: Optional[str] = None  # Auto-generated if not provided
    version_type: Optional[str] = Field(None, regex="^(major|minor|patch)$")
    parent_version: Optional[str] = None
    framework: ModelFramework
    framework_version: str
    hyperparameters: Optional[Dict[str, Any]] = None
    preprocessing_steps: Optional[List[str]] = None
    feature_columns: Optional[List[str]] = None
    target_column: Optional[str] = None
    model_architecture: Optional[Dict[str, Any]] = None
    training_config: Optional[Dict[str, Any]] = None
    training_dataset: DatasetInfoRequest
    validation_dataset: Optional[DatasetInfoRequest] = None
    test_dataset: Optional[DatasetInfoRequest] = None
    metrics: Optional[ModelMetricsRequest] = None
    training_start_time: Optional[datetime] = None
    training_end_time: Optional[datetime] = None
    training_duration_seconds: Optional[int] = None
    training_logs: Optional[str] = None
    notes: Optional[str] = None
    created_by: str


class CreateDeploymentRequest(BaseModel):
    """Request DTO for creating a deployment"""
    model_version: str
    deployment_name: str
    environment: str
    instance_type: str
    client_id: Optional[str] = None
    min_instances: Optional[int] = 1
    max_instances: Optional[int] = 10
    cpu_request: Optional[str] = "100m"
    memory_request: Optional[str] = "256Mi"
    cpu_limit: Optional[str] = "500m"
    memory_limit: Optional[str] = "512Mi"
    auto_scaling_enabled: Optional[bool] = True
    health_check_path: Optional[str] = "/health"
    environment_variables: Optional[Dict[str, str]] = None
    secrets: Optional[List[str]] = None
    custom_config: Optional[Dict[str, Any]] = None


class ModelVersionResponse(BaseModel):
    """Response DTO for model version"""
    version: str
    parent_version: Optional[str] = None
    framework: ModelFramework
    framework_version: str
    hyperparameters: Dict[str, Any]
    preprocessing_steps: List[str]
    feature_columns: List[str]
    target_column: Optional[str] = None
    model_architecture: Optional[Dict[str, Any]] = None
    training_config: Dict[str, Any]
    training_dataset_name: str
    validation_dataset_name: Optional[str] = None
    test_dataset_name: Optional[str] = None
    metrics: Optional[ModelMetrics] = None
    training_start_time: Optional[datetime] = None
    training_end_time: Optional[datetime] = None
    training_duration_seconds: Optional[int] = None
    notes: Optional[str] = None
    created_by: str
    created_at: datetime
    is_trained: bool
    has_artifacts: bool
    
    @classmethod
    def from_domain(cls, version: ModelVersion) -> 'ModelVersionResponse':
        """Convert domain model to response DTO"""
        return cls(
            version=version.version,
            parent_version=version.parent_version,
            framework=version.configuration.framework,
            framework_version=version.configuration.framework_version,
            hyperparameters=version.configuration.hyperparameters,
            preprocessing_steps=version.configuration.preprocessing_steps,
            feature_columns=version.configuration.feature_columns,
            target_column=version.configuration.target_column,
            model_architecture=version.configuration.model_architecture,
            training_config=version.configuration.training_config,
            training_dataset_name=version.training_dataset.name,
            validation_dataset_name=version.validation_dataset.name if version.validation_dataset else None,
            test_dataset_name=version.test_dataset.name if version.test_dataset else None,
            metrics=version.metrics,
            training_start_time=version.training_start_time,
            training_end_time=version.training_end_time,
            training_duration_seconds=version.training_duration_seconds,
            notes=version.notes,
            created_by=version.created_by,
            created_at=version.created_at,
            is_trained=version.is_trained,
            has_artifacts=version.has_artifacts
        )


class DeploymentResponse(BaseModel):
    """Response DTO for deployment"""
    id: str
    model_id: str
    model_version: str
    client_id: Optional[str] = None
    deployment_name: str
    status: DeploymentStatus
    environment: str
    instance_type: str
    min_instances: int
    max_instances: int
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    health_status: str
    request_count: int
    error_count: int
    average_response_time_ms: float
    deployed_at: Optional[datetime] = None
    last_updated: datetime
    is_healthy: bool
    error_rate: float
    
    @classmethod
    def from_domain(cls, deployment: ModelDeployment) -> 'DeploymentResponse':
        """Convert domain model to response DTO"""
        return cls(
            id=deployment.id,
            model_id=deployment.model_id,
            model_version=deployment.model_version,
            client_id=deployment.client_id,
            deployment_name=deployment.deployment_name,
            status=deployment.status,
            environment=deployment.configuration.environment,
            instance_type=deployment.configuration.instance_type,
            min_instances=deployment.configuration.min_instances,
            max_instances=deployment.configuration.max_instances,
            endpoint_url=deployment.endpoint_url,
            api_key=deployment.api_key,
            health_status=deployment.health_status,
            request_count=deployment.request_count,
            error_count=deployment.error_count,
            average_response_time_ms=deployment.average_response_time_ms,
            deployed_at=deployment.deployed_at,
            last_updated=deployment.last_updated,
            is_healthy=deployment.is_healthy(),
            error_rate=deployment.calculate_error_rate()
        )


class ModelResponse(BaseModel):
    """Response DTO for model"""
    id: str
    name: str
    description: Optional[str] = None
    model_type: ModelType
    status: ModelStatus
    owner_id: str
    client_id: Optional[str] = None
    versions: List[ModelVersionResponse]
    deployments: List[DeploymentResponse]
    tags: List[str]
    is_public: bool
    marketplace_metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    version: int
    latest_version: Optional[str] = None
    production_version: Optional[str] = None
    health_score: float
    
    @classmethod
    def from_domain(cls, model: AIModel) -> 'ModelResponse':
        """Convert domain model to response DTO"""
        latest_version = model.get_latest_version()
        production_version = model.get_production_version()
        
        return cls(
            id=model.id,
            name=model.name,
            description=model.description,
            model_type=model.model_type,
            status=model.status,
            owner_id=model.owner_id,
            client_id=model.client_id,
            versions=[ModelVersionResponse.from_domain(v) for v in model.versions],
            deployments=[DeploymentResponse.from_domain(d) for d in model.deployments],
            tags=model.tags,
            is_public=model.is_public,
            marketplace_metadata=model.marketplace_metadata,
            created_at=model.created_at,
            updated_at=model.updated_at,
            version=model.version,
            latest_version=latest_version.version if latest_version else None,
            production_version=production_version.version if production_version else None,
            health_score=model.calculate_model_health_score()
        )


class ModelSearchRequest(BaseModel):
    """Request DTO for searching models"""
    query: str = ""
    model_type: Optional[ModelType] = None
    status: Optional[ModelStatus] = None
    owner_id: Optional[str] = None
    client_id: Optional[str] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None
    has_deployments: Optional[bool] = None
    pagination: PaginationRequest = Field(default_factory=PaginationRequest)


class ModelAnalyticsResponse(BaseModel):
    """Response DTO for model analytics"""
    model_id: str
    health_score: float
    performance_summary: Dict[str, Any]
    drift_analyses: Dict[str, Dict[str, Any]]
    version_comparison: Optional[Dict[str, Any]] = None
    active_deployments: List[DeploymentResponse]
    latest_version: Optional[ModelVersionResponse] = None
    production_version: Optional[ModelVersionResponse] = None


class PredictionRequest(BaseModel):
    """Request DTO for model prediction"""
    model_id: str
    deployment_id: str
    input_data: Dict[str, Any]
    client_id: Optional[str] = None


class PredictionResponse(BaseModel):
    """Response DTO for model prediction"""
    prediction: Any
    confidence: Optional[float] = None
    model_version: str
    response_time_ms: float
    request_id: str


class ABTestRequest(BaseModel):
    """Request DTO for A/B test"""
    test_name: str
    description: str
    control_model_version: str
    treatment_model_version: str
    traffic_split_percentage: int = Field(default=50, ge=1, le=99)
    success_metric: str
    minimum_sample_size: int = 1000
    statistical_significance_threshold: float = 0.05
    max_duration_days: int = 30
    auto_promote_winner: bool = False


class ModelArtifactRequest(BaseModel):
    """Request DTO for model artifact"""
    artifact_type: str
    file_name: str
    content: bytes


class ModelArtifactResponse(BaseModel):
    """Response DTO for model artifact"""
    model_id: str
    version: str
    artifact_type: str
    file_name: str
    file_size: int
    storage_path: str
    created_at: datetime


class ModelHealthResponse(BaseModel):
    """Response DTO for model health"""
    model_id: str
    overall_health_score: float
    deployment_health: List[Dict[str, Any]]
    drift_detected: bool
    recommendations: List[str]
    last_assessment: datetime


class ModelMarketplaceRequest(BaseModel):
    """Request DTO for adding model to marketplace"""
    title: str
    description: str
    category: str
    price: Optional[float] = None
    license_type: str = "MIT"
    documentation_url: Optional[str] = None
    demo_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class ModelUsageRequest(BaseModel):
    """Request DTO for tracking model usage"""
    deployment_id: str
    usage_type: str
    usage_count: int
    client_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ModelComparisonRequest(BaseModel):
    """Request DTO for comparing models"""
    model_ids: List[str]
    comparison_metrics: List[str]
    time_period_days: int = 30


class ModelComparisonResponse(BaseModel):
    """Response DTO for model comparison"""
    models: List[ModelResponse]
    comparison_matrix: Dict[str, Dict[str, Any]]
    recommendations: List[str]
