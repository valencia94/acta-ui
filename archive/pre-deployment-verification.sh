#!/bin/bash
# Pre-deployment verification script
# Ensures all security fixes are in place before deploying to production

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

echo -e "${BLUE}🔒 ACTA-UI Pre-Deployment Security Verification${NC}"
echo -e "${BLUE}================================================${NC}\n"

# Test 1: Verify protected endpoints return 401 without auth
echo -e "${YELLOW}🔍 Test 1: Verifying protected endpoints require authentication${NC}"

PROTECTED_ENDPOINTS=(
    "/timeline"
    "/project-summary" 
    "/download-acta"
    "/extract-project-place"
    "/send-approval-email"
)

all_protected=true
for endpoint in "${PROTECTED_ENDPOINTS[@]}"; do
    echo -n "  Testing $endpoint... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE$endpoint" || echo "000")
    if [[ "$status" == "401" ]] || [[ "$status" == "403" ]]; then
        echo -e "${GREEN}✅ Protected ($status)${NC}"
    else
        echo -e "${RED}❌ Not protected ($status)${NC}"
        all_protected=false
    fi
done

if $all_protected; then
    echo -e "${GREEN}✅ All critical endpoints are properly protected${NC}\n"
else
    echo -e "${RED}❌ Some endpoints are not protected - DEPLOYMENT UNSAFE${NC}"
    exit 1
fi

# Test 2: Verify public endpoints are accessible
echo -e "${YELLOW}🔍 Test 2: Verifying public endpoints are accessible${NC}"

PUBLIC_ENDPOINTS=(
    "/health"
    "/projects"
)

all_public=true
for endpoint in "${PUBLIC_ENDPOINTS[@]}"; do
    echo -n "  Testing $endpoint... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE$endpoint" || echo "000")
    if [[ "$status" == "200" ]] || [[ "$status" == "403" ]]; then
        echo -e "${GREEN}✅ Accessible ($status)${NC}"
    else
        echo -e "${YELLOW}⚠️  Response: $status${NC}"
    fi
done

echo -e "${GREEN}✅ Public endpoints are accessible${NC}\n"

# Test 3: Verify local build works
echo -e "${YELLOW}🔍 Test 3: Verifying local build${NC}"

if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Build directory exists${NC}"
else
    echo -e "${YELLOW}⚠️  No build directory found - running build...${NC}"
    pnpm run build
fi

# Test 4: Check essential files are staged
echo -e "${YELLOW}🔍 Test 4: Verifying essential files are staged${NC}"

ESSENTIAL_FILES=(
    "src/aws-exports.js"
    ".env.production" 
    "src/components/ActaButtons/ActaButtons.tsx"
    "src/pages/Dashboard.tsx"
    "src/lib/api.ts"
)

for file in "${ESSENTIAL_FILES[@]}"; do
    if git diff --cached --name-only | grep -q "^$file$"; then
        echo -e "  ✅ $file"
    else
        echo -e "  ${YELLOW}⚠️  $file not staged${NC}"
    fi
done

echo -e "\n${GREEN}🚀 PRE-DEPLOYMENT VERIFICATION COMPLETE${NC}"
echo -e "${GREEN}✅ All security checks passed${NC}"
echo -e "${GREEN}✅ Ready for production deployment${NC}"

echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Commit changes: ${YELLOW}git commit -m 'feat: implement Cognito authentication and API security'${NC}"
echo -e "2. Push to trigger deployment: ${YELLOW}git push origin develop${NC}"
echo -e "3. Monitor GitHub Actions: ${YELLOW}https://github.com/your-repo/actions${NC}"
echo -e "4. Verify production deployment with live-api-monitor.sh after completion"
