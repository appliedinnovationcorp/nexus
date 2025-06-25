#!/bin/bash
# Health Check Script for All Services

echo "🏥 AIC Nexus Platform Health Check"
echo "=================================="

services=(
    "Authentication:8005"
    "Client Management:8001" 
    "Project Management:8002"
    "Billing:8003"
    "AI Models:8004"
    "Documents:8016"
)

all_healthy=true

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -f http://localhost:$port/health > /dev/null 2>&1; then
        echo "✅ $name - Healthy"
    else
        echo "❌ $name - Unhealthy"
        all_healthy=false
    fi
done

echo "=================================="
if [ "$all_healthy" = true ]; then
    echo "🎉 All services are healthy!"
    exit 0
else
    echo "⚠️  Some services are unhealthy"
    exit 1
fi
