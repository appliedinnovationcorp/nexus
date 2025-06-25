# 🐳 Docker Configuration

This directory contains all Docker-related configuration files, compose files, and deployment scripts for the Nexus platform.

## 📁 Directory Structure

```
docker/
├── compose/                    # Docker Compose files
│   ├── docker-compose.yml      # Main development environment
│   ├── docker-compose.auth.yml # Authentication services
│   ├── docker-compose.nextcloud.yml # Nextcloud integration
│   └── docker-compose.production.yml # Production deployment
├── environments/               # Environment configuration files
│   ├── .env.development       # Development environment variables
│   ├── .env.staging          # Staging environment variables
│   ├── .env.production       # Production environment variables
│   └── .env.example          # Example environment file
├── scripts/                   # Docker utility scripts
│   ├── build-all.sh          # Build all services
│   ├── deploy.sh             # Deployment script
│   ├── cleanup.sh            # Cleanup unused containers/images
│   └── health-check.sh       # Health check script
└── README.md                 # This file
```

## 🚀 Quick Start

### Development Environment
```bash
# Start all development services
docker-compose -f docker/compose/docker-compose.yml up -d

# Start with specific environment
docker-compose -f docker/compose/docker-compose.yml --env-file docker/environments/.env.development up -d
```

### Production Deployment
```bash
# Deploy to production
docker-compose -f docker/compose/docker-compose.production.yml --env-file docker/environments/.env.production up -d
```

### Authentication Services Only
```bash
# Start authentication services
docker-compose -f docker/compose/docker-compose.auth.yml up -d
```

### Nextcloud Integration
```bash
# Start Nextcloud services
docker-compose -f docker/compose/docker-compose.nextcloud.yml up -d
```

## 🔧 Available Services

### Core Platform Services
- **Web Application** (Port 3000)
- **Admin Dashboard** (Port 3002)
- **Client Portal** (Port 3003)
- **AI Tools Platform** (Port 3004)
- **Documentation** (Port 3001)

### Backend Services
- **API Gateway** (Port 8000)
- **Authentication Service** (Port 8001)
- **AI Inference Service** (Port 8003)
- **Explainability Service** (Port 8004)

### Infrastructure Services
- **PostgreSQL Database** (Port 5432)
- **Redis Cache** (Port 6379)
- **MongoDB** (Port 27017)
- **Kafka** (Port 9092)
- **Elasticsearch** (Port 9200)

### Monitoring & Observability
- **Prometheus** (Port 9090)
- **Grafana** (Port 3001)
- **Jaeger** (Port 16686)

## 📋 Environment Configuration

### Development (.env.development)
```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexus_dev
REDIS_URL=redis://localhost:6379
API_URL=http://localhost:8000
```

### Production (.env.production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-db:5432/nexus_prod
REDIS_URL=redis://prod-redis:6379
API_URL=https://api.nexus.com
```

## 🛠️ Utility Scripts

### Build All Services
```bash
./docker/scripts/build-all.sh
```

### Deploy to Environment
```bash
./docker/scripts/deploy.sh production
./docker/scripts/deploy.sh staging
```

### Health Check
```bash
./docker/scripts/health-check.sh
```

### Cleanup
```bash
./docker/scripts/cleanup.sh
```

## 🔍 Monitoring & Logs

### View Logs
```bash
# All services
docker-compose -f docker/compose/docker-compose.yml logs -f

# Specific service
docker-compose -f docker/compose/docker-compose.yml logs -f web

# Last 100 lines
docker-compose -f docker/compose/docker-compose.yml logs --tail=100 api-gateway
```

### Service Status
```bash
# Check running services
docker-compose -f docker/compose/docker-compose.yml ps

# Check service health
docker-compose -f docker/compose/docker-compose.yml exec web curl http://localhost:3000/health
```

## 🔐 Security Considerations

### Environment Files
- Never commit `.env.production` to version control
- Use Docker secrets for sensitive data in production
- Rotate database passwords regularly
- Use strong, unique passwords for all services

### Network Security
- Services communicate through internal Docker networks
- Only necessary ports are exposed to the host
- Use reverse proxy (Nginx/Traefik) for production

### Image Security
- Use official base images when possible
- Regularly update base images
- Scan images for vulnerabilities
- Use multi-stage builds to minimize attack surface

## 📊 Performance Optimization

### Resource Limits
```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### Caching
- Redis for application caching
- Docker layer caching for builds
- CDN for static assets

### Scaling
```bash
# Scale specific service
docker-compose -f docker/compose/docker-compose.yml up -d --scale web=3

# Auto-scaling with Docker Swarm
docker stack deploy -c docker/compose/docker-compose.production.yml nexus
```

## 🚨 Troubleshooting

### Common Issues

**Port Conflicts**
```bash
# Check port usage
netstat -tulpn | grep :3000

# Change ports in compose file
```

**Database Connection Issues**
```bash
# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d nexus
```

**Memory Issues**
```bash
# Check container resource usage
docker stats

# Increase memory limits in compose file
```

### Debug Mode
```bash
# Start with debug logging
DEBUG=* docker-compose -f docker/compose/docker-compose.yml up

# Access container shell
docker-compose exec web bash
```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [Production Deployment Guide](../docs/PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Monitoring Setup](../docs/MONITORING_SETUP.md)

---

**🐳 Containerized deployment made simple with Docker**
