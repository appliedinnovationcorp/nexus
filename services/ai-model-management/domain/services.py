"""
AI Model Management Domain Services
"""
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import hashlib
import json
from shared.domain import DomainService, Specification
from .models import (
    AIModel, ModelVersion, ModelDeployment, ModelMetrics, ModelType,
    DeploymentStatus, ModelStatus, ABTest, DeploymentConfiguration
)
from .repositories import AIModelRepository, ModelArtifactRepository, ModelMetricsRepository


class ModelVersioningService(DomainService):
    """Service for managing model versions and lineage"""
    
    def generate_version_number(self, model: AIModel, version_type: str = "minor") -> str:
        """Generate next version number"""
        if not model.versions:
            return "1.0.0"
        
        latest_version = model.get_latest_version()
        if not latest_version:
            return "1.0.0"
        
        # Parse semantic version (major.minor.patch)
        try:
            parts = latest_version.version.split('.')
            major, minor, patch = int(parts[0]), int(parts[1]), int(parts[2])
        except (ValueError, IndexError):
            return "1.0.0"
        
        if version_type == "major":
            return f"{major + 1}.0.0"
        elif version_type == "minor":
            return f"{major}.{minor + 1}.0"
        else:  # patch
            return f"{major}.{minor}.{patch + 1}"
    
    def calculate_model_diff(
        self,
        version1: ModelVersion,
        version2: ModelVersion
    ) -> Dict[str, Any]:
        """Calculate differences between model versions"""
        diff = {
            'configuration_changes': {},
            'metric_changes': {},
            'dataset_changes': {},
            'performance_delta': None
        }
        
        # Configuration changes
        config1 = version1.configuration.dict()
        config2 = version2.configuration.dict()
        
        for key in set(config1.keys()) | set(config2.keys()):
            val1 = config1.get(key)
            val2 = config2.get(key)
            if val1 != val2:
                diff['configuration_changes'][key] = {
                    'old': val1,
                    'new': val2
                }
        
        # Metric changes
        if version1.metrics and version2.metrics:
            metrics1 = version1.metrics.dict()
            metrics2 = version2.metrics.dict()
            
            for metric in set(metrics1.keys()) | set(metrics2.keys()):
                val1 = metrics1.get(metric)
                val2 = metrics2.get(metric)
                if val1 != val2 and val1 is not None and val2 is not None:
                    diff['metric_changes'][metric] = {
                        'old': val1,
                        'new': val2,
                        'change': val2 - val1 if isinstance(val1, (int, float)) else None
                    }
            
            # Calculate overall performance delta
            primary_metric1 = version1.metrics.get_primary_metric(version1.configuration.framework)
            primary_metric2 = version2.metrics.get_primary_metric(version2.configuration.framework)
            
            if primary_metric1 and primary_metric2:
                diff['performance_delta'] = primary_metric2 - primary_metric1
        
        # Dataset changes
        if version1.training_dataset.name != version2.training_dataset.name:
            diff['dataset_changes']['training_dataset'] = {
                'old': version1.training_dataset.name,
                'new': version2.training_dataset.name
            }
        
        return diff
    
    def recommend_version_type(
        self,
        current_version: ModelVersion,
        new_metrics: ModelMetrics,
        config_changes: Dict[str, Any]
    ) -> str:
        """Recommend version type based on changes"""
        
        # Major version for significant architecture changes
        if 'model_architecture' in config_changes:
            return "major"
        
        # Major version for framework changes
        if 'framework' in config_changes:
            return "major"
        
        # Minor version for significant performance improvements
        if current_version.metrics and new_metrics:
            current_primary = current_version.metrics.get_primary_metric(current_version.configuration.framework)
            new_primary = new_metrics.get_primary_metric(current_version.configuration.framework)
            
            if current_primary and new_primary:
                improvement = new_primary - current_primary
                if improvement > 0.05:  # 5% improvement
                    return "minor"
        
        # Minor version for hyperparameter changes
        if 'hyperparameters' in config_changes:
            return "minor"
        
        # Patch version for small changes
        return "patch"


