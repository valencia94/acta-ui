#!/usr/bin/env bash
set -euo pipefail

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}ACTA-UI Auth Flow Validation Script${NC}"
echo -e "${BLUE}==============================================${NC}"

# Build directory
BUILD_DIR="dist"

if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Error: Build directory '$BUILD_DIR' not found. Run build first.${NC}"
    exit 1
fi

echo -e "\n${BLUE}1. Checking for AWS exports configuration...${NC}"
if [ -f "$BUILD_DIR/aws-exports.js" ]; then
    echo -e "${GREEN}✓ aws-exports.js file found in build${NC}"
else
    echo -e "${YELLOW}⚠️ aws-exports.js file NOT found in build${NC}"
    echo -e "   Copying it from src directory..."
    cp src/aws-exports.js "$BUILD_DIR/"
    echo -e "${GREEN}✓ aws-exports.js file copied to build${NC}"
fi

echo -e "\n${BLUE}2. Checking for key authentication functions...${NC}"
AUTH_FUNCTIONS=("fetchAuthSession" "getAuthToken" "Bearer" "Amplify.configure")
missing_functions=()

for func in "${AUTH_FUNCTIONS[@]}"; do
    if grep -q "$func" "$BUILD_DIR"/* --include="*.js" 2>/dev/null; then
        echo -e "${GREEN}✓ '$func' function found in build${NC}"
    else
        echo -e "${YELLOW}⚠️ '$func' function NOT found in build${NC}"
        missing_functions+=("$func")
    fi
done

echo -e "\n${BLUE}3. Checking for CORS and authentication configurations...${NC}"
if grep -q "credentials.*include" "$BUILD_DIR"/* --include="*.js" 2>/dev/null; then
    echo -e "${GREEN}✓ Credentials mode 'include' found in build${NC}"
else
    echo -e "${YELLOW}⚠️ Credentials mode 'include' NOT found in build${NC}"
    missing_functions+=("credentials:include")
fi

if grep -q "Authorization.*Bearer" "$BUILD_DIR"/* --include="*.js" 2>/dev/null; then
    echo -e "${GREEN}✓ Authorization Bearer token format found in build${NC}"
else
    echo -e "${YELLOW}⚠️ Authorization Bearer token format NOT found in build${NC}"
    missing_functions+=("Authorization:Bearer")
fi

echo -e "\n${BLUE}4. Verification Summary${NC}"
if [ ${#missing_functions[@]} -eq 0 ]; then
    echo -e "${GREEN}✓ All critical authentication functions found in build${NC}"
else
    echo -e "${YELLOW}⚠️ Missing ${#missing_functions[@]} critical functions:${NC}"
    for func in "${missing_functions[@]}"; do
        echo -e "  - $func"
    done
    
    echo -e "\n${YELLOW}Attempting to fix missing functions...${NC}"
    
    # Copy aws-exports.js to build
    if [ ! -f "$BUILD_DIR/aws-exports.js" ]; then
        cp src/aws-exports.js "$BUILD_DIR/"
        echo -e "${GREEN}✓ aws-exports.js copied to build directory${NC}"
    fi
    
    # Deploy will need a manual rebuild with proper imports
    echo -e "${YELLOW}Please add the following imports to src/main.tsx:${NC}"
    echo -e "import '@aws-amplify/ui-react/styles.css';"
    echo -e "import { Amplify } from 'aws-amplify';"
    echo -e "import awsExports from './aws-exports';"
    echo -e "import '@/utils/fetchWrapper';"
    echo -e "Amplify.configure(awsExports);"
fi

echo -e "\n${BLUE}5. Deployment Instructions${NC}"
echo -e "${YELLOW}To deploy this build:${NC}"
echo -e "1. Set environment variables:"
echo -e "   export AWS_REGION=us-east-2"
echo -e "   export S3_BUCKET_NAME=your-bucket-name"
echo -e "   export CLOUDFRONT_DIST_ID=your-cloudfront-id"
echo -e "2. Run deployment script:"
echo -e "   bash scripts/deploy-to-s3.sh"
echo -e "3. Test the deployed application:"
echo -e "   node test-production.js"

echo -e "\n${BLUE}==============================================${NC}"
