# Microservices Architecture

This directory contains all the microservices for the B2B platform ecosystem.

## Services Overview

### Core Business Services
- **identity-service**: User authentication, authorization, and account management
- **organization-service**: Organization and team management
- **project-service**: Project lifecycle and collaboration management
- **content-service**: Content management and publishing
- **notification-service**: Multi-channel notification system
- **analytics-service**: Metrics collection and business intelligence

### Infrastructure Services
- **api-gateway**: Central API gateway with routing, authentication, and rate limiting
- **event-bus**: Event streaming and message broker
- **file-storage**: File upload, storage, and CDN management

### Integration Services
- **webhook-service**: Webhook management and delivery
- **integration-service**: Third-party API integrations
- **email-service**: Email delivery and templates

## Architecture Patterns

- **Domain Driven Design (DDD)**: Each service owns its domain
- **Event Sourcing**: Complete audit trail and event replay
- **CQRS**: Separate read and write models
- **Microservices**: Independent deployment and scaling
- **Event-Driven Architecture**: Loose coupling via events

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with Helmet, CORS, and compression
- **Database**: PostgreSQL (default) with Supabase support
- **Event Store**: PostgreSQL-based event sourcing
- **Message Queue**: Redis for event bus
- **API**: REST and GraphQL endpoints
- **Documentation**: OpenAPI/Swagger

## Development

Each service follows the same structure:
```
service-name/
├── src/
│   ├── api/           # REST and GraphQL endpoints
│   ├── application/   # Command/Query handlers (CQRS)
│   ├── domain/        # Domain logic (imported from shared domain)
│   ├── infrastructure/# Database, external services
│   └── config/        # Service configuration
├── tests/
├── docker/
└── package.json
```

## Deployment

- Each service is containerized with Docker
- Kubernetes manifests for orchestration
- Environment-specific configurations
- Health checks and monitoring
