#!/bin/bash

# Render Deployment Guide for GraphQL Blog API
# Render uses dashboard + render.yaml approach (no CLI needed)

set -e

echo "=========================================="
echo "   Render Deployment - GraphQL Blog API"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Verify render.yaml exists
echo -e "${BLUE}Step 1: Verifying render.yaml configuration${NC}"
if [ -f "render.yaml" ]; then
    echo -e "${GREEN}✓ render.yaml found${NC}"
else
    echo -e "${RED}✗ render.yaml not found${NC}"
    exit 1
fi
echo ""

# Step 2: Check if we're in a git repo
echo -e "${BLUE}Step 2: Checking Git repository${NC}"
if [ -d ".git" ]; then
    echo -e "${GREEN}✓ Git repository detected${NC}"
else
    echo -e "${YELLOW}⚠ Not a git repository. Initializing...${NC}"
    git init
    git add .
    git commit -m "Initial commit for Render deployment"
    echo -e "${GREEN}✓ Git repository initialized${NC}"
fi
echo ""

# Step 3: Check for GitHub remote
echo -e "${BLUE}Step 3: Checking GitHub remote${NC}"
if git remote get-url origin &> /dev/null; then
    REPO_URL=$(git remote get-url origin)
    echo -e "${GREEN}✓ GitHub remote found: ${REPO_URL}${NC}"
else
    echo -e "${YELLOW}⚠ No GitHub remote found${NC}"
    echo ""
    echo "You need to push this code to GitHub first:"
    echo ""
    echo "  1. Create a new repository on GitHub"
    echo "  2. Run these commands:"
    echo "     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo "     git branch -M main"
    echo "     git push -u origin main"
    echo ""
    read -p "Press Enter after pushing to GitHub..."
fi
echo ""

# Step 4: Provide deployment instructions
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}   Ready to Deploy to Render!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}🚀 Deployment Steps:${NC}"
echo ""
echo "1. Go to https://dashboard.render.com/register"
echo "   (Sign up with GitHub - no credit card required!)"
echo ""
echo "2. Click 'New +' → 'Blueprint'"
echo ""
echo "3. Connect your GitHub repository"
echo "   - Click 'Connect Account' if needed"
echo "   - Select your repository"
echo ""
echo "4. Render will auto-detect render.yaml"
echo "   - Click 'Apply' to create all services"
echo "   - Services created:"
echo "     • blog-db (PostgreSQL)"
echo "     • blog-redis (Redis)"
echo "     • blog-api (Web Service)"
echo ""
echo "5. Wait 5-10 minutes for deployment"
echo "   - All services will turn green when ready"
echo ""
echo "6. Get your API URL:"
echo "   - Go to blog-api service"
echo "   - Copy the URL (https://blog-api-xxxx.onrender.com)"
echo ""
echo "7. Seed the database:"
echo "   - Go to blog-db service → Shell tab"
echo "   - Run SQL from seeds/01-schema.sql"
echo "   - Then run SQL from seeds/02-data.sql"
echo ""
echo -e "${BLUE}✅ Test Your Deployment:${NC}"
echo ""
echo "  curl https://YOUR-APP.onrender.com/health"
echo "  # Should return: {\"status\":\"ok\"}"
echo ""
echo "  curl -X POST https://YOUR-APP.onrender.com/graphql \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"query\":\"{users(first:1){edges{node{username}}}}}\"}'"
echo ""
echo -e "${YELLOW}📝 Notes:${NC}"
echo "  • First deploy takes 5-10 minutes"
echo "  • Free tier never sleeps (unlike Heroku)"
echo "  • WebSocket subscriptions fully supported"
echo "  • Auto-deploys on git push"
echo "  • HTTPS included automatically"
echo ""
echo -e "${GREEN}✓ Setup complete! Follow the steps above to deploy.${NC}"
echo ""
echo -e "${BLUE}Need help?${NC} Visit https://render.com/docs/deploy-graphql-api"
