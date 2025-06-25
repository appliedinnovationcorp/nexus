#!/bin/bash

# Fix Package Versions Script
# This script fixes common package version issues in the workspace

set -e

echo "🔧 Fixing package versions..."

# Fix pinecone-client version
echo "Fixing pinecone-client version..."
sed -i 's/"pinecone-client": "^3.0.3"/"pinecone-client": "^2.0.0"/g' services/ai-inference-service/package.json

# Fix any remaining fastify-related packages
echo "Checking for other fastify version issues..."
find . -name "package.json" -exec grep -l "fastify-" {} \; | while read file; do
    echo "Checking $file for fastify packages..."
    # Fix common fastify package version issues
    sed -i 's/"fastify-cors": "[^"]*"/"@fastify\/cors": "^8.0.0"/g' "$file"
    sed -i 's/"fastify-helmet": "[^"]*"/"@fastify\/helmet": "^11.0.0"/g' "$file"
    sed -i 's/"fastify-multipart": "[^"]*"/"@fastify\/multipart": "^8.0.0"/g' "$file"
done

# Fix any bull/bullmq issues
echo "Fixing bull/bullmq packages..."
find . -name "package.json" -exec grep -l '"bull"' {} \; | while read file; do
    echo "Updating bull to bullmq in $file..."
    sed -i 's/"bull": "[^"]*"/"bullmq": "^4.0.0"/g' "$file"
    sed -i 's/"@types\/bull": "[^"]*"/"@types\/bullmq": "^4.0.0"/g' "$file"
done

# Remove problematic packages that should be system-installed
echo "Removing system-level packages..."
find . -name "package.json" -exec sed -i '/semgrep/d' {} \;
find . -name "package.json" -exec sed -i '/snyk/d' {} \;

echo "✅ Package versions fixed!"
echo "Now try running: pnpm install"