class ModelDeploymentService(DomainService):
    """Service for managing model deployments"""
    
    def __init__(self, artifact_repository: ModelArtifactRepository):
        self.artifact_repository = artifact_repository
    
    def validate_deployment_config(
        self,
        config: DeploymentConfiguration,
        model_version: ModelVersion
    ) -> List[str]:
        """Validate deployment configuration"""
        issues = []
        
        # Check resource requirements
        if config.min_instances > config.max_instances:
            issues.append("min_instances cannot be greater than max_instances")
        
        # Check if model artifacts exist
        if not model_version.has_artifacts:
            issues.append("Model version has no artifacts to deploy")
        
        # Validate environment-specific requirements
        if config.environment == "production":
            if config.min_instances < 2:
                issues.append("Production deployments should have at least 2 instances")
            
            if not config.auto_scaling_enabled:
                issues.append("Auto-scaling should be enabled for production")
        
        # Check memory requirements based on model size
        model_artifacts = model_version.artifacts
        total_size_mb = sum(artifact.file_size_bytes for artifact in model_artifacts) / (1024 * 1024)
        
        memory_request_mb = self._parse_memory_string(config.memory_request)
        if memory_request_mb < total_size_mb * 2:  # At least 2x model size
            issues.append(f"Memory request ({config.memory_request}) may be insufficient for model size ({total_size_mb:.1f}MB)")
        
        return issues
    
    def _parse_memory_string(self, memory_str: str) -> float:
        """Parse memory string (e.g., '512Mi') to MB"""
        if memory_str.endswith('Mi'):
            return float(memory_str[:-2])
        elif memory_str.endswith('Gi'):
            return float(memory_str[:-2]) * 1024
        elif memory_str.endswith('M'):
            return float(memory_str[:-1])
        elif memory_str.endswith('G'):
            return float(memory_str[:-1]) * 1024
        else:
            return float(memory_str)
    
    def generate_deployment_manifest(
        self,
        model: AIModel,
        deployment: ModelDeployment
    ) -> Dict[str, Any]:
        """Generate Kubernetes deployment manifest"""
        
        model_version = model.get_version(deployment.model_version)
        config = deployment.configuration
        
        manifest = {
            'apiVersion': 'apps/v1',
            'kind': 'Deployment',
            'metadata': {
                'name': f"model-{model.id}-{deployment.id}",
                'labels': {
                    'app': 'ai-model',
                    'model-id': model.id,
                    'model-version': deployment.model_version,
                    'deployment-id': deployment.id,
                    'environment': config.environment
                }
            },
            'spec': {
                'replicas': config.min_instances,
                'selector': {
                    'matchLabels': {
                        'app': 'ai-model',
                        'deployment-id': deployment.id
                    }
                },
                'template': {
                    'metadata': {
                        'labels': {
                            'app': 'ai-model',
                            'deployment-id': deployment.id
                        }
                    },
                    'spec': {
                        'containers': [{
                            'name': 'model-server',
                            'image': f"ai-model-server:{model_version.configuration.framework.value.lower()}",
                            'ports': [{'containerPort': 8080}],
                            'env': [
                                {'name': 'MODEL_ID', 'value': model.id},
                                {'name': 'MODEL_VERSION', 'value': deployment.model_version},
                                {'name': 'DEPLOYMENT_ID', 'value': deployment.id}
                            ] + [
                                {'name': k, 'value': v} 
                                for k, v in config.environment_variables.items()
                            ],
                            'resources': {
                                'requests': {
                                    'cpu': config.cpu_request,
                                    'memory': config.memory_request
                                },
                                'limits': {
                                    'cpu': config.cpu_limit,
                                    'memory': config.memory_limit
                                }
                            },
                            'livenessProbe': {
                                'httpGet': {
                                    'path': config.health_check_path,
                                    'port': 8080
                                },
                                'initialDelaySeconds': 30,
                                'periodSeconds': 10
                            },
                            'readinessProbe': {
                                'httpGet': {
                                    'path': config.health_check_path,
                                    'port': 8080
                                },
                                'initialDelaySeconds': 5,
                                'periodSeconds': 5
                            }
                        }]
                    }
                }
            }
        }
        
        return manifest
    
    def calculate_deployment_cost(
        self,
        config: DeploymentConfiguration,
        hours_per_month: int = 730
    ) -> Dict[str, float]:
        """Calculate estimated deployment cost"""
        
        # Simplified cost calculation (would integrate with cloud provider APIs)
        cpu_cost_per_core_hour = 0.05  # $0.05 per vCPU hour
        memory_cost_per_gb_hour = 0.01  # $0.01 per GB hour
        
        cpu_cores = self._parse_cpu_string(config.cpu_request)
        memory_gb = self._parse_memory_string(config.memory_request) / 1024
        
        monthly_cpu_cost = cpu_cores * cpu_cost_per_core_hour * hours_per_month * config.min_instances
        monthly_memory_cost = memory_gb * memory_cost_per_gb_hour * hours_per_month * config.min_instances
        
        return {
            'cpu_cost': monthly_cpu_cost,
            'memory_cost': monthly_memory_cost,
            'total_cost': monthly_cpu_cost + monthly_memory_cost,
            'cost_per_instance': (monthly_cpu_cost + monthly_memory_cost) / config.min_instances
        }
    
    def _parse_cpu_string(self, cpu_str: str) -> float:
        """Parse CPU string (e.g., '500m') to cores"""
        if cpu_str.endswith('m'):
            return float(cpu_str[:-1]) / 1000
        else:
            return float(cpu_str)


