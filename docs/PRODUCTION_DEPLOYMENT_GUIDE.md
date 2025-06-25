# Production Deployment Guide

## Quick Start
```bash
export JWT_SECRET="your-secure-jwt-secret"
./scripts/deploy-production.sh
./scripts/health-check.sh
```

## Service Endpoints
- Authentication: http://localhost:8005/docs
- Client Management: http://localhost:8001/docs  
- Project Management: http://localhost:8002/docs
- Billing: http://localhost:8003/docs
- AI Models: http://localhost:8004/docs
- Documents: http://localhost:8016/docs

## Production Checklist
- [ ] Change default passwords
- [ ] Set secure JWT_SECRET
- [ ] Configure SSL/TLS
- [ ] Set up monitoring
- [ ] Configure backups
