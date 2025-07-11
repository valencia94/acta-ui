#!/usr/bin/env bash
set -euo pipefail

# Rebuild and Deploy with Critical Component Fixes
# This script ensures all critical components are included in the build

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}ACTA-UI Complete Rebuild and Deploy${NC}"
echo -e "${BLUE}==============================================${NC}"

# Check environment variables
echo -e "\n${BLUE}Checking environment variables...${NC}"
if [ -z "${AWS_REGION:-}" ]; then
  echo -e "${YELLOW}AWS_REGION not set. Setting to default: us-east-2${NC}"
  export AWS_REGION="us-east-2"
fi

if [ -z "${S3_BUCKET_NAME:-}" ]; then
  echo -e "${RED}❌ S3_BUCKET_NAME not set. Please set this environment variable.${NC}"
  echo "Example: export S3_BUCKET_NAME=your-bucket-name"
  exit 1
fi

if [ -z "${CLOUDFRONT_DIST_ID:-}" ]; then
  echo -e "${RED}❌ CLOUDFRONT_DIST_ID not set. Please set this environment variable.${NC}"
  echo "Example: export CLOUDFRONT_DIST_ID=your-distribution-id"
  exit 1
fi

# Step 1: Fix vite.config.ts to include critical files
echo -e "\n${BLUE}Step 1: Checking vite.config.ts...${NC}"

# Create a backup of the original vite.config.ts
cp vite.config.ts vite.config.ts.backup
echo -e "${GREEN}✅ Backup created: vite.config.ts.backup${NC}"

# Check if we need to update the vite.config.ts file
if ! grep -q "aws-exports.js" vite.config.ts; then
  echo -e "${YELLOW}⚠️ Need to update vite.config.ts to properly include aws-exports.js${NC}"
  
  # Update vite.config.ts to explicitly include aws-exports.js in the build
  sed -i'.tmp' 's/build: {/build: {\n    copyPublicDir: true,\n    assetsInlineLimit: 0,/' vite.config.ts
  rm -f vite.config.ts.tmp
  
  echo -e "${GREEN}✅ Updated vite.config.ts to include assets properly${NC}"
else
  echo -e "${GREEN}✅ vite.config.ts already includes necessary configurations${NC}"
fi

# Step 2: Ensure aws-exports.js is properly handled
echo -e "\n${BLUE}Step 2: Ensuring aws-exports.js is properly included...${NC}"

# Create a public directory version of aws-exports.js to ensure it's included
mkdir -p public
cp src/aws-exports.js public/aws-exports.js
echo -e "${GREEN}✅ Copied aws-exports.js to public directory to ensure inclusion${NC}"

# Step 3: Make sure all API functions are exported
echo -e "\n${BLUE}Step 3: Checking API exports...${NC}"

# Create backup of API.ts
cp src/lib/api.ts src/lib/api.ts.backup
echo -e "${GREEN}✅ Backup created: src/lib/api.ts.backup${NC}"

# Ensure all API functions are properly exported
if ! grep -q "export \* from './lib/api'" src/main.tsx && ! grep -q "export \* from '@/lib/api'" src/main.tsx; then
  echo -e "${YELLOW}⚠️ API functions might not be properly exported from main entry point${NC}"
  
  # Create an index.ts in src/lib to re-export everything
  cat > src/lib/index.ts << EOF
// Re-export all API functions to ensure they're included in the bundle
export * from './api';
EOF
  echo -e "${GREEN}✅ Created src/lib/index.ts to re-export API functions${NC}"
  
  # Add import to main.tsx if it doesn't exist
  if ! grep -q "import.*from.*['\"]@/lib['\"]" src/main.tsx; then
    # Add import to top of main.tsx
    sed -i'.tmp' '1s/^/import "@\/lib";\n/' src/main.tsx
    rm -f src/main.tsx.tmp
    echo -e "${GREEN}✅ Added API import to main.tsx${NC}"
  fi
else
  echo -e "${GREEN}✅ API functions are already properly exported${NC}"
fi

# Step 4: Clean previous build
echo -e "\n${BLUE}Step 4: Cleaning previous build...${NC}"
rm -rf dist
echo -e "${GREEN}✅ Previous build cleaned${NC}"

# Step 5: Rebuild the project
echo -e "\n${BLUE}Step 5: Rebuilding the project...${NC}"
npm run build || pnpm run build || yarn build
if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Build failed! Check the logs above for errors.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Project rebuilt successfully${NC}"

# Step 6: Verify critical files in the build
echo -e "\n${BLUE}Step 6: Verifying critical files in the build...${NC}"

# Check for aws-exports.js
if [ -f "dist/aws-exports.js" ]; then
  echo -e "${GREEN}✅ aws-exports.js found in build${NC}"
else
  echo -e "${YELLOW}⚠️ aws-exports.js not found in build, copying manually...${NC}"
  cp src/aws-exports.js dist/aws-exports.js
  echo -e "${GREEN}✅ Manually copied aws-exports.js to build directory${NC}"
fi

# Check for main JS bundle with API functions
if grep -r "getSummary\|getTimeline\|getDownloadUrl\|sendApprovalEmail" dist --include="*.js" &> /dev/null; then
  echo -e "${GREEN}✅ API functions found in build${NC}"
else
  echo -e "${YELLOW}⚠️ API functions might still be missing from the build${NC}"
  echo -e "${YELLOW}   This may require code changes to ensure they're imported correctly${NC}"
fi

# Step 7: Deploy to S3
echo -e "\n${BLUE}Step 7: Deploying to S3...${NC}"
aws s3 sync dist/ "s3://${S3_BUCKET_NAME}/" --delete --region "${AWS_REGION}"
echo -e "${GREEN}✅ Deployed to S3 bucket: ${S3_BUCKET_NAME}${NC}"

# Step 8: Invalidate CloudFront cache
echo -e "\n${BLUE}Step 8: Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation --distribution-id "${CLOUDFRONT_DIST_ID}" --paths "/*" --region "${AWS_REGION}"
echo -e "${GREEN}✅ CloudFront cache invalidation initiated${NC}"

# Step 9: Verification
echo -e "\n${BLUE}Step 9: Running verification script...${NC}"
if [ -f "verify-deployment-completeness.sh" ]; then
  bash verify-deployment-completeness.sh
else
  echo -e "${YELLOW}⚠️ Verification script not found. Skipping verification.${NC}"
fi

echo -e "\n${BLUE}==============================================${NC}"
echo -e "${GREEN}✅ Rebuild and deployment completed!${NC}"
echo -e "${BLUE}==============================================${NC}"

# Get CloudFront domain for testing
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id "${CLOUDFRONT_DIST_ID}" --query "Distribution.DomainName" --output text --region "${AWS_REGION}" 2>/dev/null || echo "your-cloudfront-domain")

echo -e "\n${YELLOW}📋 Next steps:${NC}"
echo -e "1. Test the application at: https://${CLOUDFRONT_DOMAIN}/"
echo -e "2. Run the automated test script: node test-production.js"
echo -e "3. Verify all features are working correctly"
echo -e "\n${BLUE}Note: It may take a few minutes for the CloudFront cache invalidation to complete${NC}"
