"""
AI Model Management Domain Models
"""
from datetime import datetime
from typing import List, Optional, Dict, Any, Union
from pydantic import Field, validator
from enum import Enum
import uuid
from shared.domain import AggregateRoot, ValueObject
from shared.events import ModelDeployed, ModelPredictionRequested


class ModelType(str, Enum):
    """AI Model types"""
    CLASSIFICATION = "Classification"
    REGRESSION = "Regression"
    CLUSTERING = "Clustering"
    NLP = "NLP"
    COMPUTER_VISION = "Computer_Vision"
    TIME_SERIES = "Time_Series"
    RECOMMENDATION = "Recommendation"
    ANOMALY_DETECTION = "Anomaly_Detection"


class ModelStatus(str, Enum):
    """Model lifecycle status"""
    DEVELOPMENT = "Development"
    TRAINING = "Training"
    VALIDATION = "Validation"
    TESTING = "Testing"
    STAGING = "Staging"
    PRODUCTION = "Production"
    DEPRECATED = "Deprecated"
    ARCHIVED = "Archived"


class DeploymentStatus(str, Enum):
    """Model deployment status"""
    PENDING = "Pending"
    DEPLOYING = "Deploying"
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    FAILED = "Failed"
    SCALING = "Scaling"
    UPDATING = "Updating"


class ModelFramework(str, Enum):
    """Supported ML frameworks"""
    TENSORFLOW = "TensorFlow"
    PYTORCH = "PyTorch"
    SCIKIT_LEARN = "Scikit_Learn"
    XGBOOST = "XGBoost"
    LIGHTGBM = "LightGBM"
    HUGGING_FACE = "Hugging_Face"
    ONNX = "ONNX"
    CUSTOM = "Custom"


class ModelMetrics(ValueObject):
    """Model performance metrics"""
    accuracy: Optional[float] = Field(None, ge=0, le=1)
    precision: Optional[float] = Field(None, ge=0, le=1)
    recall: Optional[float] = Field(None, ge=0, le=1)
    f1_score: Optional[float] = Field(None, ge=0, le=1)
    auc_roc: Optional[float] = Field(None, ge=0, le=1)
    mse: Optional[float] = Field(None, ge=0)
    mae: Optional[float] = Field(None, ge=0)
    r2_score: Optional[float] = Field(None, ge=-1, le=1)
    custom_metrics: Dict[str, float] = Field(default_factory=dict)
    
    def get_primary_metric(self, model_type: ModelType) -> Optional[float]:
        """Get the primary metric based on model type"""
        if model_type == ModelType.CLASSIFICATION:
            return self.f1_score or self.accuracy
        elif model_type == ModelType.REGRESSION:
            return self.r2_score or (1 - self.mse if self.mse else None)
        else:
            return self.accuracy


class ModelConfiguration(ValueObject):
    """Model configuration and hyperparameters"""
    framework: ModelFramework
    framework_version: str
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    preprocessing_steps: List[str] = Field(default_factory=list)
    feature_columns: List[str] = Field(default_factory=list)
    target_column: Optional[str] = None
    model_architecture: Optional[Dict[str, Any]] = None
    training_config: Dict[str, Any] = Field(default_factory=dict)


class DatasetInfo(ValueObject):
    """Information about training/validation datasets"""
    name: str
    version: str
    source_path: str
    size_bytes: int
    row_count: int
    column_count: int
    data_schema: Dict[str, str] = Field(default_factory=dict)  # column_name -> data_type
    data_quality_score: Optional[float] = Field(None, ge=0, le=1)
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class ModelArtifact(ValueObject):
    """Model artifact information"""
    artifact_type: str  # model, weights, config, etc.
    file_path: str
    file_size_bytes: int
    checksum: str
    storage_backend: str = "local"  # local, s3, gcs, etc.
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ModelVersion(ValueObject):
    """Model version information"""
    version: str
    parent_version: Optional[str] = None
    configuration: ModelConfiguration
    training_dataset: DatasetInfo
    validation_dataset: Optional[DatasetInfo] = None
    test_dataset: Optional[DatasetInfo] = None
    metrics: Optional[ModelMetrics] = None
    artifacts: List[ModelArtifact] = Field(default_factory=list)
    training_start_time: Optional[datetime] = None
    training_end_time: Optional[datetime] = None
    training_duration_seconds: Optional[int] = None
    training_logs: Optional[str] = None
    notes: Optional[str] = None
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    @property
    def is_trained(self) -> bool:
        """Check if model version is trained"""
        return self.training_end_time is not None
    
    @property
    def has_artifacts(self) -> bool:
        """Check if model version has artifacts"""
        return len(self.artifacts) > 0


