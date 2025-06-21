"""
AI Model Management Application Services
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from shared.domain import ApplicationService, PaginationRequest, PaginationResponse
from shared.event_bus import publish_event
from ..domain.models import (
    AIModel, ModelVersion, ModelDeployment, ModelConfiguration, DatasetInfo,
    ModelArtifact, ModelMetrics, DeploymentConfiguration, ABTestConfiguration,
    ModelType, ModelStatus, DeploymentStatus
)
from ..domain.repositories import AIModelRepository, ModelArtifactRepository, ModelMetricsRepository
from ..domain.services import (
    ModelVersioningService, ModelDeploymentService, ModelMonitoringService, ABTestingService
)
from .dtos import (
    CreateModelRequest, UpdateModelRequest, ModelResponse,
    CreateVersionRequest, ModelVersionResponse,
    CreateDeploymentRequest, DeploymentResponse,
    ModelSearchRequest, ModelAnalyticsResponse
)


class AIModelManagementService(ApplicationService):
    """Application service for AI model management operations"""
    
    def __init__(
        self,
        model_repository: AIModelRepository,
        artifact_repository: ModelArtifactRepository,
        metrics_repository: ModelMetricsRepository,
        versioning_service: ModelVersioningService,
        deployment_service: ModelDeploymentService,
        monitoring_service: ModelMonitoringService,
        ab_testing_service: ABTestingService
    ):
        self.model_repository = model_repository
        self.artifact_repository = artifact_repository
        self.metrics_repository = metrics_repository
        self.versioning_service = versioning_service
        self.deployment_service = deployment_service
        self.monitoring_service = monitoring_service
        self.ab_testing_service = ab_testing_service
    
    async def create_model(self, request: CreateModelRequest) -> ModelResponse:
        """Create a new AI model"""
        # Create model
        model = AIModel.create(
            name=request.name,
            model_type=request.model_type,
            owner_id=request.owner_id,
            description=request.description,
            client_id=request.client_id
        )
        
        # Add tags
        for tag in request.tags or []:
            model.tags.append(tag)
        
        # Save model
        saved_model = await self.model_repository.save(model)
        
        return ModelResponse.from_domain(saved_model)
    
    async def get_model(self, model_id: str) -> Optional[ModelResponse]:
        """Get model by ID"""
        model = await self.model_repository.get_by_id(model_id)
        return ModelResponse.from_domain(model) if model else None
    
    async def update_model(self, model_id: str, request: UpdateModelRequest) -> ModelResponse:
        """Update model information"""
        model = await self.model_repository.get_by_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        # Update basic fields
        if request.name is not None:
            model.name = request.name
        
        if request.description is not None:
            model.description = request.description
        
        if request.status is not None:
            model.status = request.status
        
        # Update tags
        if request.tags_to_add:
            for tag in request.tags_to_add:
                if tag not in model.tags:
                    model.tags.append(tag)
        
        if request.tags_to_remove:
            for tag in request.tags_to_remove:
                if tag in model.tags:
                    model.tags.remove(tag)
        
        # Update marketplace metadata
        if request.marketplace_metadata:
            model.marketplace_metadata.update(request.marketplace_metadata)
        
        model.updated_at = datetime.utcnow()
        model.version += 1
        
        # Save model
        saved_model = await self.model_repository.save(model)
        
        return ModelResponse.from_domain(saved_model)
    
    async def add_model_version(
        self, 
        model_id: str, 
        request: CreateVersionRequest
    ) -> ModelVersionResponse:
        """Add a new version to a model"""
        model = await self.model_repository.get_by_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        # Generate version number if not provided
        version_number = request.version or self.versioning_service.generate_version_number(
            model, request.version_type or "minor"
        )
        
        # Create configuration
        configuration = ModelConfiguration(
            framework=request.framework,
            framework_version=request.framework_version,
            hyperparameters=request.hyperparameters or {},
            preprocessing_steps=request.preprocessing_steps or [],
            feature_columns=request.feature_columns or [],
            target_column=request.target_column,
            model_architecture=request.model_architecture,
            training_config=request.training_config or {}
        )
        
        # Create datasets
        training_dataset = DatasetInfo(
            name=request.training_dataset.name,
            version=request.training_dataset.version,
            source_path=request.training_dataset.source_path,
            size_bytes=request.training_dataset.size_bytes,
            row_count=request.training_dataset.row_count,
            column_count=request.training_dataset.column_count,
            data_schema=request.training_dataset.data_schema or {},
            data_quality_score=request.training_dataset.data_quality_score
        )
        
        validation_dataset = None
        if request.validation_dataset:
            validation_dataset = DatasetInfo(**request.validation_dataset.dict())
        
        test_dataset = None
        if request.test_dataset:
            test_dataset = DatasetInfo(**request.test_dataset.dict())
        
        # Create metrics if provided
        metrics = None
        if request.metrics:
            metrics = ModelMetrics(**request.metrics.dict())
        
        # Create version
        model_version = ModelVersion(
            version=version_number,
            parent_version=request.parent_version,
            configuration=configuration,
            training_dataset=training_dataset,
            validation_dataset=validation_dataset,
            test_dataset=test_dataset,
            metrics=metrics,
            training_start_time=request.training_start_time,
            training_end_time=request.training_end_time,
            training_duration_seconds=request.training_duration_seconds,
            training_logs=request.training_logs,
            notes=request.notes,
            created_by=request.created_by
        )
        
        # Add version to model
        model.add_version(model_version)
        
        # Save model
        saved_model = await self.model_repository.save(model)
        
        # Store training metrics if provided
        if metrics:
            await self.metrics_repository.store_training_metrics(
                model_id=model_id,
                version=version_number,
                metrics=metrics.dict()
            )
        
        return ModelVersionResponse.from_domain(model_version)
    
    async def deploy_model(
        self, 
        model_id: str, 
        request: CreateDeploymentRequest
    ) -> DeploymentResponse:
        """Deploy a model version"""
        model = await self.model_repository.get_by_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        # Create deployment configuration
        config = DeploymentConfiguration(
            environment=request.environment,
            instance_type=request.instance_type,
            min_instances=request.min_instances or 1,
            max_instances=request.max_instances or 10,
            cpu_request=request.cpu_request or "100m",
            memory_request=request.memory_request or "256Mi",
            cpu_limit=request.cpu_limit or "500m",
            memory_limit=request.memory_limit or "512Mi",
            auto_scaling_enabled=request.auto_scaling_enabled or True,
            health_check_path=request.health_check_path or "/health",
            environment_variables=request.environment_variables or {},
            secrets=request.secrets or [],
            custom_config=request.custom_config or {}
        )
        
        # Validate deployment configuration
        model_version = model.get_version(request.model_version)
        if not model_version:
            raise ValueError(f"Model version {request.model_version} not found")
        
        validation_issues = self.deployment_service.validate_deployment_config(config, model_version)
        if validation_issues:
            raise ValueError(f"Deployment validation failed: {'; '.join(validation_issues)}")
        
        # Deploy model
        deployment = model.deploy_version(
            version=request.model_version,
            deployment_name=request.deployment_name,
            configuration=config,
            client_id=request.client_id
        )
        
        # Save model
        saved_model = await self.model_repository.save(model)
        
        # Publish domain events
        for event in saved_model.domain_events:
            await publish_event(event)
        saved_model.clear_domain_events()
        
        return DeploymentResponse.from_domain(deployment)
    
    async def update_deployment_status(
        self,
        model_id: str,
        deployment_id: str,
        status: DeploymentStatus,
        endpoint_url: str = None,
        health_status: str = None
    ) -> DeploymentResponse:
        """Update deployment status"""
        model = await self.model_repository.get_by_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        model.update_deployment_status(deployment_id, status, endpoint_url, health_status)
        
        # Save model
        saved_model = await self.model_repository.save(model)
        
        # Find updated deployment
        deployment = next((d for d in saved_model.deployments if d.id == deployment_id), None)
        if not deployment:
            raise ValueError(f"Deployment {deployment_id} not found after update")
        
        return DeploymentResponse.from_domain(deployment)
    
    async def record_prediction(
        self,
        model_id: str,
        deployment_id: str,
        response_time_ms: float,
        success: bool = True,
        client_id: str = None
    ):
        """Record a prediction request"""
        model = await self.model_repository.get_by_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        model.record_prediction_request(deployment_id, response_time_ms, success, client_id)
        
        # Save model
        saved_model = await self.model_repository.save(model)
        
        # Store prediction metrics
        await self.metrics_repository.store_prediction_metrics(
            model_id=model_id,
            deployment_id=deployment_id,
            metrics={
                'response_time_ms': response_time_ms,
                'success': success,
                'timestamp': datetime.utcnow().isoformat()
            }
        )
        
        # Publish domain events
        for event in saved_model.domain_events:
            await publish_event(event)
        saved_model.clear_domain_events()
    
    async def get_model_analytics(self, model_id: str) -> ModelAnalyticsResponse:
        """Get comprehensive model analytics"""
        model = await self.model_repository.get_by_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        # Get performance summary
        performance_summary = await self.metrics_repository.get_model_performance_summary(model_id)
        
        # Get drift analysis for active deployments
        drift_analyses = {}
        for deployment in model.get_active_deployments():
            drift_analysis = await self.monitoring_service.detect_model_drift(
                model_id, deployment.id
            )
            drift_analyses[deployment.id] = drift_analysis
        
        # Calculate health score
        health_score = model.calculate_model_health_score()
        
        # Get version comparison
        latest_version = model.get_latest_version()
        production_version = model.get_production_version()
        
        version_comparison = None
        if latest_version and production_version and latest_version.version != production_version.version:
            version_comparison = self.versioning_service.calculate_model_diff(
                production_version, latest_version
            )
        
        return ModelAnalyticsResponse(
            model_id=model_id,
            health_score=health_score,
            performance_summary=performance_summary,
            drift_analyses=drift_analyses,
            version_comparison=version_comparison,
            active_deployments=[DeploymentResponse.from_domain(d) for d in model.get_active_deployments()],
            latest_version=ModelVersionResponse.from_domain(latest_version) if latest_version else None,
            production_version=ModelVersionResponse.from_domain(production_version) if production_version else None
        )
    
    async def search_models(self, request: ModelSearchRequest) -> PaginationResponse[ModelResponse]:
        """Search models with filters"""
        models = await self.model_repository.search_models(
            query=request.query,
            model_type=request.model_type,
            status=request.status,
            owner_id=request.owner_id,
            client_id=request.client_id,
            is_public=request.is_public,
            limit=request.pagination.size,
            offset=request.pagination.offset
        )
        
        model_responses = [ModelResponse.from_domain(model) for model in models]
        
        # Get total count (simplified)
        total = len(model_responses)
        
        return PaginationResponse.create(model_responses, total, request.pagination)
    
    async def get_models_by_owner(self, owner_id: str) -> List[ModelResponse]:
        """Get all models owned by a user"""
        models = await self.model_repository.find_by_owner_id(owner_id)
        return [ModelResponse.from_domain(model) for model in models]
    
    async def get_models_by_client(self, client_id: str) -> List[ModelResponse]:
        """Get all models for a client"""
        models = await self.model_repository.find_by_client_id(client_id)
        return [ModelResponse.from_domain(model) for model in models]
    
    async def get_public_models(self) -> List[ModelResponse]:
        """Get all public models in marketplace"""
        models = await self.model_repository.find_public_models()
        return [ModelResponse.from_domain(model) for model in models]
    
    async def promote_to_production(self, model_id: str, version: str) -> ModelResponse:
        """Promote a model version to production"""
        model = await self.model_repository.get_by_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        model.promote_to_production(version)
        saved_model = await self.model_repository.save(model)
        
        return ModelResponse.from_domain(saved_model)
    
    async def add_to_marketplace(
        self, 
        model_id: str, 
        metadata: Dict[str, Any]
    ) -> ModelResponse:
        """Add model to marketplace"""
        model = await self.model_repository.get_by_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        model.add_to_marketplace(metadata)
        saved_model = await self.model_repository.save(model)
        
        return ModelResponse.from_domain(saved_model)
    
    async def start_ab_test(
        self,
        model_id: str,
        configuration: ABTestConfiguration
    ) -> Dict[str, Any]:
        """Start an A/B test"""
        model = await self.model_repository.get_by_id(model_id)
        if not model:
            raise ValueError(f"Model {model_id} not found")
        
        ab_test = model.start_ab_test(configuration)
        saved_model = await self.model_repository.save(model)
        
        return {
            'test_id': ab_test.id,
            'configuration': ab_test.configuration.dict(),
            'status': ab_test.status,
            'start_date': ab_test.start_date
        }
    
    async def get_model_health_report(self, model_id: str) -> Dict[str, Any]:
        """Get model health report"""
        return await self.monitoring_service.generate_model_health_report(model_id)
    
    async def get_dashboard_summary(self, owner_id: str = None) -> Dict[str, Any]:
        """Get dashboard summary for models"""
        # Get model statistics
        stats = await self.model_repository.get_model_statistics()
        
        # Get models by owner if specified
        if owner_id:
            user_models = await self.model_repository.find_by_owner_id(owner_id)
            models_with_deployments = [m for m in user_models if m.get_active_deployments()]
            models_needing_attention = [m for m in user_models if m.is_at_risk()]
        else:
            models_with_deployments = await self.model_repository.find_models_with_active_deployments()
            models_needing_attention = await self.model_repository.find_models_needing_retraining()
        
        return {
            'statistics': stats,
            'models_with_deployments': len(models_with_deployments),
            'models_needing_attention': len(models_needing_attention),
            'recent_deployments': [
                {
                    'model_id': model.id,
                    'model_name': model.name,
                    'deployments': [DeploymentResponse.from_domain(d) for d in model.get_active_deployments()]
                }
                for model in models_with_deployments[:5]
            ]
        }
