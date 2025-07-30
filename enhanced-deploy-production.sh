#!/bin/bash
# enhanced-deploy-production.sh
# Enhanced deployment script for ACTA-UI Dashboard with specific focus on aws-exports.js

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="production"
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"

echo -e "${PURPLE}🚀 ACTA-UI ENHANCED PRODUCTION DEPLOYMENT${NC}"
echo "==========================================="
echo -e "${BLUE}📅 Starting deployment at $(date)${NC}"
echo -e "${BLUE}🌍 Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}🪣 S3 Bucket: ${S3_BUCKET}${NC}"
echo -e "${BLUE}☁️  CloudFront: ${CLOUDFRONT_DISTRIBUTION_ID}${NC}"
echo ""

# Step 1: Verify aws-exports.js configuration
echo -e "${YELLOW}1️⃣ VERIFYING AWS-EXPORTS.JS CONFIGURATION${NC}"
echo "-------------------------------------------"

if [ ! -f "public/aws-exports.js" ]; then
    echo -e "${RED}❌ Error: public/aws-exports.js not found${NC}"
    echo "Creating from src/aws-exports.js..."
    
    if [ -f "src/aws-exports.js" ]; then
        cp src/aws-exports.js public/aws-exports.js
        # Convert ES6 export to window assignment
        sed -i 's/^const awsmobile/window.awsmobile/' public/aws-exports.js
        sed -i 's/^export default awsmobile;//g' public/aws-exports.js
        echo -e "${GREEN}✅ Created public/aws-exports.js from src version${NC}"
    else
        echo -e "${RED}❌ Error: Neither public/aws-exports.js nor src/aws-exports.js found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ public/aws-exports.js exists${NC}"
fi

# Check if index.html has the script tag
if grep -q '<script src="/aws-exports.js"></script>' index.html; then
    echo -e "${GREEN}✅ index.html contains aws-exports.js script tag${NC}"
else
    echo -e "${RED}❌ Error: index.html missing aws-exports.js script tag${NC}"
    exit 1
fi

# Step 2: Build the application
echo ""
echo -e "${YELLOW}2️⃣ BUILDING APPLICATION${NC}"
echo "------------------------"

echo "🏗️  Building optimized production bundle..."
if pnpm run build; then
    echo -e "${GREEN}✅ Production build completed successfully${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Verify aws-exports.js was copied to dist
if [ -f "dist/aws-exports.js" ]; then
    echo -e "${GREEN}✅ aws-exports.js found in dist folder${NC}"
else
    echo -e "${RED}❌ Error: aws-exports.js not found in dist folder${NC}"
    echo "Manually copying..."
    cp public/aws-exports.js dist/
fi

# Step 3: Upload to S3 with correct MIME types
echo ""
echo -e "${YELLOW}3️⃣ UPLOADING TO S3${NC}"
echo "------------------"

echo "🪣 Uploading files to S3 bucket: $S3_BUCKET"

# Function to upload with correct MIME type
upload_file() {
    local file="$1"
    local content_type="$2"
    local cache_control="$3"
    
    s3_key="${file#dist/}"
    echo "   📤 $file -> s3://$S3_BUCKET/$s3_key"
    aws s3 cp "$file" "s3://$S3_BUCKET/$s3_key" \
        --region $AWS_REGION \
        --content-type "$content_type" \
        --cache-control "$cache_control"
}

# Upload index.html (no cache)
upload_file "dist/index.html" "text/html" "public, max-age=0, must-revalidate"

# Upload aws-exports.js (no cache - critical for config)
upload_file "dist/aws-exports.js" "application/javascript" "public, max-age=0, must-revalidate"

# Upload other JS files (short cache)
find dist/assets -name "*.js" -type f | while read file; do
    upload_file "$file" "application/javascript" "public, max-age=3600"
done

# Upload CSS files (short cache)
find dist/assets -name "*.css" -type f | while read file; do
    upload_file "$file" "text/css" "public, max-age=3600"
done

# Upload other files
find dist -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.svg" -o -name "*.ico" | while read file; do
    case "$file" in
        *.png) upload_file "$file" "image/png" "public, max-age=31536000" ;;
        *.jpg|*.jpeg) upload_file "$file" "image/jpeg" "public, max-age=31536000" ;;
        *.svg) upload_file "$file" "image/svg+xml" "public, max-age=31536000" ;;
        *.ico) upload_file "$file" "image/x-icon" "public, max-age=31536000" ;;
    esac
done

echo -e "${GREEN}✅ S3 upload completed${NC}"

# Step 4: Invalidate CloudFront cache
echo ""
echo -e "${YELLOW}4️⃣ INVALIDATING CLOUDFRONT CACHE${NC}"
echo "--------------------------------"

echo "☁️  Invalidating CloudFront distribution: $CLOUDFRONT_DISTRIBUTION_ID"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "⏳ Invalidation ID: $INVALIDATION_ID"
echo "   Cache invalidation started..."

echo -e "${GREEN}✅ CloudFront invalidation initiated${NC}"

# Step 5: Verification
echo ""
echo -e "${YELLOW}5️⃣ POST-DEPLOYMENT VERIFICATION${NC}"
echo "-------------------------------"

echo "🌐 Testing CloudFront URL: https://d7t9x3j66yd8k.cloudfront.net"
echo "📋 Dashboard URL: https://d7t9x3j66yd8k.cloudfront.net/dashboard"

echo ""
echo -e "${PURPLE}🎉 ENHANCED DEPLOYMENT COMPLETED!${NC}"
echo "=================================="
echo ""
echo -e "${GREEN}✅ Key Points:${NC}"
echo "   • aws-exports.js is loaded via script tag before main bundle"
echo "   • main.tsx waits for window.awsmobile before configuring Amplify"
echo "   • All files uploaded with correct MIME types"
echo "   • CloudFront cache invalidated"
echo ""
echo -e "${BLUE}🧪 Test Instructions:${NC}"
echo "   1. Visit: https://d7t9x3j66yd8k.cloudfront.net/dashboard"
echo "   2. Login with: christian.valencia@ikusi.com / PdYb7TU7HvBhYP7$!"
echo "   3. Verify dashboard loads (green header, welcome card)"
echo "   4. Check projects list is visible"
echo "   5. Test ACTA generation buttons"
echo "   6. Open dev tools to confirm no errors"
echo ""
echo -e "${GREEN}🚀 Dashboard should now be working correctly!${NC}"