class DeploymentConfiguration(ValueObject):
    """Deployment configuration"""
    environment: str  # development, staging, production
    instance_type: str
    min_instances: int = 1
    max_instances: int = 10
    cpu_request: str = "100m"
    memory_request: str = "256Mi"
    cpu_limit: str = "500m"
    memory_limit: str = "512Mi"
    auto_scaling_enabled: bool = True
    health_check_path: str = "/health"
    environment_variables: Dict[str, str] = Field(default_factory=dict)
    secrets: List[str] = Field(default_factory=list)
    custom_config: Dict[str, Any] = Field(default_factory=dict)


class ModelDeployment(ValueObject):
    """Model deployment instance"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    model_id: str
    model_version: str
    client_id: Optional[str] = None  # Client-specific deployment
    deployment_name: str
    status: DeploymentStatus = DeploymentStatus.PENDING
    configuration: DeploymentConfiguration
    endpoint_url: Optional[str] = None
    api_key: Optional[str] = None
    deployment_logs: Optional[str] = None
    last_health_check: Optional[datetime] = None
    health_status: str = "unknown"
    request_count: int = 0
    error_count: int = 0
    average_response_time_ms: float = 0.0
    deployed_at: Optional[datetime] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    
    def is_healthy(self) -> bool:
        """Check if deployment is healthy"""
        return (self.status == DeploymentStatus.ACTIVE and 
                self.health_status == "healthy" and
                self.last_health_check and
                (datetime.utcnow() - self.last_health_check).seconds < 300)  # 5 minutes
    
    def calculate_error_rate(self) -> float:
        """Calculate error rate percentage"""
        if self.request_count == 0:
            return 0.0
        return (self.error_count / self.request_count) * 100


class ABTestConfiguration(ValueObject):
    """A/B testing configuration"""
    test_name: str
    description: str
    control_model_version: str
    treatment_model_version: str
    traffic_split_percentage: int = Field(default=50, ge=1, le=99)  # % for treatment
    success_metric: str
    minimum_sample_size: int = 1000
    statistical_significance_threshold: float = 0.05
    max_duration_days: int = 30
    auto_promote_winner: bool = False


class ABTest(ValueObject):
    """A/B test instance"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    configuration: ABTestConfiguration
    status: str = "running"  # running, completed, stopped
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: Optional[datetime] = None
    control_requests: int = 0
    treatment_requests: int = 0
    control_successes: int = 0
    treatment_successes: int = 0
    statistical_significance: Optional[float] = None
    winner: Optional[str] = None  # control, treatment, or None
    results: Dict[str, Any] = Field(default_factory=dict)


