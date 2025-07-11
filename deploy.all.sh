#!/usr/bin/env bash
set -euo pipefail

# Color codes for readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}ACTA-UI: Full Clean Build & Deploy${NC}"
echo -e "${BLUE}==============================================${NC}"

# 1. Check environment variables
if [ -z "${AWS_REGION:-}" ]; then
  export AWS_REGION="us-east-2"
  echo -e "${YELLOW}AWS_REGION not set. Defaulting to us-east-2${NC}"
fi
export S3_BUCKET_NAME="acta-ui-frontend-prod"
if [ -z "${CLOUDFRONT_DIST_ID:-}" ]; then
  echo -e "${RED}❌ CLOUDFRONT_DIST_ID not set. Please export it and retry.${NC}"
  exit 1
fi

# 2. Clean install and build using pnpm only
echo -e "${BLUE}Cleaning previous build and node_modules...${NC}"
rm -rf dist node_modules .pnpm-store
echo -e "${GREEN}Cleaned.${NC}"

echo -e "${BLUE}Installing dependencies with pnpm...${NC}"
pnpm install

echo -e "${BLUE}Building project with pnpm...${NC}"
pnpm run build

# 3. Ensure aws-exports.js is present in public and dist
cp src/aws-exports.js public/aws-exports.js || true
cp src/aws-exports.js dist/aws-exports.js || true

# 4. Validate build output
echo -e "${BLUE}Validating build output...${NC}"
find dist/ -type f | sort

# 5. Preview S3 sync
echo -e "${BLUE}Previewing S3 sync (dry run)...${NC}"
aws s3 sync dist/ s3://$S3_BUCKET_NAME/ --dryrun

# 6. Deploy to S3
echo -e "${BLUE}Deploying to S3...${NC}"
aws s3 sync dist/ s3://$S3_BUCKET_NAME/ --delete --region "${AWS_REGION}"
echo -e "${GREEN}✅ Deployed to S3 bucket: ${S3_BUCKET_NAME}${NC}"

# 7. Invalidate CloudFront cache
echo -e "${BLUE}Invalidating CloudFront cache...${NC}"
aws cloudfront create-invalidation --distribution-id "${CLOUDFRONT_DIST_ID}" --paths "/*" --region "${AWS_REGION}"
echo -e "${GREEN}✅ CloudFront cache invalidation initiated${NC}"

# 8. Final instructions
CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution --id "${CLOUDFRONT_DIST_ID}" --query "Distribution.DomainName" --output text --region "${AWS_REGION}" 2>/dev/null || echo "your-cloudfront-domain")
echo -e "\n${YELLOW}Test your app at: https://${CLOUDFRONT_DOMAIN}/${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${BLUE}==============================================${NC}"
