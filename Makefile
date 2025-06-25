# Nexus Platform - Makefile
# Simplified commands for common development tasks

.PHONY: help dev prod staging build clean logs status stop restart health

# Default target
help: ## Show this help message
	@echo "Nexus Platform - Available Commands"
	@echo "=================================="
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# Development Environment
dev: ## Start development environment
	@echo "🚀 Starting development environment..."
	@docker-compose -f docker/compose/docker-compose.yml --env-file docker/environments/.env.development up -d
	@echo "✅ Development environment started!"
	@echo "🌐 Web App: http://localhost:3000"
	@echo "📚 Docs: http://localhost:3001"
	@echo "🔧 Admin: http://localhost:3002"

dev-build: ## Build and start development environment
	@echo "🔨 Building and starting development environment..."
	@docker-compose -f docker/compose/docker-compose.yml --env-file docker/environments/.env.development up -d --build
	@echo "✅ Development environment built and started!"

dev-logs: ## Show development environment logs
	@docker-compose -f docker/compose/docker-compose.yml --env-file docker/environments/.env.development logs -f

dev-stop: ## Stop development environment
	@echo "🛑 Stopping development environment..."
	@docker-compose -f docker/compose/docker-compose.yml --env-file docker/environments/.env.development down
	@echo "✅ Development environment stopped!"

# Production Environment
prod: ## Start production environment
	@echo "🚀 Starting production environment..."
	@docker-compose -f docker/compose/docker-compose.production.yml --env-file docker/environments/.env.production up -d
	@echo "✅ Production environment started!"

prod-build: ## Build and start production environment
	@echo "🔨 Building and starting production environment..."
	@docker-compose -f docker/compose/docker-compose.production.yml --env-file docker/environments/.env.production up -d --build
	@echo "✅ Production environment built and started!"

prod-logs: ## Show production environment logs
	@docker-compose -f docker/compose/docker-compose.production.yml --env-file docker/environments/.env.production logs -f

prod-stop: ## Stop production environment
	@echo "🛑 Stopping production environment..."
	@docker-compose -f docker/compose/docker-compose.production.yml --env-file docker/environments/.env.production down
	@echo "✅ Production environment stopped!"

# Staging Environment
staging: ## Start staging environment
	@echo "🚀 Starting staging environment..."
	@docker-compose -f docker/compose/docker-compose.production.yml --env-file docker/environments/.env.staging up -d
	@echo "✅ Staging environment started!"

staging-build: ## Build and start staging environment
	@echo "🔨 Building and starting staging environment..."
	@docker-compose -f docker/compose/docker-compose.production.yml --env-file docker/environments/.env.staging up -d --build
	@echo "✅ Staging environment built and started!"

# Build Commands
build: ## Build all services
	@echo "🔨 Building all services..."
	@./docker/scripts/build-all.sh

build-web: ## Build web applications only
	@echo "🔨 Building web applications..."
	@docker build -t nexus/web:latest ./apps/web
	@docker build -t nexus/admin:latest ./apps/admin
	@docker build -t nexus/client-portal:latest ./apps/client-portal
	@docker build -t nexus/ai-tools:latest ./apps/ai-tools

build-services: ## Build backend services only
	@echo "🔨 Building backend services..."
	@docker build -t nexus/auth-service:latest ./services/auth-service
	@docker build -t nexus/api-gateway:latest ./services/api-gateway

# Utility Commands
status: ## Show status of all services
	@echo "📊 Service Status:"
	@docker-compose -f docker/compose/docker-compose.yml --env-file docker/environments/.env.development ps

logs: ## Show logs for all services
	@docker-compose -f docker/compose/docker-compose.yml --env-file docker/environments/.env.development logs -f

health: ## Run health checks
	@echo "🏥 Running health checks..."
	@./docker/scripts/health-check.sh

clean: ## Clean up Docker resources
	@echo "🧹 Cleaning up Docker resources..."
	@docker system prune -f
	@docker volume prune -f
	@echo "✅ Cleanup completed!"

clean-all: ## Clean up everything (including images)
	@echo "🧹 Cleaning up all Docker resources..."
	@docker system prune -a -f
	@docker volume prune -f
	@echo "✅ Deep cleanup completed!"

# Database Commands
db-reset: ## Reset development database
	@echo "🗄️ Resetting development database..."
	@docker-compose -f docker/compose/docker-compose.yml --env-file docker/environments/.env.development exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS nexus_dev;"
	@docker-compose -f docker/compose/docker-compose.yml --env-file docker/environments/.env.development exec postgres psql -U postgres -c "CREATE DATABASE nexus_dev;"
	@echo "✅ Database reset completed!"

db-backup: ## Backup development database
	@echo "💾 Backing up development database..."
	@docker-compose -f docker/compose/docker-compose.yml --env-file docker/environments/.env.development exec postgres pg_dump -U postgres nexus_dev > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backup completed!"

# Development Tools
install: ## Install dependencies for all applications
	@echo "📦 Installing dependencies..."
	@pnpm install
	@echo "✅ Dependencies installed!"

lint: ## Run linting for all applications
	@echo "🔍 Running linting..."
	@pnpm lint
	@echo "✅ Linting completed!"

test: ## Run tests for all applications
	@echo "🧪 Running tests..."
	@pnpm test
	@echo "✅ Tests completed!"

# Quick Start
setup-env: ## Setup environment files for development
	@echo "🔧 Setting up environment files..."
	@if [ ! -f .env.local ]; then \
		echo "Creating .env.local..."; \
		cp .env.local .env.local 2>/dev/null || echo "# Created by make setup-env" > .env.local; \
	fi
	@if [ ! -f docker/environments/.env.development ]; then \
		echo "Creating docker/environments/.env.development..."; \
		cp docker/environments/.env.example docker/environments/.env.development; \
	fi
	@if [ ! -f apps/web/.env.local ]; then \
		echo "Creating apps/web/.env.local..."; \
		mkdir -p apps/web && echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" > apps/web/.env.local; \
	fi
	@if [ ! -f apps/ai-tools/.env.local ]; then \
		echo "Creating apps/ai-tools/.env.local..."; \
		mkdir -p apps/ai-tools && echo "NEXT_PUBLIC_APP_URL=http://localhost:3004" > apps/ai-tools/.env.local; \
	fi
	@echo "✅ Environment files created!"
	@echo "📝 Edit the files to add your API keys and configuration"
	@echo "📚 See ENVIRONMENT_SETUP_GUIDE.md for detailed instructions"

quick-start: setup-env install build dev ## Quick start: setup env, install, build, and run development environment
	@echo ""
	@echo "🎉 Nexus Platform is ready!"
	@echo "=================================="
	@echo "🌐 Web App:         http://localhost:3000"
	@echo "📚 Documentation:   http://localhost:3001"
	@echo "🔧 Admin Dashboard: http://localhost:3002"
	@echo "👥 Client Portal:   http://localhost:3003"
	@echo "🤖 AI Tools:        http://localhost:3004"
	@echo "🔌 API Gateway:     http://localhost:8000"
	@echo "=================================="

# Monitoring
monitor: ## Start monitoring stack (Prometheus, Grafana)
	@echo "📊 Starting monitoring stack..."
	@docker-compose -f docker/compose/docker-compose.yml up -d prometheus grafana
	@echo "✅ Monitoring stack started!"
	@echo "📊 Prometheus: http://localhost:9090"
	@echo "📈 Grafana: http://localhost:3001"
