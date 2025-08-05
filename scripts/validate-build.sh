#!/bin/bash

# 🔍 ACTA-UI BUILD VALIDATION SCRIPT
# Validates local build output matches S3 deployment requirements

echo "🔍 ACTA-UI BUILD VALIDATION SCRIPT"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to check file exists
check_file() {
    local file_path="$1"
    local description="$2"
    local min_size="${3:-0}"
    
    echo -n "Checking $description..."
    
    if [ -f "$file_path" ]; then
        local file_size=$(stat -c%s "$file_path" 2>/dev/null || stat -f%z "$file_path" 2>/dev/null || echo "0")
        
        if [ "$file_size" -ge "$min_size" ]; then
            echo -e " ${GREEN}✅ PASS${NC} (${file_size} bytes)"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e " ${RED}❌ FAIL${NC} (${file_size} bytes, expected >= ${min_size})"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e " ${RED}❌ FAIL${NC} (file not found)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to check directory has files
check_directory() {
    local dir_path="$1"
    local description="$2"
    local pattern="${3:-*}"
    
    echo -n "Checking $description..."
    
    if [ -d "$dir_path" ]; then
        local file_count=$(find "$dir_path" -name "$pattern" -type f | wc -l)
        
        if [ "$file_count" -gt 0 ]; then
            echo -e " ${GREEN}✅ PASS${NC} ($file_count files)"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e " ${RED}❌ FAIL${NC} (directory empty)"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e " ${RED}❌ FAIL${NC} (directory not found)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Check if we have a dist directory
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ No dist directory found. Running build...${NC}"
    
    # Try to build
    if command -v pnpm >/dev/null 2>&1; then
        echo "Building with pnpm..."
        pnpm run build
    elif command -v npm >/dev/null 2>&1; then
        echo "Building with npm..."
        npm run build
    else
        echo -e "${RED}❌ No package manager found. Please install pnpm or npm.${NC}"
        exit 1
    fi
fi

echo ""
echo "📦 VALIDATING BUILD OUTPUT"
echo "========================="

# 1. Check index.html exists in dist
check_file "dist/index.html" "dist/index.html"

# 2. Check aws-exports.js exists and is 3KB+
if [ -f "dist/aws-exports.js" ]; then
    check_file "dist/aws-exports.js" "dist/aws-exports.js (3KB+ size)" 3072
elif [ -f "public/aws-exports.js" ]; then
    echo -e "${YELLOW}⚠️ aws-exports.js found in public/, copying to dist...${NC}"
    cp "public/aws-exports.js" "dist/aws-exports.js"
    check_file "dist/aws-exports.js" "dist/aws-exports.js (copied from public)"
else
    echo -e "${RED}❌ aws-exports.js not found in dist/ or public/${NC}"
    ((TESTS_FAILED++))
fi

# 3. Check assets directory with JS chunks
check_directory "dist/assets" "dist/assets/ with JS chunks" "*.js"

# 4. Check assets directory with CSS chunks  
check_directory "dist/assets" "dist/assets/ with CSS chunks" "*.css"

# 5. Check if 404.html exists (create if missing)
if [ -f "dist/404.html" ]; then
    check_file "dist/404.html" "dist/404.html"
else
    echo -e "${YELLOW}⚠️ 404.html missing, creating from index.html...${NC}"
    if [ -f "dist/index.html" ]; then
        cp "dist/index.html" "dist/404.html"
        check_file "dist/404.html" "dist/404.html (created from index.html)"
    else
        echo -e "${RED}❌ Cannot create 404.html - index.html missing${NC}"
        ((TESTS_FAILED++))
    fi
fi

echo ""
echo "🔍 VALIDATING BUILD CONTENT"
echo "=========================="

# Check document title
if [ -f "dist/index.html" ]; then
    echo -n "Checking document title..."
    if grep -q "Ikusi · Acta Platform" "dist/index.html"; then
        echo -e " ${GREEN}✅ PASS${NC} (correct title)"
        ((TESTS_PASSED++))
    else
        echo -e " ${RED}❌ FAIL${NC} (incorrect title)"
        ((TESTS_FAILED++))
    fi
fi

# Check production API URL in build
echo -n "Checking production API URL in build..."
if find dist/assets -name "*.js" -exec grep -l "q2b9avfwv5.execute-api.us-east-2.amazonaws.com" {} \; 2>/dev/null | head -1 > /dev/null; then
    echo -e " ${GREEN}✅ PASS${NC} (production API found)"
    ((TESTS_PASSED++))
else
    echo -e " ${YELLOW}⚠️ WARNING${NC} (production API URL not found in assets)"
    ((TESTS_FAILED++))
fi

# Check no test data in build
echo -n "Checking for test data in build..."
if grep -r "test-project\|mock-project" dist/ 2>/dev/null > /dev/null; then
    echo -e " ${RED}❌ FAIL${NC} (test data found)"
    ((TESTS_FAILED++))
else
    echo -e " ${GREEN}✅ PASS${NC} (no test data)"
    ((TESTS_PASSED++))
fi

# Check aws-exports.js content
if [ -f "dist/aws-exports.js" ]; then
    echo -n "Validating aws-exports.js content..."
    
    # Check for required AWS configuration
    if grep -q "us-east-2_FyHLtOhiY" "dist/aws-exports.js" && \
       grep -q "dshos5iou44tuach7ta3ici5m" "dist/aws-exports.js" && \
       grep -q "d7t9x3j66yd8k.cloudfront.net" "dist/aws-exports.js"; then
        echo -e " ${GREEN}✅ PASS${NC} (valid configuration)"
        ((TESTS_PASSED++))
    else
        echo -e " ${RED}❌ FAIL${NC} (invalid configuration)"
        ((TESTS_FAILED++))
    fi
fi

echo ""
echo "📊 BUILD VALIDATION SUMMARY" 
echo "=========================="
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Build validation PASSED! Ready for S3 deployment.${NC}"
    
    echo ""
    echo "📋 BUILD OUTPUT SUMMARY"
    echo "======================"
    echo "✅ index.html: $(stat -c%s dist/index.html 2>/dev/null || stat -f%z dist/index.html 2>/dev/null) bytes"
    
    if [ -f "dist/aws-exports.js" ]; then
        echo "✅ aws-exports.js: $(stat -c%s dist/aws-exports.js 2>/dev/null || stat -f%z dist/aws-exports.js 2>/dev/null) bytes"
    fi
    
    if [ -f "dist/404.html" ]; then
        echo "✅ 404.html: $(stat -c%s dist/404.html 2>/dev/null || stat -f%z dist/404.html 2>/dev/null) bytes"
    fi
    
    js_count=$(find dist/assets -name "*.js" -type f | wc -l)
    css_count=$(find dist/assets -name "*.css" -type f | wc -l)
    echo "✅ Assets: $js_count JS files, $css_count CSS files"
    
    echo ""
    echo "🚀 NEXT STEPS"
    echo "============"
    echo "1. Run S3 deployment: ./scripts/s3-deployment-audit.sh"
    echo "2. Or deploy with: ./deploy-to-s3-cloudfront.sh"
    echo "3. Test live site: https://d7t9x3j66yd8k.cloudfront.net"
    
    exit 0
else
    echo -e "${RED}❌ Build validation FAILED!${NC}"
    
    echo ""
    echo "🔧 ISSUES TO FIX"
    echo "==============="
    
    if [ ! -f "dist/index.html" ]; then
        echo "- index.html missing from dist/"
    fi
    
    if [ ! -f "dist/aws-exports.js" ] && [ ! -f "public/aws-exports.js" ]; then
        echo "- aws-exports.js missing from both dist/ and public/"
    fi
    
    if [ ! -d "dist/assets" ] || [ $(find dist/assets -name "*.js" -type f | wc -l) -eq 0 ]; then
        echo "- assets/ directory missing or no JS files"
    fi
    
    echo ""
    echo "🛠️ SUGGESTED FIXES"
    echo "=================="
    echo "1. Check vite.config.ts build settings"
    echo "2. Ensure aws-exports.js is in public/ directory"
    echo "3. Verify all source files are properly structured"
    echo "4. Re-run: pnpm run build"
    
    exit 1
fi