#!/bin/bash

# Nexus Platform - Deployment Script
# Deploy to different environments (development, staging, production)

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

# Default values
ENVIRONMENT="development"
COMPOSE_FILE=""
ENV_FILE=""
DETACHED=true
BUILD=false

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [ENVIRONMENT] [OPTIONS]"
    echo ""
    echo "ENVIRONMENT:"
    echo "  development  Deploy to development environment (default)"
    echo "  staging      Deploy to staging environment"
    echo "  production   Deploy to production environment"
    echo ""
    echo "OPTIONS:"
    echo "  -f, --foreground    Run in foreground (don't detach)"
    echo "  -b, --build         Build images before deploying"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                           # Deploy to development"
    echo "  $0 production                # Deploy to production"
    echo "  $0 staging --build           # Build and deploy to staging"
    echo "  $0 development --foreground  # Deploy to dev in foreground"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        development|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        -f|--foreground)
            DETACHED=false
            shift
            ;;
        -b|--build)
            BUILD=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Set environment-specific configurations
case $ENVIRONMENT in
    development)
        COMPOSE_FILE="$DOCKER_DIR/compose/docker-compose.yml"
        ENV_FILE="$DOCKER_DIR/environments/.env.development"
        ;;
    staging)
        COMPOSE_FILE="$DOCKER_DIR/compose/docker-compose.production.yml"
        ENV_FILE="$DOCKER_DIR/environments/.env.staging"
        ;;
    production)
        COMPOSE_FILE="$DOCKER_DIR/compose/docker-compose.production.yml"
        ENV_FILE="$DOCKER_DIR/environments/.env.production"
        ;;
    *)
        print_error "Invalid environment: $ENVIRONMENT"
        show_usage
        exit 1
        ;;
esac

echo -e "${BLUE}🚀 Nexus Platform - Deployment${NC}"
echo "=================================================="
print_status "Environment: $ENVIRONMENT"
print_status "Compose file: $COMPOSE_FILE"
print_status "Environment file: $ENV_FILE"

# Check if files exist
if [ ! -f "$COMPOSE_FILE" ]; then
    print_error "Compose file not found: $COMPOSE_FILE"
    exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
    print_warning "Environment file not found: $ENV_FILE"
    print_status "Using default environment variables"
    ENV_FILE=""
fi

# Change to project root
cd "$PROJECT_ROOT"

# Build images if requested
if [ "$BUILD" = true ]; then
    print_status "Building images..."
    if [ -n "$ENV_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --parallel
    else
        docker-compose -f "$COMPOSE_FILE" build --parallel
    fi
    print_success "Images built successfully"
fi

# Deploy services
print_status "Deploying services..."

COMPOSE_CMD="docker-compose -f $COMPOSE_FILE"
if [ -n "$ENV_FILE" ]; then
    COMPOSE_CMD="$COMPOSE_CMD --env-file $ENV_FILE"
fi

if [ "$DETACHED" = true ]; then
    COMPOSE_CMD="$COMPOSE_CMD up -d"
else
    COMPOSE_CMD="$COMPOSE_CMD up"
fi

print_status "Running: $COMPOSE_CMD"
eval $COMPOSE_CMD

if [ "$DETACHED" = true ]; then
    print_success "Services deployed successfully in detached mode"
    
    # Wait a moment for services to start
    print_status "Waiting for services to start..."
    sleep 10
    
    # Show running services
    print_status "Running services:"
    if [ -n "$ENV_FILE" ]; then
        docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps
    else
        docker-compose -f "$COMPOSE_FILE" ps
    fi
    
    # Run health checks
    print_status "Running health checks..."
    if [ -f "$SCRIPT_DIR/health-check.sh" ]; then
        "$SCRIPT_DIR/health-check.sh" "$ENVIRONMENT"
    else
        print_warning "Health check script not found"
    fi
    
    # Show service URLs
    echo ""
    print_status "Service URLs:"
    case $ENVIRONMENT in
        development)
            echo "  🌐 Web App:         http://localhost:3000"
            echo "  📚 Documentation:   http://localhost:3001"
            echo "  🔧 Admin:           http://localhost:3002"
            echo "  👥 Client Portal:   http://localhost:3003"
            echo "  🤖 AI Tools:        http://localhost:3004"
            echo "  🔌 API Gateway:     http://localhost:8000"
            echo "  🔐 Auth Service:    http://localhost:8001"
            ;;
        staging|production)
            echo "  🌐 Web App:         https://app.nexus.com"
            echo "  📚 Documentation:   https://docs.nexus.com"
            echo "  🔧 Admin:           https://admin.nexus.com"
            echo "  👥 Client Portal:   https://portal.nexus.com"
            echo "  🤖 AI Tools:        https://ai.nexus.com"
            echo "  🔌 API Gateway:     https://api.nexus.com"
            ;;
    esac
    
    echo ""
    print_status "Useful commands:"
    echo "  📊 View logs:       docker-compose -f $COMPOSE_FILE logs -f"
    echo "  🔍 Check status:    docker-compose -f $COMPOSE_FILE ps"
    echo "  🛑 Stop services:   docker-compose -f $COMPOSE_FILE down"
    echo "  🔄 Restart:         docker-compose -f $COMPOSE_FILE restart"
    
else
    print_success "Services started in foreground mode"
fi

echo "=================================================="
print_success "🎉 Deployment completed successfully!"