class ModelMonitoringService(DomainService):
    """Service for monitoring model performance and health"""
    
    def __init__(self, metrics_repository: ModelMetricsRepository):
        self.metrics_repository = metrics_repository
    
    async def detect_model_drift(
        self,
        model_id: str,
        deployment_id: str,
        time_window_days: int = 7
    ) -> Dict[str, Any]:
        """Detect model drift based on prediction patterns"""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=time_window_days)
        
        # Get recent prediction metrics
        recent_metrics = await self.metrics_repository.get_prediction_metrics_history(
            model_id=model_id,
            deployment_id=deployment_id,
            start_date=start_date,
            end_date=end_date
        )
        
        if len(recent_metrics) < 10:  # Need minimum data points
            return {
                'drift_detected': False,
                'reason': 'Insufficient data for drift detection',
                'confidence': 0.0
            }
        
        # Calculate drift indicators
        drift_indicators = self._calculate_drift_indicators(recent_metrics)
        
        # Determine if drift is detected
        drift_score = sum(drift_indicators.values()) / len(drift_indicators)
        drift_detected = drift_score > 0.7  # Threshold for drift detection
        
        return {
            'drift_detected': drift_detected,
            'drift_score': drift_score,
            'indicators': drift_indicators,
            'confidence': min(drift_score, 1.0),
            'recommendation': self._get_drift_recommendation(drift_score)
        }
    
    def _calculate_drift_indicators(self, metrics: List[Dict]) -> Dict[str, float]:
        """Calculate various drift indicators"""
        indicators = {}
        
        # Response time drift
        response_times = [m.get('response_time_ms', 0) for m in metrics]
        if response_times:
            recent_avg = sum(response_times[-5:]) / min(5, len(response_times))
            overall_avg = sum(response_times) / len(response_times)
            indicators['response_time_drift'] = abs(recent_avg - overall_avg) / overall_avg if overall_avg > 0 else 0
        
        # Error rate drift
        error_rates = [m.get('error_rate', 0) for m in metrics]
        if error_rates:
            recent_avg = sum(error_rates[-5:]) / min(5, len(error_rates))
            overall_avg = sum(error_rates) / len(error_rates)
            indicators['error_rate_drift'] = abs(recent_avg - overall_avg) / (overall_avg + 0.01)  # Add small constant to avoid division by zero
        
        # Prediction confidence drift (if available)
        confidences = [m.get('avg_confidence', 0) for m in metrics if m.get('avg_confidence')]
        if confidences:
            recent_avg = sum(confidences[-5:]) / min(5, len(confidences))
            overall_avg = sum(confidences) / len(confidences)
            indicators['confidence_drift'] = abs(recent_avg - overall_avg) if overall_avg > 0 else 0
        
        return indicators
    
    def _get_drift_recommendation(self, drift_score: float) -> str:
        """Get recommendation based on drift score"""
        if drift_score > 0.8:
            return "Immediate retraining recommended - significant drift detected"
        elif drift_score > 0.6:
            return "Monitor closely - moderate drift detected"
        elif drift_score > 0.4:
            return "Schedule retraining evaluation - minor drift detected"
        else:
            return "Model performing normally"
    
    async def generate_model_health_report(
        self,
        model_id: str,
        time_period_days: int = 30
    ) -> Dict[str, Any]:
        """Generate comprehensive model health report"""
        
        performance_summary = await self.metrics_repository.get_model_performance_summary(
            model_id=model_id,
            time_period_days=time_period_days
        )
        
        # Get drift analysis for all deployments
        # This would iterate through all deployments in a real implementation
        
        health_score = self._calculate_overall_health_score(performance_summary)
        
        return {
            'model_id': model_id,
            'report_period_days': time_period_days,
            'generated_at': datetime.utcnow(),
            'overall_health_score': health_score,
            'performance_summary': performance_summary,
            'recommendations': self._generate_health_recommendations(health_score, performance_summary)
        }
    
    def _calculate_overall_health_score(self, performance_summary: Dict) -> float:
        """Calculate overall model health score (0-1)"""
        scores = []
        
        # Availability score
        uptime = performance_summary.get('uptime_percentage', 100)
        scores.append(uptime / 100)
        
        # Performance score (based on response time)
        avg_response_time = performance_summary.get('avg_response_time_ms', 0)
        if avg_response_time > 0:
            # Score decreases as response time increases (1000ms = 0.5 score)
            response_score = max(0, 1 - (avg_response_time / 2000))
            scores.append(response_score)
        
        # Error rate score
        error_rate = performance_summary.get('error_rate_percentage', 0)
        error_score = max(0, 1 - (error_rate / 10))  # 10% error rate = 0 score
        scores.append(error_score)
        
        return sum(scores) / len(scores) if scores else 0.0
    
    def _generate_health_recommendations(
        self,
        health_score: float,
        performance_summary: Dict
    ) -> List[str]:
        """Generate health recommendations"""
        recommendations = []
        
        if health_score < 0.7:
            recommendations.append("Model health is below acceptable threshold - investigate immediately")
        
        error_rate = performance_summary.get('error_rate_percentage', 0)
        if error_rate > 5:
            recommendations.append(f"High error rate ({error_rate:.1f}%) - check model inputs and preprocessing")
        
        avg_response_time = performance_summary.get('avg_response_time_ms', 0)
        if avg_response_time > 1000:
            recommendations.append(f"High response time ({avg_response_time:.0f}ms) - consider scaling or optimization")
        
        uptime = performance_summary.get('uptime_percentage', 100)
        if uptime < 99:
            recommendations.append(f"Low uptime ({uptime:.1f}%) - check deployment stability")
        
        return recommendations


