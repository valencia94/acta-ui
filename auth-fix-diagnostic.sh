#!/bin/bash
# auth-fix-diagnostic.sh - Script to diagnose and fix authentication issues
# Run this script to test the authentication flow and API access

set -e

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 ACTA UI Authentication Diagnostic${NC}"
echo -e "${BLUE}======================================${NC}"

# 1. Check if S3 bucket exists
S3_BUCKET="acta-ui-frontend-prod"
echo -e "${BLUE}📦 Checking S3 bucket...${NC}"
if aws s3 ls "s3://$S3_BUCKET" &>/dev/null; then
  echo -e "${GREEN}✅ S3 bucket '$S3_BUCKET' exists${NC}"
else
  echo -e "${RED}❌ S3 bucket '$S3_BUCKET' does not exist or is not accessible${NC}"
  echo -e "${YELLOW}⚠️  Deployment will fail without proper S3 access${NC}"
fi

# 2. Check CloudFront distribution
CLOUDFRONT_ID="D7T9X3J66YD8K"
echo -e "\n${BLUE}☁️  Checking CloudFront distribution...${NC}"
if aws cloudfront get-distribution --id "$CLOUDFRONT_ID" &>/dev/null; then
  echo -e "${GREEN}✅ CloudFront distribution '$CLOUDFRONT_ID' exists${NC}"
else
  echo -e "${RED}❌ CloudFront distribution '$CLOUDFRONT_ID' does not exist or is not accessible${NC}"
  echo -e "${YELLOW}⚠️  Deployment will not work with incorrect CloudFront distribution${NC}"
fi

# 3. Check API Gateway and CORS
echo -e "\n${BLUE}🌐 Checking API Gateway endpoints...${NC}"
API_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
HEALTH_URL="$API_URL/health"

echo -e "${BLUE}   Testing health endpoint with CORS...${NC}"
CORS_HEADERS=$(curl -s -I -X OPTIONS "$HEALTH_URL" -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: Authorization")

if echo "$CORS_HEADERS" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "${GREEN}✅ CORS headers are correctly configured${NC}"
  echo -e "${GREEN}   Headers: $(echo "$CORS_HEADERS" | grep -i "Access-Control-Allow-" | sed 's/^/     /')${NC}"
else
  echo -e "${RED}❌ CORS headers missing${NC}"
  echo -e "${YELLOW}⚠️  Authentication may fail due to CORS issues${NC}"
fi

# 4. Check Cognito User Pool status
echo -e "\n${BLUE}🔐 Checking Cognito User Pool...${NC}"
USER_POOL_ID="us-east-2_FyHLtOhiY"
APP_CLIENT_ID="dshos5iou44tuach7ta3ici5m"

if aws cognito-idp describe-user-pool --user-pool-id "$USER_POOL_ID" &>/dev/null; then
  echo -e "${GREEN}✅ Cognito User Pool '$USER_POOL_ID' exists${NC}"
  
  # Check if our test user exists
  TEST_USER="christian.valencia@ikusi.com"
  if aws cognito-idp admin-get-user --user-pool-id "$USER_POOL_ID" --username "$TEST_USER" &>/dev/null; then
    echo -e "${GREEN}✅ Test user '$TEST_USER' exists${NC}"
  else
    echo -e "${RED}❌ Test user '$TEST_USER' not found${NC}"
    echo -e "${YELLOW}⚠️  Tests will fail without proper test user${NC}"
  fi
else
  echo -e "${RED}❌ Cognito User Pool not found or not accessible${NC}"
  echo -e "${YELLOW}⚠️  Authentication will fail${NC}"
fi

# 5. Check JWT token handling in code
echo -e "\n${BLUE}📋 Checking JWT token handling...${NC}"
JWT_HANDLING=$(grep -r "headers.set('Authorization'" --include="*.ts" --include="*.js" src/)

echo -e "${BLUE}   Current JWT handling in code:${NC}"
echo "$JWT_HANDLING" | sed 's/^/     /'

echo -e "\n${BLUE}🔧 Recommended fixes:${NC}"
echo -e "${GREEN}1. Set Authorization header WITHOUT 'Bearer' prefix${NC}"
echo -e "${GREEN}2. Ensure token is obtained from fetchAuthSession()${NC}"
echo -e "${GREEN}3. Use 'forceRefresh: true' to avoid stale tokens${NC}"
echo -e "${GREEN}4. Make sure deploy-production.sh uses correct S3 bucket and CloudFront ID${NC}"

echo -e "\n${BLUE}🚀 Ready to deploy?${NC}"
echo -e "${GREEN}Run: ./deploy-production.sh${NC}"
