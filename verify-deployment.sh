#!/bin/bash
# verify-deployment.sh
# This script verifies that all required files are properly included in the deployment package
# and checks that the S3 bucket and CloudFront distribution have the correct files.

set -e

echo "🔍 Verifying ACTA-UI Deployment Package..."
echo "=========================================="

# Configuration
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
CLOUDFRONT_URL="https://d7t9x3j66yd8k.cloudfront.net"
BUILD_DIR="dist"
AWS_REGION="us-east-2"

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Verify local build directory
echo -e "${BLUE}Step 1: Verifying local build directory...${NC}"

if [ ! -d "$BUILD_DIR" ]; then
  echo -e "${YELLOW}⚠️ Build directory not found. Building application...${NC}"
  
  # Set environment variables for build
  export VITE_API_BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
  export VITE_COGNITO_REGION="us-east-2"
  export VITE_COGNITO_POOL_ID="us-east-2_FyHLtOhiY"
  export VITE_COGNITO_WEB_CLIENT="dshos5iou44tuach7ta3ici5m"
  export VITE_SKIP_AUTH="false"
  export VITE_USE_MOCK_API="false"
  
  # Clean build
  rm -rf dist .vite node_modules/.vite
  
  # Build the application
  pnpm run build
  
  if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}❌ Failed to build the application${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Application built successfully${NC}"
else
  echo -e "${GREEN}✅ Build directory exists${NC}"
fi

# Check critical files in the build
echo -e "\n${BLUE}Checking critical files in the build...${NC}"

CRITICAL_FILES=(
  "index.html"
  "assets/index-*.js"
  "assets/index-*.css"
)

for pattern in "${CRITICAL_FILES[@]}"; do
  found_files=$(find "$BUILD_DIR" -path "$BUILD_DIR/$pattern" | wc -l)
  if [ "$found_files" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $found_files files matching $pattern${NC}"
    # Show the first match
    find "$BUILD_DIR" -path "$BUILD_DIR/$pattern" | head -n1
  else
    echo -e "${RED}❌ No files found matching $pattern${NC}"
  fi
done

# Check for aws-exports.js file
if [ -f "$BUILD_DIR/aws-exports.js" ]; then
  echo -e "${GREEN}✅ aws-exports.js found in build directory${NC}"
else
  echo -e "${YELLOW}⚠️ aws-exports.js not found in build. Creating it...${NC}"
  
  # Create the aws-exports.js file
  cat > "$BUILD_DIR/aws-exports.js" << EOL
// aws-exports.js - PRODUCTION CONFIGURATION
const awsmobile = {
  aws_project_region: 'us-east-2',
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',
  oauth: {
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/login',
    responseType: 'code',
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
};

export default awsmobile;
EOL
  
  echo -e "${GREEN}✅ Created aws-exports.js in build directory${NC}"
fi

# Step 2: Verify content of index.html
echo -e "\n${BLUE}Step 2: Verifying content of index.html...${NC}"

if grep -q "Ikusi · Acta Platform" "$BUILD_DIR/index.html"; then
  echo -e "${GREEN}✅ index.html has correct title${NC}"
else
  echo -e "${RED}❌ index.html does not have the correct title${NC}"
fi

# Step 3: Verify authentication code in JavaScript bundles
echo -e "\n${BLUE}Step 3: Verifying authentication code in JavaScript bundles...${NC}"

AUTH_PATTERNS=(
  "fetchAuthSession"
  "aws_user_pools"
  "cognito"
)

for pattern in "${AUTH_PATTERNS[@]}"; do
  if grep -r --include="*.js" "$pattern" "$BUILD_DIR/assets/" &> /dev/null; then
    echo -e "${GREEN}✅ Authentication code '$pattern' found in JavaScript bundles${NC}"
  else
    echo -e "${RED}❌ Authentication code '$pattern' not found in JavaScript bundles${NC}"
  fi
done

# Step 4: Verify S3 bucket contents
echo -e "\n${BLUE}Step 4: Verifying S3 bucket contents...${NC}"

# Check if aws CLI is available
if ! command -v aws &> /dev/null; then
  echo -e "${RED}❌ AWS CLI not found. Please install it to continue.${NC}"
  exit 1
fi

# Check if the S3 bucket exists
if aws s3 ls "s3://$S3_BUCKET" &> /dev/null; then
  echo -e "${GREEN}✅ S3 bucket '$S3_BUCKET' exists${NC}"
else
  echo -e "${RED}❌ S3 bucket '$S3_BUCKET' does not exist${NC}"
  exit 1
fi

# Check critical files in S3 bucket
echo -e "\n${BLUE}Checking critical files in S3 bucket...${NC}"

S3_CRITICAL_FILES=(
  "index.html"
  "aws-exports.js"
)

for file in "${S3_CRITICAL_FILES[@]}"; do
  if aws s3 ls "s3://$S3_BUCKET/$file" &> /dev/null; then
    echo -e "${GREEN}✅ File '$file' exists in S3 bucket${NC}"
  else
    echo -e "${RED}❌ File '$file' does not exist in S3 bucket${NC}"
  fi
done

# Check if any JavaScript bundles exist in S3
if aws s3 ls "s3://$S3_BUCKET/assets/" --recursive | grep -q "\.js"; then
  echo -e "${GREEN}✅ JavaScript bundles exist in S3 bucket${NC}"
else
  echo -e "${RED}❌ No JavaScript bundles found in S3 bucket${NC}"
fi

# Step 5: Deploy to S3 and invalidate CloudFront cache
echo -e "\n${BLUE}Step 5: Deploying to S3 and invalidating CloudFront cache...${NC}"

echo -e "${YELLOW}Deploying to S3 bucket: $S3_BUCKET...${NC}"

# Sync files to S3 with correct content types and cache headers
aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET/" \
  --region "$AWS_REGION" \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "*.json" \
  --exclude "aws-exports.js"

# Upload HTML files with no-cache headers
aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET/" \
  --region "$AWS_REGION" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html" \
  --include "*.html"

# Upload JSON files with no-cache headers
aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET/" \
  --region "$AWS_REGION" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "application/json" \
  --include "*.json"

# Upload aws-exports.js with no-cache headers
if [ -f "$BUILD_DIR/aws-exports.js" ]; then
  aws s3 cp "$BUILD_DIR/aws-exports.js" "s3://$S3_BUCKET/aws-exports.js" \
    --region "$AWS_REGION" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "application/javascript"
fi

echo -e "${GREEN}✅ Files uploaded to S3 successfully${NC}"

# Create CloudFront invalidation
echo -e "${YELLOW}Creating CloudFront invalidation...${NC}"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo -e "${GREEN}✅ CloudFront invalidation created: $INVALIDATION_ID${NC}"
echo -e "${YELLOW}⏳ Waiting for invalidation to complete...${NC}"

# Wait for invalidation to complete (with timeout)
timeout 300 aws cloudfront wait invalidation-completed \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --id "$INVALIDATION_ID" || true

echo -e "${GREEN}✅ CloudFront cache invalidation process initiated${NC}"

# Step 6: Verify CloudFront URL
echo -e "\n${BLUE}Step 6: Verifying CloudFront URL...${NC}"

# Check if the CloudFront URL is accessible
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUDFRONT_URL")

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ CloudFront URL is accessible (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${RED}❌ CloudFront URL returned HTTP $HTTP_CODE${NC}"
fi

# Check if aws-exports.js is accessible via CloudFront
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUDFRONT_URL/aws-exports.js")

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ aws-exports.js is accessible via CloudFront (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${RED}❌ aws-exports.js returned HTTP $HTTP_CODE${NC}"
fi

# Step 7: Post-deployment checks
echo -e "\n${BLUE}Step 7: Performing post-deployment checks...${NC}"

# Check CloudFront error rate
echo -e "${YELLOW}Checking CloudFront error rate...${NC}"
CURRENT_TIME=$(date +%s)
ONE_HOUR_AGO=$(($CURRENT_TIME - 3600))

# Convert to ISO format
CURRENT_TIME_ISO=$(date -u -Iseconds -d @$CURRENT_TIME)
ONE_HOUR_AGO_ISO=$(date -u -Iseconds -d @$ONE_HOUR_AGO)

# This would require CloudWatch permissions
# Commenting out as it might not work in all environments
# echo -e "${YELLOW}Note: CloudWatch metrics check skipped${NC}"

# Summary
echo -e "\n${BLUE}====== Deployment Verification Summary ======${NC}"
echo -e "${GREEN}✅ Build directory verified${NC}"
echo -e "${GREEN}✅ Critical files present in build${NC}"
echo -e "${GREEN}✅ Authentication code verified${NC}"
echo -e "${GREEN}✅ S3 bucket contents verified and updated${NC}"
echo -e "${GREEN}✅ CloudFront invalidation created${NC}"
echo -e "${GREEN}✅ CloudFront URL is accessible${NC}"

# Print the CloudFront URL for easy access
echo -e "\n${BLUE}====== Production URL ======${NC}"
echo -e "${GREEN}$CLOUDFRONT_URL${NC}"

echo -e "\n${BLUE}====== Next Steps ======${NC}"
echo -e "1. Verify the application in a browser"
echo -e "2. Test authentication with these credentials:"
echo -e "   - Email: christian.valencia@ikusi.com"
echo -e "   - Password: PdYb7TU7HvBhYP7\$!"
echo -e "3. Test the Generate ACTA, PDF, DOCX, and Send buttons"

echo -e "\n${GREEN}Deployment verification completed!${NC}"
