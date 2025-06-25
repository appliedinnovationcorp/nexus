"""
AI Model Management Repository Interfaces
"""
from abc import abstractmethod
from typing import List, Optional
from datetime import datetime
from shared.domain import Repository
from .models import AIModel, ModelType, ModelStatus, DeploymentStatus


class AIModelRepository(Repository[AIModel]):
    """AI Model repository interface"""
    
    @abstractmethod
    async def find_by_owner_id(self, owner_id: str) -> List[AIModel]:
        """Find models by owner ID"""
        pass
    
    @abstractmethod
    async def find_by_client_id(self, client_id: str) -> List[AIModel]:
        """Find models by client ID"""
        pass
    
    @abstractmethod
    async def find_by_type(self, model_type: ModelType) -> List[AIModel]:
        """Find models by type"""
        pass
    
    @abstractmethod
    async def find_by_status(self, status: ModelStatus) -> List[AIModel]:
        """Find models by status"""
        pass
    
    @abstractmethod
    async def find_public_models(self) -> List[AIModel]:
        """Find models available in marketplace"""
        pass
    
    @abstractmethod
    async def find_by_tag(self, tag: str) -> List[AIModel]:
        """Find models with specific tag"""
        pass
    
    @abstractmethod
    async def find_models_with_active_deployments(self) -> List[AIModel]:
        """Find models with active deployments"""
        pass
    
    @abstractmethod
    async def find_models_needing_retraining(self, days_threshold: int = 90) -> List[AIModel]:
        """Find models that may need retraining"""
        pass
    
    @abstractmethod
    async def search_models(
        self,
        query: str,
        model_type: Optional[ModelType] = None,
        status: Optional[ModelStatus] = None,
        owner_id: Optional[str] = None,
        client_id: Optional[str] = None,
        is_public: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AIModel]:
        """Search models with filters"""
        pass
    
    @abstractmethod
    async def get_model_statistics(self) -> dict:
        """Get model statistics"""
        pass


class ModelArtifactRepository:
    """Repository for managing model artifacts"""
    
    @abstractmethod
    async def store_artifact(
        self,
        model_id: str,
        version: str,
        artifact_type: str,
        file_path: str,
        content: bytes
    ) -> str:
        """Store model artifact and return storage path"""
        pass
    
    @abstractmethod
    async def retrieve_artifact(
        self,
        model_id: str,
        version: str,
        artifact_type: str
    ) -> Optional[bytes]:
        """Retrieve model artifact content"""
        pass
    
    @abstractmethod
    async def delete_artifact(
        self,
        model_id: str,
        version: str,
        artifact_type: str
    ) -> bool:
        """Delete model artifact"""
        pass
    
    @abstractmethod
    async def list_artifacts(
        self,
        model_id: str,
        version: str = None
    ) -> List[dict]:
        """List artifacts for model/version"""
        pass


class ModelMetricsRepository:
    """Repository for model performance metrics and monitoring data"""
    
    @abstractmethod
    async def store_training_metrics(
        self,
        model_id: str,
        version: str,
        metrics: dict,
        timestamp: datetime = None
    ):
        """Store training metrics"""
        pass
    
    @abstractmethod
    async def store_prediction_metrics(
        self,
        model_id: str,
        deployment_id: str,
        metrics: dict,
        timestamp: datetime = None
    ):
        """Store prediction/inference metrics"""
        pass
    
    @abstractmethod
    async def get_training_metrics_history(
        self,
        model_id: str,
        version: str = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> List[dict]:
        """Get training metrics history"""
        pass
    
    @abstractmethod
    async def get_prediction_metrics_history(
        self,
        model_id: str,
        deployment_id: str = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> List[dict]:
        """Get prediction metrics history"""
        pass
    
    @abstractmethod
    async def get_model_performance_summary(
        self,
        model_id: str,
        time_period_days: int = 30
    ) -> dict:
        """Get model performance summary"""
        pass
