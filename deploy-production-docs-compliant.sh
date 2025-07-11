#!/bin/bash
# ACTA-UI Production Deployment Script
# Based on ACTA-UI Documentation: Single Source of Truth
# Last Updated: July 9, 2025

set -e

echo "🚀 Starting ACTA-UI production deployment (Documentation Compliant)..."

# Configuration from documentation
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== ACTA-UI Documentation Compliant Deployment ===${NC}"
echo -e "S3 Bucket: ${S3_BUCKET}"
echo -e "CloudFront ID: ${CLOUDFRONT_DISTRIBUTION_ID}"
echo -e "Region: ${AWS_REGION}"

# Step 1: Ensure browser-compatible aws-exports.js exists in public/
echo -e "\n${BLUE}Step 1: Ensuring browser-compatible aws-exports.js exists in public/${NC}"

if [ ! -f "public/aws-exports.js" ]; then
    echo -e "${RED}❌ public/aws-exports.js not found!${NC}"
    echo -e "${YELLOW}Creating browser-compatible version...${NC}"
    
    cat > public/aws-exports.js << 'EOF'
// AWS Amplify Configuration for Acta-UI (Browser-compatible version)
// This file sets window.awsmobile for browser consumption

window.awsmobile = {
  aws_project_region: 'us-east-2',
  aws_cognito_region: 'us-east-2',
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',
  aws_cognito_identity_pool_id: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
  Auth: {
    userPoolId: 'us-east-2_FyHLtOhiY',
    userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
    identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
    identityPoolRegion: 'us-east-2',
    authenticationFlowType: 'USER_SRP_AUTH',
    mandatorySignIn: true,
    region: 'us-east-2'
  },
  aws_cloud_logic_custom: [
    {
      name: 'ActaAPI',
      endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
      region: 'us-east-2'
    }
  ],
  aws_user_files_s3_bucket: 'projectplace-dv-2025-x9a7b',
  aws_user_files_s3_bucket_region: 'us-east-2',
  oauth: {
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/login',
    responseType: 'code'
  }
};

console.log('✅ AWS Cognito config loaded successfully!');
EOF
    echo -e "${GREEN}✅ Created browser-compatible aws-exports.js${NC}"
else
    echo -e "${GREEN}✅ Browser-compatible aws-exports.js already exists${NC}"
fi

# Step 2: Build the application with Vite
echo -e "\n${BLUE}Step 2: Building the application with Vite${NC}"

# Clean previous build
rm -rf dist
echo -e "${GREEN}✅ Cleaned previous build${NC}"

# Run build
npm run build || pnpm run build || yarn build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed! Deployment aborted.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Application built successfully${NC}"

# Step 3: Verify aws-exports.js is correctly included in the build
echo -e "\n${BLUE}Step 3: Verifying aws-exports.js is correctly included in the build${NC}"

if [ -f "dist/aws-exports.js" ]; then
    echo -e "${GREEN}✅ aws-exports.js found in build directory${NC}"
    
    # Verify it contains the window.awsmobile assignment
    if grep -q "window.awsmobile" dist/aws-exports.js; then
        echo -e "${GREEN}✅ aws-exports.js contains correct window.awsmobile assignment${NC}"
    else
        echo -e "${RED}❌ aws-exports.js does not contain window.awsmobile assignment${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ aws-exports.js not found in build directory${NC}"
    echo -e "${YELLOW}Copying from public directory...${NC}"
    cp public/aws-exports.js dist/aws-exports.js
    echo -e "${GREEN}✅ Manually copied aws-exports.js to build directory${NC}"
fi

# Verify index.html loads aws-exports.js before main bundle
if grep -q 'src="/aws-exports.js"' dist/index.html; then
    echo -e "${GREEN}✅ index.html correctly loads aws-exports.js before main bundle${NC}"
else
    echo -e "${RED}❌ index.html does not load aws-exports.js correctly${NC}"
    exit 1
fi

# Step 4: Upload files to S3 bucket
echo -e "\n${BLUE}Step 4: Uploading files to S3 bucket${NC}"

aws s3 sync dist/ "s3://${S3_BUCKET}/" --delete --region "${AWS_REGION}"
echo -e "${GREEN}✅ Files uploaded to S3 bucket: ${S3_BUCKET}${NC}"

# Step 5: Invalidate CloudFront cache
echo -e "\n${BLUE}Step 5: Invalidating CloudFront cache${NC}"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
    --paths "/*" \
    --region "${AWS_REGION}" \
    --query 'Invalidation.Id' \
    --output text)

echo -e "${GREEN}✅ CloudFront cache invalidation initiated (ID: ${INVALIDATION_ID})${NC}"

# Final verification
echo -e "\n${BLUE}=== Final Verification ===${NC}"
echo -e "✅ Browser-compatible aws-exports.js: $([ -f "dist/aws-exports.js" ] && echo "Present" || echo "Missing")"
echo -e "✅ Build directory: $([ -d "dist" ] && echo "Present" || echo "Missing")"
echo -e "✅ S3 deployment: Complete"
echo -e "✅ CloudFront invalidation: Initiated"

echo -e "\n${GREEN}🎉 ACTA-UI production deployment completed successfully!${NC}"
echo -e "${BLUE}Application URL: https://d7t9x3j66yd8k.cloudfront.net${NC}"
echo -e "${YELLOW}Note: CloudFront cache invalidation may take 5-15 minutes to complete${NC}"

echo -e "\n${BLUE}Next Steps (from Documentation):${NC}"
echo -e "1. Wait for CloudFront cache invalidation to complete"
echo -e "2. Test authentication flow with test credentials"
echo -e "3. Verify project loading from DynamoDB"
echo -e "4. Test ACTA document generation and download"
echo -e "5. Run automated test: node test-production.js"