class AIModel(AggregateRoot):
    """AI Model aggregate root"""
    name: str
    description: Optional[str] = None
    model_type: ModelType
    status: ModelStatus = ModelStatus.DEVELOPMENT
    owner_id: str
    client_id: Optional[str] = None  # If client-specific model
    versions: List[ModelVersion] = Field(default_factory=list)
    deployments: List[ModelDeployment] = Field(default_factory=list)
    ab_tests: List[ABTest] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    is_public: bool = False  # Available in marketplace
    marketplace_metadata: Dict[str, Any] = Field(default_factory=dict)
    
    @classmethod
    def create(
        cls,
        name: str,
        model_type: ModelType,
        owner_id: str,
        description: str = None,
        client_id: str = None
    ) -> 'AIModel':
        """Factory method to create a new AI model"""
        model = cls(
            name=name,
            description=description,
            model_type=model_type,
            owner_id=owner_id,
            client_id=client_id
        )
        
        return model
    
    def add_version(self, version: ModelVersion):
        """Add a new model version"""
        # Check if version already exists
        if any(v.version == version.version for v in self.versions):
            raise ValueError(f"Version {version.version} already exists")
        
        self.versions.append(version)
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def get_version(self, version: str) -> Optional[ModelVersion]:
        """Get specific model version"""
        return next((v for v in self.versions if v.version == version), None)
    
    def get_latest_version(self) -> Optional[ModelVersion]:
        """Get the latest model version"""
        if not self.versions:
            return None
        return max(self.versions, key=lambda v: v.created_at)
    
    def get_production_version(self) -> Optional[ModelVersion]:
        """Get the version currently in production"""
        prod_deployments = [d for d in self.deployments 
                           if d.status == DeploymentStatus.ACTIVE 
                           and d.configuration.environment == "production"]
        
        if not prod_deployments:
            return None
        
        # Return version of the first production deployment
        return self.get_version(prod_deployments[0].model_version)
    
    def deploy_version(
        self,
        version: str,
        deployment_name: str,
        configuration: DeploymentConfiguration,
        client_id: str = None
    ) -> ModelDeployment:
        """Deploy a model version"""
        model_version = self.get_version(version)
        if not model_version:
            raise ValueError(f"Version {version} not found")
        
        if not model_version.is_trained:
            raise ValueError(f"Version {version} is not trained")
        
        deployment = ModelDeployment(
            model_id=self.id,
            model_version=version,
            client_id=client_id,
            deployment_name=deployment_name,
            configuration=configuration
        )
        
        self.deployments.append(deployment)
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        # Add domain event
        self.add_domain_event(ModelDeployed(
            aggregate_id=self.id,
            model_name=self.name,
            model_version=version,
            client_id=client_id or "",
            deployment_environment=configuration.environment
        ))
        
        return deployment
    
    def update_deployment_status(
        self,
        deployment_id: str,
        status: DeploymentStatus,
        endpoint_url: str = None,
        health_status: str = None
    ):
        """Update deployment status"""
        deployment = next((d for d in self.deployments if d.id == deployment_id), None)
        if not deployment:
            raise ValueError(f"Deployment {deployment_id} not found")
        
        deployment.status = status
        deployment.last_updated = datetime.utcnow()
        
        if endpoint_url:
            deployment.endpoint_url = endpoint_url
        
        if health_status:
            deployment.health_status = health_status
            deployment.last_health_check = datetime.utcnow()
        
        if status == DeploymentStatus.ACTIVE and not deployment.deployed_at:
            deployment.deployed_at = datetime.utcnow()
        
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def record_prediction_request(
        self,
        deployment_id: str,
        response_time_ms: float,
        success: bool = True,
        client_id: str = None
    ):
        """Record a prediction request"""
        deployment = next((d for d in self.deployments if d.id == deployment_id), None)
        if not deployment:
            raise ValueError(f"Deployment {deployment_id} not found")
        
        deployment.request_count += 1
        if not success:
            deployment.error_count += 1
        
        # Update average response time (simple moving average)
        if deployment.request_count == 1:
            deployment.average_response_time_ms = response_time_ms
        else:
            deployment.average_response_time_ms = (
                (deployment.average_response_time_ms * (deployment.request_count - 1) + response_time_ms) 
                / deployment.request_count
            )
        
        # Add domain event
        self.add_domain_event(ModelPredictionRequested(
            aggregate_id=self.id,
            model_id=self.id,
            client_id=client_id or "",
            input_data_hash="hash_placeholder"  # Would be actual hash
        ))
    
    def start_ab_test(
        self,
        configuration: ABTestConfiguration
    ) -> ABTest:
        """Start an A/B test"""
        # Validate versions exist
        if not self.get_version(configuration.control_model_version):
            raise ValueError(f"Control version {configuration.control_model_version} not found")
        
        if not self.get_version(configuration.treatment_model_version):
            raise ValueError(f"Treatment version {configuration.treatment_model_version} not found")
        
        # Check if test name already exists
        if any(test.configuration.test_name == configuration.test_name for test in self.ab_tests):
            raise ValueError(f"A/B test {configuration.test_name} already exists")
        
        ab_test = ABTest(configuration=configuration)
        self.ab_tests.append(ab_test)
        
        self.updated_at = datetime.utcnow()
        self.version += 1
        
        return ab_test
    
    def update_ab_test_results(
        self,
        test_id: str,
        control_requests: int = None,
        treatment_requests: int = None,
        control_successes: int = None,
        treatment_successes: int = None
    ):
        """Update A/B test results"""
        ab_test = next((test for test in self.ab_tests if test.id == test_id), None)
        if not ab_test:
            raise ValueError(f"A/B test {test_id} not found")
        
        if control_requests is not None:
            ab_test.control_requests = control_requests
        if treatment_requests is not None:
            ab_test.treatment_requests = treatment_requests
        if control_successes is not None:
            ab_test.control_successes = control_successes
        if treatment_successes is not None:
            ab_test.treatment_successes = treatment_successes
        
        # Calculate statistical significance (simplified)
        if ab_test.control_requests > 0 and ab_test.treatment_requests > 0:
            control_rate = ab_test.control_successes / ab_test.control_requests
            treatment_rate = ab_test.treatment_successes / ab_test.treatment_requests
            
            # Simplified statistical test - in production would use proper statistical methods
            if abs(treatment_rate - control_rate) > 0.05:  # 5% difference
                ab_test.statistical_significance = 0.01  # Assume significant
                if treatment_rate > control_rate:
                    ab_test.winner = "treatment"
                else:
                    ab_test.winner = "control"
        
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def promote_to_production(self, version: str):
        """Promote a model version to production status"""
        model_version = self.get_version(version)
        if not model_version:
            raise ValueError(f"Version {version} not found")
        
        if not model_version.is_trained:
            raise ValueError(f"Version {version} is not trained")
        
        self.status = ModelStatus.PRODUCTION
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def add_to_marketplace(self, metadata: Dict[str, Any]):
        """Add model to marketplace"""
        if not self.get_production_version():
            raise ValueError("Model must have a production version to be added to marketplace")
        
        self.is_public = True
        self.marketplace_metadata = metadata
        self.updated_at = datetime.utcnow()
        self.version += 1
    
    def get_active_deployments(self) -> List[ModelDeployment]:
        """Get all active deployments"""
        return [d for d in self.deployments if d.status == DeploymentStatus.ACTIVE]
    
    def get_deployment_by_client(self, client_id: str) -> List[ModelDeployment]:
        """Get deployments for specific client"""
        return [d for d in self.deployments if d.client_id == client_id]
    
    def calculate_model_health_score(self) -> float:
        """Calculate overall model health score (0-1)"""
        active_deployments = self.get_active_deployments()
        
        if not active_deployments:
            return 0.0
        
        health_scores = []
        for deployment in active_deployments:
            # Base score from deployment health
            if deployment.is_healthy():
                base_score = 1.0
            else:
                base_score = 0.5
            
            # Adjust for error rate
            error_rate = deployment.calculate_error_rate()
            error_penalty = min(error_rate / 100, 0.5)  # Max 50% penalty
            
            # Adjust for response time (assuming 1000ms is baseline)
            response_penalty = min(deployment.average_response_time_ms / 2000, 0.3)  # Max 30% penalty
            
            deployment_score = max(base_score - error_penalty - response_penalty, 0.0)
            health_scores.append(deployment_score)
        
        return sum(health_scores) / len(health_scores)
