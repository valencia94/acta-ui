#!/bin/bash

# 🚧 ACTA-UI S3 DEPLOYMENT AUDIT SCRIPT
# Validates that deployed files in S3 match expected Vite SPA deployment

# Configuration
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"
LIVE_URL="https://d7t9x3j66yd8k.cloudfront.net"

echo "🚧 ACTA-UI S3 DEPLOYMENT AUDIT – AWS PRODUCTION"
echo "================================================"
echo "S3 Bucket: $S3_BUCKET"
echo "Region: $AWS_REGION"
echo "CloudFront ID: $CLOUDFRONT_DISTRIBUTION_ID"
echo "Live URL: $LIVE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if file exists in S3
check_s3_file() {
    local file_path="$1"
    local description="$2"
    local min_size="${3:-0}"
    
    echo -n "Checking $description..."
    
    if aws s3 ls "s3://$S3_BUCKET/$file_path" --region "$AWS_REGION" > /dev/null 2>&1; then
        # Get file size
        local file_info=$(aws s3 ls "s3://$S3_BUCKET/$file_path" --region "$AWS_REGION")
        local file_size=$(echo "$file_info" | awk '{print $3}')
        
        if [ "$file_size" -ge "$min_size" ]; then
            echo -e " ${GREEN}✅ PASS${NC} (${file_size} bytes)"
            return 0
        else
            echo -e " ${RED}❌ FAIL${NC} (${file_size} bytes, expected >= ${min_size})"
            return 1
        fi
    else
        echo -e " ${RED}❌ FAIL${NC} (file not found)"
        return 1
    fi
}

# Function to check if directory exists and has files
check_s3_directory() {
    local dir_path="$1"
    local description="$2"
    
    echo -n "Checking $description..."
    
    local file_count=$(aws s3 ls "s3://$S3_BUCKET/$dir_path" --region "$AWS_REGION" --recursive | wc -l)
    
    if [ "$file_count" -gt 0 ]; then
        echo -e " ${GREEN}✅ PASS${NC} ($file_count files)"
        return 0
    else
        echo -e " ${RED}❌ FAIL${NC} (directory empty or not found)"
        return 1
    fi
}

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=5

echo "🔍 S3 BUCKET VALIDATION"
echo "----------------------"

# 1. Check index.html exists at root
if check_s3_file "index.html" "index.html at bucket root"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

# 2. Check aws-exports.js exists and is 3KB+
if check_s3_file "aws-exports.js" "aws-exports.js (3KB+ size)" 3072; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

# 3. Check assets folder exists with JS/CSS chunks
if check_s3_directory "assets/" "assets/ folder with JS/CSS chunks"; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

# 4. Check 404.html exists (create from index.html if missing)
echo -n "Checking 404.html file..."
if aws s3 ls "s3://$S3_BUCKET/404.html" --region "$AWS_REGION" > /dev/null 2>&1; then
    echo -e " ${GREEN}✅ PASS${NC} (exists)"
    ((TESTS_PASSED++))
else
    echo -e " ${YELLOW}⚠️ MISSING${NC} - Creating from index.html..."
    
    # Copy index.html to 404.html
    if aws s3 cp "s3://$S3_BUCKET/index.html" "s3://$S3_BUCKET/404.html" --region "$AWS_REGION"; then
        echo -e " ${GREEN}✅ FIXED${NC} (404.html created)"
        ((TESTS_PASSED++))
    else
        echo -e " ${RED}❌ FAIL${NC} (could not create 404.html)"
        ((TESTS_FAILED++))
    fi
fi

# 5. Check file timestamps (should be recent)
echo -n "Checking file timestamps..."
index_timestamp=$(aws s3 ls "s3://$S3_BUCKET/index.html" --region "$AWS_REGION" | awk '{print $1, $2}')
current_date=$(date '+%Y-%m-%d')

if [[ "$index_timestamp" == *"$current_date"* ]]; then
    echo -e " ${GREEN}✅ PASS${NC} (files from today: $index_timestamp)"
    ((TESTS_PASSED++))
else
    echo -e " ${YELLOW}⚠️ WARNING${NC} (files from: $index_timestamp, not today)"
    ((TESTS_FAILED++))
fi

echo ""
echo "📊 AUDIT SUMMARY"
echo "==============="
echo "Tests Passed: $TESTS_PASSED/$TOTAL_TESTS"
echo "Tests Failed: $TESTS_FAILED/$TOTAL_TESTS"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All S3 deployment checks PASSED!${NC}"
    
    echo ""
    echo "🌐 Running CloudFront invalidation..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    echo "🔄 CloudFront invalidation created: $INVALIDATION_ID"
    
    echo ""
    echo "🧪 SMOKE TEST RECOMMENDATIONS"
    echo "============================="
    echo "1. Open: $LIVE_URL"
    echo "2. Test route: $LIVE_URL/login"
    echo "3. Test route: $LIVE_URL/dashboard"
    echo "4. Check DevTools > Sources panel for:"
    echo "   - index.html"
    echo "   - main.tsx"
    echo "   - assets/ folder with chunks"
    
    exit 0
else
    echo -e "${RED}❌ S3 deployment audit FAILED!${NC}"
    echo ""
    echo "🔧 ISSUES TO FIX:"
    echo "=================="
    
    if ! aws s3 ls "s3://$S3_BUCKET/index.html" --region "$AWS_REGION" > /dev/null 2>&1; then
        echo "- index.html missing from S3 bucket root"
    fi
    
    if ! aws s3 ls "s3://$S3_BUCKET/aws-exports.js" --region "$AWS_REGION" > /dev/null 2>&1; then
        echo "- aws-exports.js missing from S3 bucket"
    fi
    
    local assets_count=$(aws s3 ls "s3://$S3_BUCKET/assets/" --region "$AWS_REGION" --recursive | wc -l)
    if [ "$assets_count" -eq 0 ]; then
        echo "- assets/ folder missing or empty"
    fi
    
    echo ""
    echo "🚀 SUGGESTED FIXES:"
    echo "=================="
    echo "1. Run deployment script: ./deploy-to-s3-cloudfront.sh"
    echo "2. Check build process: pnpm run build"
    echo "3. Verify aws-exports.js is copied correctly"
    echo "4. Re-run this audit script"
    
    exit 1
fi