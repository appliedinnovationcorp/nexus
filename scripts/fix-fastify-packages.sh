#!/bin/bash

# Fix Fastify Package Names Script
# Many Fastify plugins moved from fastify-* to @fastify/* namespace

set -e

echo "🔧 Fixing Fastify package names..."

# Function to update fastify packages in a file
fix_fastify_packages() {
    local file="$1"
    echo "Fixing Fastify packages in: $file"
    
    # Common Fastify package name changes
    sed -i 's/"fastify-rate-limit": "\([^"]*\)"/"@fastify\/rate-limit": "\1"/g' "$file"
    sed -i 's/"fastify-cors": "\([^"]*\)"/"@fastify\/cors": "\1"/g' "$file"
    sed -i 's/"fastify-helmet": "\([^"]*\)"/"@fastify\/helmet": "\1"/g' "$file"
    sed -i 's/"fastify-multipart": "\([^"]*\)"/"@fastify\/multipart": "\1"/g' "$file"
    sed -i 's/"fastify-jwt": "\([^"]*\)"/"@fastify\/jwt": "\1"/g' "$file"
    sed -i 's/"fastify-cookie": "\([^"]*\)"/"@fastify\/cookie": "\1"/g' "$file"
    sed -i 's/"fastify-session": "\([^"]*\)"/"@fastify\/session": "\1"/g' "$file"
    sed -i 's/"fastify-redis": "\([^"]*\)"/"@fastify\/redis": "\1"/g' "$file"
    sed -i 's/"fastify-swagger": "\([^"]*\)"/"@fastify\/swagger": "\1"/g' "$file"
    sed -i 's/"fastify-swagger-ui": "\([^"]*\)"/"@fastify\/swagger-ui": "\1"/g' "$file"
    sed -i 's/"fastify-static": "\([^"]*\)"/"@fastify\/static": "\1"/g' "$file"
    sed -i 's/"fastify-formbody": "\([^"]*\)"/"@fastify\/formbody": "\1"/g' "$file"
    sed -i 's/"fastify-websocket": "\([^"]*\)"/"@fastify\/websocket": "\1"/g' "$file"
    sed -i 's/"fastify-compress": "\([^"]*\)"/"@fastify\/compress": "\1"/g' "$file"
    sed -i 's/"fastify-auth": "\([^"]*\)"/"@fastify\/auth": "\1"/g' "$file"
    sed -i 's/"fastify-bearer-auth": "\([^"]*\)"/"@fastify\/bearer-auth": "\1"/g' "$file"
    sed -i 's/"fastify-env": "\([^"]*\)"/"@fastify\/env": "\1"/g' "$file"
    sed -i 's/"fastify-mongodb": "\([^"]*\)"/"@fastify\/mongodb": "\1"/g' "$file"
    sed -i 's/"fastify-postgres": "\([^"]*\)"/"@fastify\/postgres": "\1"/g' "$file"
}

# Find all package.json files and fix them
find . -name "package.json" -not -path "./node_modules/*" | while read file; do
    if grep -q "fastify-" "$file"; then
        fix_fastify_packages "$file"
    fi
done

echo "✅ Fastify package names fixed!"

# Also fix some common version issues
echo "🔧 Fixing common version issues..."

# Fix rate-limit version (the @fastify/rate-limit version should be lower)
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"@fastify\/rate-limit": "^9\.1\.0"/"@fastify\/rate-limit": "^8.0.0"/g' {} \;

# Fix other common version mismatches
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"@fastify\/helmet": "^11\.0\.0"/"@fastify\/helmet": "^10.0.0"/g' {} \;
find . -name "package.json" -not -path "./node_modules/*" -exec sed -i 's/"@fastify\/multipart": "^8\.0\.0"/"@fastify\/multipart": "^7.0.0"/g' {} \;

echo "✅ Version fixes applied!"
echo "Now try running: make install"