class ABTestingService(DomainService):
    """Service for managing A/B tests"""
    
    def calculate_statistical_significance(
        self,
        control_successes: int,
        control_total: int,
        treatment_successes: int,
        treatment_total: int
    ) -> Tuple[float, str]:
        """Calculate statistical significance using z-test"""
        
        if control_total == 0 or treatment_total == 0:
            return 0.0, "insufficient_data"
        
        # Calculate conversion rates
        control_rate = control_successes / control_total
        treatment_rate = treatment_successes / treatment_total
        
        # Calculate pooled probability
        pooled_prob = (control_successes + treatment_successes) / (control_total + treatment_total)
        
        # Calculate standard error
        se = (pooled_prob * (1 - pooled_prob) * (1/control_total + 1/treatment_total)) ** 0.5
        
        if se == 0:
            return 0.0, "no_variance"
        
        # Calculate z-score
        z_score = abs(treatment_rate - control_rate) / se
        
        # Convert to p-value (simplified)
        if z_score > 2.58:  # 99% confidence
            p_value = 0.01
        elif z_score > 1.96:  # 95% confidence
            p_value = 0.05
        elif z_score > 1.65:  # 90% confidence
            p_value = 0.10
        else:
            p_value = 0.20
        
        # Determine significance
        if p_value <= 0.05:
            significance = "significant"
        elif p_value <= 0.10:
            significance = "marginally_significant"
        else:
            significance = "not_significant"
        
        return p_value, significance
    
    def should_stop_test(
        self,
        ab_test: ABTest,
        current_date: datetime = None
    ) -> Tuple[bool, str]:
        """Determine if A/B test should be stopped"""
        
        current_date = current_date or datetime.utcnow()
        
        # Check if test has run for maximum duration
        test_duration = (current_date - ab_test.start_date).days
        if test_duration >= ab_test.configuration.max_duration_days:
            return True, "max_duration_reached"
        
        # Check if minimum sample size is reached
        total_requests = ab_test.control_requests + ab_test.treatment_requests
        if total_requests < ab_test.configuration.minimum_sample_size:
            return False, "insufficient_sample_size"
        
        # Check statistical significance
        p_value, significance = self.calculate_statistical_significance(
            ab_test.control_successes,
            ab_test.control_requests,
            ab_test.treatment_successes,
            ab_test.treatment_requests
        )
        
        if significance == "significant":
            return True, "statistical_significance_reached"
        
        # Continue test if no stopping criteria met
        return False, "continue_testing"


