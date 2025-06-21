#!/bin/bash

# Script to help get Vercel configuration for GitHub Secrets

echo "🚀 Vercel Configuration Helper"
echo "================================"
echo ""

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    pnpm add -g vercel
fi

echo "📋 Step 1: Login to Vercel"
echo "Run: vercel login"
echo "Follow the prompts to authenticate with your Vercel account"
echo ""

echo "📋 Step 2: Link your project"
echo "Run: vercel link"
echo "Choose your settings:"
echo "  - Link to existing project? No"
echo "  - Project name: nexus (or your preferred name)"
echo "  - Directory: ./"
echo ""

echo "📋 Step 3: Get your configuration"
echo "After linking, your project config will be in .vercel/project.json"
echo ""

# Check if .vercel directory exists
if [ -d ".vercel" ]; then
    echo "✅ Vercel project already linked!"
    echo ""
    
    if [ -f ".vercel/project.json" ]; then
        echo "📄 Your Vercel Project Configuration:"
        echo "======================================"
        cat .vercel/project.json
        echo ""
        echo "📋 Extract these values for GitHub Secrets:"
        echo "- VERCEL_ORG_ID: $(cat .vercel/project.json | grep -o '"orgId":"[^"]*' | cut -d'"' -f4)"
        echo "- VERCEL_PROJECT_ID: $(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)"
        echo ""
    fi
else
    echo "⚠️  Project not linked yet. Run 'vercel link' first."
    echo ""
fi

echo "📋 Step 4: Get your Vercel Token"
echo "1. Go to: https://vercel.com/account/tokens"
echo "2. Click 'Create Token'"
echo "3. Name: 'GitHub Actions'"
echo "4. Expiration: No expiration (or 1 year)"
echo "5. Scope: Full Account (or specific team)"
echo "6. Copy the token value"
echo ""

echo "📋 Step 5: Add Secrets to GitHub"
echo "Go to: https://github.com/appliedinnovationcorp/nexus/settings/secrets/actions"
echo "Add these secrets:"
echo "- VERCEL_TOKEN: [your token from step 4]"
echo "- VERCEL_ORG_ID: [from project.json above]"
echo "- VERCEL_PROJECT_ID: [from project.json above]"
echo ""

echo "🎯 Optional: Setup Turbo Remote Caching"
echo "Run: npx turbo login"
echo "Run: npx turbo link"
echo "Add these secrets:"
echo "- TURBO_TOKEN: [same as VERCEL_TOKEN]"
echo "- TURBO_TEAM: [your Vercel team name]"
echo ""

echo "✅ Done! Your CI/CD pipeline will be ready after adding the secrets."
