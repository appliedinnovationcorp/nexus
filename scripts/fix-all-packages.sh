#!/bin/bash

# Comprehensive Package Fix Script
# This script fixes all known package issues in the workspace

set -e

echo "🔧 Comprehensive package fixes..."

# Fix prometheus-client everywhere
echo "Fixing prometheus-client → prom-client..."
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"prometheus-client": "\([^"]*\)"/"prom-client": "\1"/g' {} \;

# Fix bull → bullmq and remove @types/bullmq
echo "Fixing bull → bullmq..."
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"bull": "\([^"]*\)"/"bullmq": "\1"/g' {} \;
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i '/"@types\/bullmq"/d' {} \;

# Fix Fastify packages
echo "Fixing Fastify packages..."
find . -name "package.json" -not -path "./node_modules/*" | while read file; do
    sed -i 's/"fastify-rate-limit": "\([^"]*\)"/"@fastify\/rate-limit": "^8.0.0"/g' "$file"
    sed -i 's/"fastify-cors": "\([^"]*\)"/"@fastify\/cors": "^8.0.0"/g' "$file"
    sed -i 's/"fastify-helmet": "\([^"]*\)"/"@fastify\/helmet": "^10.0.0"/g' "$file"
    sed -i 's/"fastify-multipart": "\([^"]*\)"/"@fastify\/multipart": "^7.0.0"/g' "$file"
    sed -i 's/"fastify-jwt": "\([^"]*\)"/"@fastify\/jwt": "^7.0.0"/g' "$file"
    sed -i 's/"fastify-cookie": "\([^"]*\)"/"@fastify\/cookie": "^9.0.0"/g' "$file"
    sed -i 's/"fastify-static": "\([^"]*\)"/"@fastify\/static": "^6.0.0"/g' "$file"
    sed -i 's/"fastify-swagger": "\([^"]*\)"/"@fastify\/swagger": "^8.0.0"/g' "$file"
done

# Fix specific version issues
echo "Fixing specific version issues..."
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"pinecone-client": "^3\.0\.3"/"pinecone-client": "^2.0.0"/g' {} \;
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"weaviate-ts-client": "^3\.1\.4"/"weaviate-ts-client": "^2.2.0"/g' {} \;
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"datadog-lambda-js": "^8\.131\.0"/"datadog-lambda-js": "^11.126.0"/g' {} \;
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"sonarjs": "^1\.0\.4"/"sonarjs": "^1.0.0"/g' {} \;
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"react-native-super-grid": "^4\.9\.6"/"react-native-super-grid": "^6.0.1"/g' {} \;

# Remove problematic packages that should be system-installed
echo "Removing system-level packages..."
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i '/semgrep/d' {} \;
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i '/snyk/d' {} \;

# Fix Apollo packages
echo "Fixing Apollo packages..."
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"@apollo\/server-integration-fastify": "\([^"]*\)"/"@as-integrations\/fastify": "^2.1.1"/g' {} \;

# Fix deprecated packages
echo "Fixing deprecated packages..."
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"crypto": "\([^"]*\)"/"node:crypto": "latest"/g' {} \;

echo "✅ All package fixes applied!"
echo ""
echo "Summary of fixes:"
echo "  ✅ prometheus-client → prom-client"
echo "  ✅ bull → bullmq (removed @types/bullmq)"
echo "  ✅ fastify-* → @fastify/* with correct versions"
echo "  ✅ Fixed pinecone, weaviate, datadog versions"
echo "  ✅ Fixed Apollo server integration"
echo "  ✅ Removed system-level packages"
echo ""
echo "Now try running: make install"