# Specifications for AI model business rules
class ProductionReadyModelSpecification(Specification):
    """Specification for models ready for production"""
    
    def is_satisfied_by(self, model: AIModel) -> bool:
        latest_version = model.get_latest_version()
        if not latest_version:
            return False
        
        return (latest_version.is_trained and
                latest_version.has_artifacts and
                latest_version.metrics is not None and
                model.status in [ModelStatus.TESTING, ModelStatus.STAGING])


class HighPerformingModelSpecification(Specification):
    """Specification for high-performing models"""
    
    def __init__(self, threshold: float = 0.8):
        self.threshold = threshold
    
    def is_satisfied_by(self, model: AIModel) -> bool:
        latest_version = model.get_latest_version()
        if not latest_version or not latest_version.metrics:
            return False
        
        primary_metric = latest_version.metrics.get_primary_metric(model.model_type)
        return primary_metric is not None and primary_metric >= self.threshold


class ModelNeedsRetrainingSpecification(Specification):
    """Specification for models that need retraining"""
    
    def __init__(self, days_threshold: int = 90):
        self.days_threshold = days_threshold
    
    def is_satisfied_by(self, model: AIModel) -> bool:
        latest_version = model.get_latest_version()
        if not latest_version:
            return False
        
        days_since_training = (datetime.utcnow() - latest_version.created_at).days
        return days_since_training > self.days_threshold


class ActiveDeploymentSpecification(Specification):
    """Specification for models with active deployments"""
    
    def is_satisfied_by(self, model: AIModel) -> bool:
        return len(model.get_active_deployments()) > 0
