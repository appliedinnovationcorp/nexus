# ☸️ Kubernetes Infrastructure

Kubernetes manifests, Helm charts, and container orchestration configurations for the Nexus platform.

## 📁 Structure

```
k8s/
├── manifests/             # Raw Kubernetes YAML manifests
│   ├── core/             # Core platform services
│   ├── applications/     # Application deployments
│   ├── databases/        # Database configurations
│   ├── monitoring/       # Monitoring stack
│   └── security/         # Security policies and RBAC
├── helm/                 # Helm charts
│   ├── nexus-platform/   # Main platform chart
│   ├── nexus-web/        # Web application chart
│   ├── nexus-api/        # API services chart
│   ├── nexus-ai/         # AI services chart
│   └── nexus-data/       # Data services chart
├── operators/            # Custom Kubernetes operators
│   ├── nexus-operator/   # Custom platform operator
│   └── ai-operator/      # AI workload operator
└── configs/              # ConfigMaps and Secrets
    ├── configmaps/       # Application configurations
    ├── secrets/          # Secret templates
    └── environments/     # Environment-specific configs
```

## 🚀 Deployment

### Quick Deploy
```bash
# Deploy core infrastructure
kubectl apply -f manifests/core/

# Deploy applications
helm install nexus-platform ./helm/nexus-platform

# Deploy monitoring
kubectl apply -f manifests/monitoring/
```

### Environment-Specific Deployment
```bash
# Staging
helm install nexus-staging ./helm/nexus-platform -f values-staging.yaml

# Production
helm install nexus-production ./helm/nexus-platform -f values-production.yaml
```

## 📊 Monitoring & Observability

Integrated monitoring stack with Prometheus, Grafana, and Jaeger for comprehensive observability across all services.
