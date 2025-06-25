#!/bin/bash

# Nexus Platform - Build All Services Script
# This script builds all Docker images for the Nexus platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DOCKER_DIR="$PROJECT_ROOT/docker"

echo -e "${BLUE}🐳 Nexus Platform - Build All Services${NC}"
echo "=================================================="

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to build service
build_service() {
    local service_name=$1
    local dockerfile_path=$2
    local context_path=$3
    local image_tag="nexus/${service_name}:latest"
    
    print_status "Building $service_name..."
    
    if [ -f "$dockerfile_path" ]; then
        docker build -t "$image_tag" -f "$dockerfile_path" "$context_path"
        print_success "Built $service_name successfully"
    else
        print_warning "Dockerfile not found for $service_name at $dockerfile_path"
    fi
}

# Change to project root
cd "$PROJECT_ROOT"

print_status "Starting build process..."
print_status "Project root: $PROJECT_ROOT"

# Build Frontend Applications
print_status "Building Frontend Applications..."

# Web Application
build_service "web" "$PROJECT_ROOT/apps/web/Dockerfile" "$PROJECT_ROOT/apps/web"

# Admin Dashboard
build_service "admin" "$PROJECT_ROOT/apps/admin/Dockerfile" "$PROJECT_ROOT/apps/admin"

# Client Portal
build_service "client-portal" "$PROJECT_ROOT/apps/client-portal/Dockerfile" "$PROJECT_ROOT/apps/client-portal"

# AI Tools Platform
build_service "ai-tools" "$PROJECT_ROOT/apps/ai-tools/Dockerfile" "$PROJECT_ROOT/apps/ai-tools"

# Documentation
build_service "docs" "$PROJECT_ROOT/apps/docs/Dockerfile" "$PROJECT_ROOT/apps/docs"

# Build Backend Services
print_status "Building Backend Services..."

# Authentication Service
build_service "auth-service" "$PROJECT_ROOT/services/authentication/Dockerfile" "$PROJECT_ROOT/services/authentication"

# API Gateway
build_service "api-gateway" "$PROJECT_ROOT/services/api-gateway/Dockerfile" "$PROJECT_ROOT/services/api-gateway"

# AI Model Management
build_service "ai-model-management" "$PROJECT_ROOT/services/ai-model-management/Dockerfile" "$PROJECT_ROOT/services/ai-model-management"

# AI Inference Service
build_service "ai-inference-service" "$PROJECT_ROOT/services/ai-inference-service/Dockerfile" "$PROJECT_ROOT/services/ai-inference-service"

# Explainability Service
build_service "explainability-service" "$PROJECT_ROOT/services/explainability-service/Dockerfile" "$PROJECT_ROOT/services/explainability-service"

# Billing Service
build_service "billing" "$PROJECT_ROOT/services/billing/Dockerfile" "$PROJECT_ROOT/services/billing"

# Client Management Service
build_service "client-management" "$PROJECT_ROOT/services/client-management/Dockerfile" "$PROJECT_ROOT/services/client-management"

# Project Management Service
build_service "project-management" "$PROJECT_ROOT/services/project-management/Dockerfile" "$PROJECT_ROOT/services/project-management"

# Nextcloud Integration Service
build_service "nextcloud-integration" "$PROJECT_ROOT/services/nextcloud-integration/Dockerfile" "$PROJECT_ROOT/services/nextcloud-integration"

# Build with Docker Compose
print_status "Building services with Docker Compose..."

# Build development environment
if [ -f "$DOCKER_DIR/compose/docker-compose.yml" ]; then
    print_status "Building development services..."
    docker-compose -f "$DOCKER_DIR/compose/docker-compose.yml" build --parallel
    print_success "Development services built successfully"
fi

# Build production environment
if [ -f "$DOCKER_DIR/compose/docker-compose.production.yml" ]; then
    print_status "Building production services..."
    docker-compose -f "$DOCKER_DIR/compose/docker-compose.production.yml" build --parallel
    print_success "Production services built successfully"
fi

# Clean up dangling images
print_status "Cleaning up dangling images..."
docker image prune -f

# Show built images
print_status "Built images:"
docker images | grep nexus

# Summary
echo ""
echo "=================================================="
print_success "🎉 All services built successfully!"
echo ""
print_status "Next steps:"
echo "  1. Start development environment:"
echo "     docker-compose -f docker/compose/docker-compose.yml up -d"
echo ""
echo "  2. Start production environment:"
echo "     docker-compose -f docker/compose/docker-compose.production.yml up -d"
echo ""
echo "  3. Check service health:"
echo "     ./docker/scripts/health-check.sh"
echo "=================================================="
