#!/bin/bash

# Nexus Platform - Generate Secrets Script
# This script generates secure secrets for all environment files

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Nexus Platform - Generate Secrets${NC}"
echo "=================================================="

# Function to generate secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to generate JWT secret (longer)
generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

# Generate secrets
echo -e "${BLUE}[INFO]${NC} Generating secure secrets..."

NEXTAUTH_SECRET=$(generate_secret)
JWT_SECRET=$(generate_jwt_secret)
SESSION_SECRET=$(generate_secret)
ENCRYPTION_KEY=$(generate_secret)

echo -e "${GREEN}[SUCCESS]${NC} Generated secrets:"
echo "  • NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:8}..."
echo "  • JWT_SECRET: ${JWT_SECRET:0:8}..."
echo "  • SESSION_SECRET: ${SESSION_SECRET:0:8}..."
echo "  • ENCRYPTION_KEY: ${ENCRYPTION_KEY:0:8}..."

# Update .env.local (root level)
echo -e "${BLUE}[INFO]${NC} Updating .env.local..."
if [ ! -f .env.local ]; then
    touch .env.local
fi

# Remove existing secrets and add new ones
grep -v "NEXTAUTH_SECRET\|JWT_SECRET\|SESSION_SECRET\|ENCRYPTION_KEY" .env.local > .env.local.tmp || true
cat >> .env.local.tmp << EOF

# Generated secrets - $(date)
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
EOF
mv .env.local.tmp .env.local

# Update apps/web/.env.local
echo -e "${BLUE}[INFO]${NC} Updating apps/web/.env.local..."
mkdir -p apps/web
if [ ! -f apps/web/.env.local ]; then
    cat > apps/web/.env.local << EOF
# Web Application Environment Variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
EOF
fi

# Update web app secrets
grep -v "NEXTAUTH_SECRET\|JWT_SECRET" apps/web/.env.local > apps/web/.env.local.tmp || true
cat >> apps/web/.env.local.tmp << EOF

# Generated secrets - $(date)
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
JWT_SECRET=${JWT_SECRET}
EOF
mv apps/web/.env.local.tmp apps/web/.env.local

# Update apps/ai-tools/.env.local
echo -e "${BLUE}[INFO]${NC} Updating apps/ai-tools/.env.local..."
mkdir -p apps/ai-tools
if [ ! -f apps/ai-tools/.env.local ]; then
    cat > apps/ai-tools/.env.local << EOF
# AI Tools Platform Environment Variables
NEXT_PUBLIC_APP_URL=http://localhost:3004
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3004

# AI Services (add your API keys here)
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
HUGGINGFACE_API_KEY=your-huggingface-api-key-here
EOF
fi

# Update AI tools secrets
grep -v "NEXTAUTH_SECRET\|JWT_SECRET" apps/ai-tools/.env.local > apps/ai-tools/.env.local.tmp || true
cat >> apps/ai-tools/.env.local.tmp << EOF

# Generated secrets - $(date)
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
JWT_SECRET=${JWT_SECRET}
EOF
mv apps/ai-tools/.env.local.tmp apps/ai-tools/.env.local

# Update docker/environments/.env.development
echo -e "${BLUE}[INFO]${NC} Updating docker/environments/.env.development..."
if [ -f docker/environments/.env.development ]; then
    grep -v "NEXTAUTH_SECRET\|JWT_SECRET\|SESSION_SECRET" docker/environments/.env.development > docker/environments/.env.development.tmp || true
    cat >> docker/environments/.env.development.tmp << EOF

# Generated secrets - $(date)
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}
EOF
    mv docker/environments/.env.development.tmp docker/environments/.env.development
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Secrets generated and updated successfully!${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Add your API keys to the environment files:"
echo "   • OpenAI API key in apps/ai-tools/.env.local"
echo "   • OAuth credentials in apps/web/.env.local"
echo "   • Database URLs if using external databases"
echo ""
echo "2. Start the development environment:"
echo "   make dev"
echo ""
echo -e "${YELLOW}🔐 Security Note:${NC}"
echo "• These secrets are for development only"
echo "• Generate new secrets for staging and production"
echo "• Never commit these files to version control"
echo "=================================================="
