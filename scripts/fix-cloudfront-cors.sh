#!/bin/bash
# CloudFront Distribution CORS and Caching Fix for ACTA-UI
# This script updates CloudFront distribution EPQU7PVDLQXUA behavior for /api/*

set -e

DISTRIBUTION_ID="EPQU7PVDLQXUA"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 CloudFront Distribution Fix for ACTA-UI${NC}"
echo "============================================="
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Required CloudFront Configuration for ${DISTRIBUTION_ID}:${NC}"
echo ""
echo "Behavior for /api/*:"
echo "  ✅ Forward headers: Authorization, Origin, Access-Control-Request-Headers, Access-Control-Request-Method"
echo "  ✅ Use CachingDisabled cache policy"
echo "  ✅ Use origin request policy that passes Authorization and all query strings + cookies"
echo ""

# Get current distribution config
echo -e "${YELLOW}📥 Getting current distribution configuration...${NC}"
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --output table

echo ""
echo -e "${YELLOW}⚠️  MANUAL STEPS REQUIRED:${NC}"
echo "Due to the complexity of CloudFront distribution updates, please follow these steps:"
echo ""
echo "1. Go to AWS Console → CloudFront → Distributions → $DISTRIBUTION_ID"
echo "2. Go to 'Behaviors' tab"
echo "3. Edit the behavior for '/api/*' path pattern"
echo "4. Set the following:"
echo "   • Cache policy: CachingDisabled"
echo "   • Origin request policy: CORS-S3Origin or create custom with:"
echo "     - Query strings: All"
echo "     - Headers: Authorization, Origin, Access-Control-Request-Headers, Access-Control-Request-Method, Content-Type"
echo "     - Cookies: All"
echo "5. Save changes and wait for deployment"
echo ""

# Create invalidation for immediate effect
echo -e "${YELLOW}🔄 Creating CloudFront invalidation...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/api/*" "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo -e "${GREEN}✅ Invalidation created: $INVALIDATION_ID${NC}"
echo "This will clear the cache for all API calls and ensure new configuration takes effect."
echo ""
echo -e "${GREEN}🎯 Next: Run fix-api-gateway-cors.sh to complete the CORS setup${NC}"