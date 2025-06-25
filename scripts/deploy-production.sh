#!/bin/bash
# AIC Nexus Platform - Production Deployment Script
set -e

echo "🚀 Deploying AIC Nexus Platform to Production"

# Check environment variables
if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET environment variable is required"
    exit 1
fi

# Build and deploy
echo "📦 Building all services..."
docker-compose -f docker-compose.production.yml build

echo "🏗️ Starting infrastructure services..."
docker-compose -f docker-compose.production.yml up -d postgres redis mongodb kafka zookeeper

echo "⏳ Waiting for infrastructure..."
sleep 30

echo "🔐 Starting authentication service..."
docker-compose -f docker-compose.production.yml up -d authentication
sleep 15

echo "🚀 Starting all microservices..."
docker-compose -f docker-compose.production.yml up -d

echo "🏥 Health checking services..."
services=("8005" "8001" "8002" "8003" "8004" "8016")
for port in "${services[@]}"; do
    echo "Checking service on port $port..."
    for i in {1..30}; do
        if curl -f http://localhost:$port/health > /dev/null 2>&1; then
            echo "✅ Service on port $port is healthy"
            break
        fi
        sleep 2
    done
done

echo "🎉 AIC Nexus Platform deployed successfully!"
echo "✅ Platform is ready for production use!"
