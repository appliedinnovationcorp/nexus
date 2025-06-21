"""
AI Model Management Infrastructure - Repository Implementations
"""
import json
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncpg
import motor.motor_asyncio
import aiofiles
import hashlib
from ..domain.models import (
    AIModel, ModelVersion, ModelDeployment, ModelConfiguration, DatasetInfo,
    ModelArtifact, ModelMetrics, DeploymentConfiguration, ABTest,
    ModelType, ModelStatus, DeploymentStatus, ModelFramework
)
from ..domain.repositories import AIModelRepository, ModelArtifactRepository, ModelMetricsRepository


class PostgreSQLAIModelRepository(AIModelRepository):
    """PostgreSQL implementation of AIModelRepository (Write side - CQRS)"""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.pool = None
    
    async def initialize(self):
        """Initialize connection pool"""
        self.pool = await asyncpg.create_pool(self.connection_string)
        await self._create_tables()
    
    async def _create_tables(self):
        """Create necessary tables"""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS ai_models (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    description TEXT,
                    model_type VARCHAR(50) NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'Development',
                    owner_id VARCHAR(36) NOT NULL,
                    client_id VARCHAR(36),
                    versions JSONB DEFAULT '[]',
                    deployments JSONB DEFAULT '[]',
                    ab_tests JSONB DEFAULT '[]',
                    tags TEXT[] DEFAULT '{}',
                    is_public BOOLEAN DEFAULT FALSE,
                    marketplace_metadata JSONB DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                    version INTEGER NOT NULL DEFAULT 1
                );
                
                CREATE INDEX IF NOT EXISTS idx_ai_models_owner_id ON ai_models(owner_id);
                CREATE INDEX IF NOT EXISTS idx_ai_models_client_id ON ai_models(client_id);
                CREATE INDEX IF NOT EXISTS idx_ai_models_type ON ai_models(model_type);
                CREATE INDEX IF NOT EXISTS idx_ai_models_status ON ai_models(status);
                CREATE INDEX IF NOT EXISTS idx_ai_models_public ON ai_models(is_public);
                CREATE INDEX IF NOT EXISTS idx_ai_models_tags ON ai_models USING GIN(tags);
            """)
    
    async def get_by_id(self, id: str) -> Optional[AIModel]:
        """Get AI model by ID"""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM ai_models WHERE id = $1", id
            )
            return self._row_to_model(row) if row else None
    
    async def save(self, model: AIModel) -> AIModel:
        """Save AI model"""
        async with self.pool.acquire() as conn:
            # Check if model exists
            existing = await conn.fetchrow(
                "SELECT version FROM ai_models WHERE id = $1", model.id
            )
            
            if existing:
                # Update existing model
                if existing['version'] != model.version - 1:
                    raise ValueError("Optimistic locking violation")
                
                await conn.execute("""
                    UPDATE ai_models SET
                        name = $2,
                        description = $3,
                        model_type = $4,
                        status = $5,
                        owner_id = $6,
                        client_id = $7,
                        versions = $8,
                        deployments = $9,
                        ab_tests = $10,
                        tags = $11,
                        is_public = $12,
                        marketplace_metadata = $13,
                        updated_at = $14,
                        version = $15
                    WHERE id = $1
                """, 
                    model.id,
                    model.name,
                    model.description,
                    model.model_type.value,
                    model.status.value,
                    model.owner_id,
                    model.client_id,
                    json.dumps([v.dict() for v in model.versions]),
                    json.dumps([d.dict() for d in model.deployments]),
                    json.dumps([t.dict() for t in model.ab_tests]),
                    model.tags,
                    model.is_public,
                    json.dumps(model.marketplace_metadata),
                    model.updated_at,
                    model.version
                )
            else:
                # Insert new model
                await conn.execute("""
                    INSERT INTO ai_models (
                        id, name, description, model_type, status, owner_id, client_id,
                        versions, deployments, ab_tests, tags, is_public,
                        marketplace_metadata, created_at, updated_at, version
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                """,
                    model.id,
                    model.name,
                    model.description,
                    model.model_type.value,
                    model.status.value,
                    model.owner_id,
                    model.client_id,
                    json.dumps([v.dict() for v in model.versions]),
                    json.dumps([d.dict() for d in model.deployments]),
                    json.dumps([t.dict() for t in model.ab_tests]),
                    model.tags,
                    model.is_public,
                    json.dumps(model.marketplace_metadata),
                    model.created_at,
                    model.updated_at,
                    model.version
                )
        
        return model
    
    async def delete(self, id: str) -> bool:
        """Delete model (soft delete by archiving)"""
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE ai_models SET status = 'Archived', updated_at = NOW() WHERE id = $1",
                id
            )
            return result == "UPDATE 1"
    
    async def find_all(self, limit: int = 100, offset: int = 0) -> List[AIModel]:
        """Find all models"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM ai_models ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                limit, offset
            )
            return [self._row_to_model(row) for row in rows]
    
    async def find_by_owner_id(self, owner_id: str) -> List[AIModel]:
        """Find models by owner ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM ai_models WHERE owner_id = $1 ORDER BY created_at DESC",
                owner_id
            )
            return [self._row_to_model(row) for row in rows]
    
    async def find_by_client_id(self, client_id: str) -> List[AIModel]:
        """Find models by client ID"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM ai_models WHERE client_id = $1 ORDER BY created_at DESC",
                client_id
            )
            return [self._row_to_model(row) for row in rows]
    
    async def find_by_type(self, model_type: ModelType) -> List[AIModel]:
        """Find models by type"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM ai_models WHERE model_type = $1 ORDER BY created_at DESC",
                model_type.value
            )
            return [self._row_to_model(row) for row in rows]
    
    async def find_by_status(self, status: ModelStatus) -> List[AIModel]:
        """Find models by status"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM ai_models WHERE status = $1 ORDER BY created_at DESC",
                status.value
            )
            return [self._row_to_model(row) for row in rows]
    
    async def find_public_models(self) -> List[AIModel]:
        """Find models available in marketplace"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM ai_models WHERE is_public = TRUE ORDER BY created_at DESC"
            )
            return [self._row_to_model(row) for row in rows]
    
    async def find_by_tag(self, tag: str) -> List[AIModel]:
        """Find models with specific tag"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM ai_models WHERE $1 = ANY(tags) ORDER BY created_at DESC",
                tag
            )
            return [self._row_to_model(row) for row in rows]
    
    async def find_models_with_active_deployments(self) -> List[AIModel]:
        """Find models with active deployments"""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM ai_models 
                WHERE deployments::text LIKE '%"status": "Active"%'
                ORDER BY created_at DESC
            """)
            return [self._row_to_model(row) for row in rows]
    
    async def find_models_needing_retraining(self, days_threshold: int = 90) -> List[AIModel]:
        """Find models that may need retraining"""
        cutoff_date = datetime.utcnow() - timedelta(days=days_threshold)
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM ai_models WHERE updated_at < $1 AND status = 'Production'",
                cutoff_date
            )
            return [self._row_to_model(row) for row in rows]
    
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
        conditions = []
        params = []
        param_count = 0
        
        if query:
            param_count += 1
            conditions.append(f"(name ILIKE ${param_count} OR description ILIKE ${param_count})")
            params.append(f"%{query}%")
        
        if model_type:
            param_count += 1
            conditions.append(f"model_type = ${param_count}")
            params.append(model_type.value)
        
        if status:
            param_count += 1
            conditions.append(f"status = ${param_count}")
            params.append(status.value)
        
        if owner_id:
            param_count += 1
            conditions.append(f"owner_id = ${param_count}")
            params.append(owner_id)
        
        if client_id:
            param_count += 1
            conditions.append(f"client_id = ${param_count}")
            params.append(client_id)
        
        if is_public is not None:
            param_count += 1
            conditions.append(f"is_public = ${param_count}")
            params.append(is_public)
        
        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        
        param_count += 1
        params.append(limit)
        param_count += 1
        params.append(offset)
        
        sql = f"""
            SELECT * FROM ai_models 
            WHERE {where_clause}
            ORDER BY created_at DESC 
            LIMIT ${param_count-1} OFFSET ${param_count}
        """
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(sql, *params)
            return [self._row_to_model(row) for row in rows]
    
    async def get_model_statistics(self) -> dict:
        """Get model statistics"""
        async with self.pool.acquire() as conn:
            stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_models,
                    COUNT(CASE WHEN status = 'Production' THEN 1 END) as production_models,
                    COUNT(CASE WHEN status = 'Development' THEN 1 END) as development_models,
                    COUNT(CASE WHEN is_public = TRUE THEN 1 END) as public_models,
                    COUNT(CASE WHEN deployments::text LIKE '%"status": "Active"%' THEN 1 END) as models_with_deployments
                FROM ai_models
            """)
            
            type_stats = await conn.fetch("""
                SELECT model_type, COUNT(*) as count 
                FROM ai_models 
                GROUP BY model_type
            """)
            
            return {
                'total_models': stats['total_models'],
                'production_models': stats['production_models'],
                'development_models': stats['development_models'],
                'public_models': stats['public_models'],
                'models_with_deployments': stats['models_with_deployments'],
                'models_by_type': {row['model_type']: row['count'] for row in type_stats}
            }
    
    def _row_to_model(self, row) -> AIModel:
        """Convert database row to AIModel domain model"""
        if not row:
            return None
        
        # Parse versions
        versions_data = json.loads(row['versions']) if row['versions'] else []
        versions = []
        for version_data in versions_data:
            # Parse configuration
            config_data = version_data['configuration']
            configuration = ModelConfiguration(
                framework=ModelFramework(config_data['framework']),
                framework_version=config_data['framework_version'],
                hyperparameters=config_data.get('hyperparameters', {}),
                preprocessing_steps=config_data.get('preprocessing_steps', []),
                feature_columns=config_data.get('feature_columns', []),
                target_column=config_data.get('target_column'),
                model_architecture=config_data.get('model_architecture'),
                training_config=config_data.get('training_config', {})
            )
            
            # Parse datasets
            training_dataset = DatasetInfo(**version_data['training_dataset'])
            validation_dataset = DatasetInfo(**version_data['validation_dataset']) if version_data.get('validation_dataset') else None
            test_dataset = DatasetInfo(**version_data['test_dataset']) if version_data.get('test_dataset') else None
            
            # Parse metrics
            metrics = None
            if version_data.get('metrics'):
                metrics = ModelMetrics(**version_data['metrics'])
            
            # Parse artifacts
            artifacts = []
            for artifact_data in version_data.get('artifacts', []):
                artifacts.append(ModelArtifact(**artifact_data))
            
            version = ModelVersion(
                version=version_data['version'],
                parent_version=version_data.get('parent_version'),
                configuration=configuration,
                training_dataset=training_dataset,
                validation_dataset=validation_dataset,
                test_dataset=test_dataset,
                metrics=metrics,
                artifacts=artifacts,
                training_start_time=datetime.fromisoformat(version_data['training_start_time']) if version_data.get('training_start_time') else None,
                training_end_time=datetime.fromisoformat(version_data['training_end_time']) if version_data.get('training_end_time') else None,
                training_duration_seconds=version_data.get('training_duration_seconds'),
                training_logs=version_data.get('training_logs'),
                notes=version_data.get('notes'),
                created_by=version_data['created_by'],
                created_at=datetime.fromisoformat(version_data['created_at'])
            )
            versions.append(version)
        
        # Parse deployments
        deployments_data = json.loads(row['deployments']) if row['deployments'] else []
        deployments = []
        for deployment_data in deployments_data:
            config_data = deployment_data['configuration']
            configuration = DeploymentConfiguration(
                environment=config_data['environment'],
                instance_type=config_data['instance_type'],
                min_instances=config_data.get('min_instances', 1),
                max_instances=config_data.get('max_instances', 10),
                cpu_request=config_data.get('cpu_request', '100m'),
                memory_request=config_data.get('memory_request', '256Mi'),
                cpu_limit=config_data.get('cpu_limit', '500m'),
                memory_limit=config_data.get('memory_limit', '512Mi'),
                auto_scaling_enabled=config_data.get('auto_scaling_enabled', True),
                health_check_path=config_data.get('health_check_path', '/health'),
                environment_variables=config_data.get('environment_variables', {}),
                secrets=config_data.get('secrets', []),
                custom_config=config_data.get('custom_config', {})
            )
            
            deployment = ModelDeployment(
                id=deployment_data['id'],
                model_id=deployment_data['model_id'],
                model_version=deployment_data['model_version'],
                client_id=deployment_data.get('client_id'),
                deployment_name=deployment_data['deployment_name'],
                status=DeploymentStatus(deployment_data['status']),
                configuration=configuration,
                endpoint_url=deployment_data.get('endpoint_url'),
                api_key=deployment_data.get('api_key'),
                deployment_logs=deployment_data.get('deployment_logs'),
                last_health_check=datetime.fromisoformat(deployment_data['last_health_check']) if deployment_data.get('last_health_check') else None,
                health_status=deployment_data.get('health_status', 'unknown'),
                request_count=deployment_data.get('request_count', 0),
                error_count=deployment_data.get('error_count', 0),
                average_response_time_ms=deployment_data.get('average_response_time_ms', 0.0),
                deployed_at=datetime.fromisoformat(deployment_data['deployed_at']) if deployment_data.get('deployed_at') else None,
                last_updated=datetime.fromisoformat(deployment_data['last_updated'])
            )
            deployments.append(deployment)
        
        # Parse A/B tests
        ab_tests_data = json.loads(row['ab_tests']) if row['ab_tests'] else []
        ab_tests = []
        for test_data in ab_tests_data:
            # This would be more complex in a real implementation
            ab_tests.append(ABTest(**test_data))
        
        # Create model
        model = AIModel(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            model_type=ModelType(row['model_type']),
            status=ModelStatus(row['status']),
            owner_id=row['owner_id'],
            client_id=row['client_id'],
            versions=versions,
            deployments=deployments,
            ab_tests=ab_tests,
            tags=list(row['tags']) if row['tags'] else [],
            is_public=row['is_public'],
            marketplace_metadata=json.loads(row['marketplace_metadata']) if row['marketplace_metadata'] else {},
            created_at=row['created_at'],
            updated_at=row['updated_at'],
            version=row['version']
        )
        
        return model


class FileSystemModelArtifactRepository(ModelArtifactRepository):
    """File system implementation for model artifacts"""
    
    def __init__(self, base_path: str = "/app/model_artifacts"):
        self.base_path = base_path
        os.makedirs(base_path, exist_ok=True)
    
    async def store_artifact(
        self,
        model_id: str,
        version: str,
        artifact_type: str,
        file_path: str,
        content: bytes
    ) -> str:
        """Store model artifact and return storage path"""
        # Create directory structure
        model_dir = os.path.join(self.base_path, model_id, version)
        os.makedirs(model_dir, exist_ok=True)
        
        # Generate file name
        file_name = f"{artifact_type}_{file_path.split('/')[-1]}"
        full_path = os.path.join(model_dir, file_name)
        
        # Store file
        async with aiofiles.open(full_path, 'wb') as f:
            await f.write(content)
        
        return full_path
    
    async def retrieve_artifact(
        self,
        model_id: str,
        version: str,
        artifact_type: str
    ) -> Optional[bytes]:
        """Retrieve model artifact content"""
        model_dir = os.path.join(self.base_path, model_id, version)
        
        # Find artifact file
        if not os.path.exists(model_dir):
            return None
        
        for file_name in os.listdir(model_dir):
            if file_name.startswith(f"{artifact_type}_"):
                file_path = os.path.join(model_dir, file_name)
                async with aiofiles.open(file_path, 'rb') as f:
                    return await f.read()
        
        return None
    
    async def delete_artifact(
        self,
        model_id: str,
        version: str,
        artifact_type: str
    ) -> bool:
        """Delete model artifact"""
        model_dir = os.path.join(self.base_path, model_id, version)
        
        if not os.path.exists(model_dir):
            return False
        
        for file_name in os.listdir(model_dir):
            if file_name.startswith(f"{artifact_type}_"):
                file_path = os.path.join(model_dir, file_name)
                os.remove(file_path)
                return True
        
        return False
    
    async def list_artifacts(
        self,
        model_id: str,
        version: str = None
    ) -> List[dict]:
        """List artifacts for model/version"""
        artifacts = []
        
        if version:
            model_dir = os.path.join(self.base_path, model_id, version)
            if os.path.exists(model_dir):
                for file_name in os.listdir(model_dir):
                    file_path = os.path.join(model_dir, file_name)
                    stat = os.stat(file_path)
                    artifacts.append({
                        'model_id': model_id,
                        'version': version,
                        'artifact_type': file_name.split('_')[0],
                        'file_name': file_name,
                        'file_size': stat.st_size,
                        'created_at': datetime.fromtimestamp(stat.st_ctime)
                    })
        else:
            model_base_dir = os.path.join(self.base_path, model_id)
            if os.path.exists(model_base_dir):
                for version_dir in os.listdir(model_base_dir):
                    version_path = os.path.join(model_base_dir, version_dir)
                    if os.path.isdir(version_path):
                        version_artifacts = await self.list_artifacts(model_id, version_dir)
                        artifacts.extend(version_artifacts)
        
        return artifacts


class TimescaleDBModelMetricsRepository(ModelMetricsRepository):
    """TimescaleDB implementation for model metrics"""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.pool = None
    
    async def initialize(self):
        """Initialize connection pool"""
        self.pool = await asyncpg.create_pool(self.connection_string)
        await self._create_tables()
    
    async def _create_tables(self):
        """Create necessary tables"""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS model_training_metrics (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    model_id VARCHAR(36) NOT NULL,
                    version VARCHAR(50) NOT NULL,
                    metrics JSONB NOT NULL
                );
                
                CREATE TABLE IF NOT EXISTS model_prediction_metrics (
                    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    model_id VARCHAR(36) NOT NULL,
                    deployment_id VARCHAR(36) NOT NULL,
                    metrics JSONB NOT NULL
                );
                
                -- Create hypertables if TimescaleDB extension is available
                SELECT create_hypertable('model_training_metrics', 'time', if_not_exists => TRUE);
                SELECT create_hypertable('model_prediction_metrics', 'time', if_not_exists => TRUE);
                
                CREATE INDEX IF NOT EXISTS idx_training_metrics_model ON model_training_metrics(model_id, version, time DESC);
                CREATE INDEX IF NOT EXISTS idx_prediction_metrics_deployment ON model_prediction_metrics(deployment_id, time DESC);
            """)
    
    async def store_training_metrics(
        self,
        model_id: str,
        version: str,
        metrics: dict,
        timestamp: datetime = None
    ):
        """Store training metrics"""
        timestamp = timestamp or datetime.utcnow()
        async with self.pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO model_training_metrics (time, model_id, version, metrics) VALUES ($1, $2, $3, $4)",
                timestamp, model_id, version, json.dumps(metrics)
            )
    
    async def store_prediction_metrics(
        self,
        model_id: str,
        deployment_id: str,
        metrics: dict,
        timestamp: datetime = None
    ):
        """Store prediction/inference metrics"""
        timestamp = timestamp or datetime.utcnow()
        async with self.pool.acquire() as conn:
            await conn.execute(
                "INSERT INTO model_prediction_metrics (time, model_id, deployment_id, metrics) VALUES ($1, $2, $3, $4)",
                timestamp, model_id, deployment_id, json.dumps(metrics)
            )
    
    async def get_training_metrics_history(
        self,
        model_id: str,
        version: str = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> List[dict]:
        """Get training metrics history"""
        conditions = ["model_id = $1"]
        params = [model_id]
        param_count = 1
        
        if version:
            param_count += 1
            conditions.append(f"version = ${param_count}")
            params.append(version)
        
        if start_date:
            param_count += 1
            conditions.append(f"time >= ${param_count}")
            params.append(start_date)
        
        if end_date:
            param_count += 1
            conditions.append(f"time <= ${param_count}")
            params.append(end_date)
        
        where_clause = " AND ".join(conditions)
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                f"SELECT * FROM model_training_metrics WHERE {where_clause} ORDER BY time DESC",
                *params
            )
            
            return [
                {
                    'time': row['time'],
                    'model_id': row['model_id'],
                    'version': row['version'],
                    'metrics': json.loads(row['metrics'])
                }
                for row in rows
            ]
    
    async def get_prediction_metrics_history(
        self,
        model_id: str,
        deployment_id: str = None,
        start_date: datetime = None,
        end_date: datetime = None
    ) -> List[dict]:
        """Get prediction metrics history"""
        conditions = ["model_id = $1"]
        params = [model_id]
        param_count = 1
        
        if deployment_id:
            param_count += 1
            conditions.append(f"deployment_id = ${param_count}")
            params.append(deployment_id)
        
        if start_date:
            param_count += 1
            conditions.append(f"time >= ${param_count}")
            params.append(start_date)
        
        if end_date:
            param_count += 1
            conditions.append(f"time <= ${param_count}")
            params.append(end_date)
        
        where_clause = " AND ".join(conditions)
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                f"SELECT * FROM model_prediction_metrics WHERE {where_clause} ORDER BY time DESC",
                *params
            )
            
            return [
                {
                    'time': row['time'],
                    'model_id': row['model_id'],
                    'deployment_id': row['deployment_id'],
                    'metrics': json.loads(row['metrics'])
                }
                for row in rows
            ]
    
    async def get_model_performance_summary(
        self,
        model_id: str,
        time_period_days: int = 30
    ) -> dict:
        """Get model performance summary"""
        start_date = datetime.utcnow() - timedelta(days=time_period_days)
        
        async with self.pool.acquire() as conn:
            # Get prediction metrics summary
            prediction_stats = await conn.fetchrow("""
                SELECT 
                    COUNT(*) as total_requests,
                    AVG((metrics->>'response_time_ms')::FLOAT) as avg_response_time,
                    AVG((metrics->>'error_rate')::FLOAT) as avg_error_rate,
                    SUM((metrics->>'request_count')::INT) as total_request_count
                FROM model_prediction_metrics 
                WHERE model_id = $1 AND time >= $2
            """, model_id, start_date)
            
            return {
                'model_id': model_id,
                'time_period_days': time_period_days,
                'total_metric_records': prediction_stats['total_requests'] or 0,
                'avg_response_time_ms': float(prediction_stats['avg_response_time']) if prediction_stats['avg_response_time'] else 0,
                'error_rate_percentage': float(prediction_stats['avg_error_rate']) if prediction_stats['avg_error_rate'] else 0,
                'total_requests': prediction_stats['total_request_count'] or 0,
                'uptime_percentage': 99.0  # Simplified - would calculate from health checks
            }
