#!/bin/bash

# 🧪 ACTA-UI LIVE SITE SMOKE TEST
# Tests the deployed site functionality and routes

LIVE_URL="https://d7t9x3j66yd8k.cloudfront.net"

echo "🧪 ACTA-UI LIVE SITE SMOKE TEST"
echo "==============================="
echo "Testing: $LIVE_URL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test HTTP response
test_url() {
    local url="$1"
    local description="$2"
    local expected_status="${3:-200}"
    
    echo -n "Testing $description..."
    
    # Use curl to test the URL
    local response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo -e "\n000")
    local status_code=$(echo "$response" | tail -n1)
    local content=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e " ${GREEN}✅ PASS${NC} (HTTP $status_code)"
        ((TESTS_PASSED++))
        
        # Additional content checks for HTML responses
        if [ "$expected_status" = "200" ] && echo "$content" | grep -q "<!doctype html" 2>/dev/null; then
            echo "  📄 Content: HTML document detected"
            
            # Check for specific elements
            if echo "$content" | grep -q "Ikusi.*Acta Platform" 2>/dev/null; then
                echo "  ✅ Title: Correct application title found"
            else
                echo "  ⚠️ Title: Application title not found in content"
            fi
            
            # Check for React root element
            if echo "$content" | grep -q 'id="root"' 2>/dev/null; then
                echo "  ✅ React: Root element found"
            else
                echo "  ⚠️ React: Root element not found"
            fi
            
            # Check for main script
            if echo "$content" | grep -q "main.tsx\|main.js" 2>/dev/null; then
                echo "  ✅ Script: Main application script found"
            else
                echo "  ⚠️ Script: Main application script not found"
            fi
        fi
        
        return 0
    else
        echo -e " ${RED}❌ FAIL${NC} (HTTP $status_code, expected $expected_status)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test resource availability
test_resource() {
    local url="$1"
    local description="$2"
    
    echo -n "Testing $description..."
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "200" ]; then
        echo -e " ${GREEN}✅ PASS${NC} (HTTP $status_code)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e " ${RED}❌ FAIL${NC} (HTTP $status_code)"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo "🌐 BASIC CONNECTIVITY TESTS"
echo "============================"

# Test main site
test_url "$LIVE_URL" "main site load"

# Test login route
test_url "$LIVE_URL/login" "login route"

# Test dashboard route
test_url "$LIVE_URL/dashboard" "dashboard route"

echo ""
echo "📦 RESOURCE AVAILABILITY TESTS"
echo "==============================="

# Test aws-exports.js
test_resource "$LIVE_URL/aws-exports.js" "aws-exports.js file"

# Test favicon
test_resource "$LIVE_URL/assets/ikusi-logo.png" "favicon/logo"

# Test robots.txt
test_resource "$LIVE_URL/robots.txt" "robots.txt"

echo ""
echo "🔍 ADVANCED CONTENT TESTS"
echo "=========================="

# Test for SPA routing (all routes should return the same index.html)
echo -n "Testing SPA routing consistency..."
main_content=$(curl -s "$LIVE_URL" 2>/dev/null || echo "")
login_content=$(curl -s "$LIVE_URL/login" 2>/dev/null || echo "")

# Remove potential timestamp differences and compare core structure
if [ "${#main_content}" -gt 0 ] && [ "${#login_content}" -gt 0 ]; then
    # Compare the HTML structure (should be identical for SPA)
    main_title=$(echo "$main_content" | grep -o '<title>.*</title>' 2>/dev/null || echo "")
    login_title=$(echo "$login_content" | grep -o '<title>.*</title>' 2>/dev/null || echo "")
    
    if [ "$main_title" = "$login_title" ] && [ -n "$main_title" ]; then
        echo -e " ${GREEN}✅ PASS${NC} (SPA routing working)"
        ((TESTS_PASSED++))
    else
        echo -e " ${YELLOW}⚠️ WARNING${NC} (different content for routes)"
        ((TESTS_FAILED++))
    fi
else
    echo -e " ${RED}❌ FAIL${NC} (could not fetch content)"
    ((TESTS_FAILED++))
fi

# Test 404 handling
echo -n "Testing 404 error handling..."
test_url "$LIVE_URL/nonexistent-route-12345" "404 handling" 200

echo ""
echo "⚡ PERFORMANCE TESTS"
echo "==================="

# Test response time
echo -n "Testing response time..."
response_time=$(curl -s -w "%{time_total}" -o /dev/null "$LIVE_URL" 2>/dev/null || echo "999")

# Convert to milliseconds for easier reading (avoid bc dependency)
response_time_ms=$(echo "$response_time" | awk '{print int($1 * 1000)}')

if [ "$response_time_ms" -lt 3000 ]; then
    echo -e " ${GREEN}✅ PASS${NC} (${response_time_ms}ms)"
    ((TESTS_PASSED++))
elif [ "$response_time_ms" -lt 5000 ]; then
    echo -e " ${YELLOW}⚠️ SLOW${NC} (${response_time_ms}ms)"
    ((TESTS_PASSED++))
else
    echo -e " ${RED}❌ FAIL${NC} (${response_time_ms}ms - too slow)"
    ((TESTS_FAILED++))
fi

# Test content size
echo -n "Testing content size..."
content_length=$(curl -s -w "%{size_download}" -o /dev/null "$LIVE_URL" 2>/dev/null || echo "0")

if [ "$content_length" -gt 1000 ]; then
    echo -e " ${GREEN}✅ PASS${NC} (${content_length} bytes)"
    ((TESTS_PASSED++))
else
    echo -e " ${RED}❌ FAIL${NC} (${content_length} bytes - too small)"
    ((TESTS_FAILED++))
fi

echo ""
echo "📊 SMOKE TEST SUMMARY"
echo "===================="
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All smoke tests PASSED!${NC}"
    echo ""
    echo "✅ Site is responding correctly"
    echo "✅ All routes are accessible"
    echo "✅ Resources are available"
    echo "✅ Performance is acceptable"
    
    echo ""
    echo "🔍 MANUAL VERIFICATION CHECKLIST"
    echo "================================"
    echo "Please manually verify the following:"
    echo ""
    echo "1. 🌐 Open: $LIVE_URL"
    echo "   - Page loads without errors"
    echo "   - Title shows 'Ikusi · Acta Platform'"
    echo ""
    echo "2. 🔐 Test: $LIVE_URL/login"
    echo "   - Login form is visible"
    echo "   - Cognito authentication works"
    echo ""
    echo "3. 📊 Test: $LIVE_URL/dashboard"
    echo "   - Dashboard loads after authentication"
    echo "   - All components render correctly"
    echo ""
    echo "4. 🛠️ DevTools Check:"
    echo "   - Open DevTools > Sources panel"
    echo "   - Verify index.html is present"
    echo "   - Verify main.tsx is in sources"
    echo "   - Verify assets/ folder contains chunks"
    echo "   - No console errors"
    
    exit 0
else
    echo -e "${RED}❌ Smoke tests FAILED!${NC}"
    
    echo ""
    echo "🚨 CRITICAL ISSUES DETECTED"
    echo "=========================="
    
    if ! curl -s "$LIVE_URL" > /dev/null 2>&1; then
        echo "- Site is not accessible"
        echo "- Check CloudFront distribution status"
        echo "- Verify S3 bucket configuration"
    fi
    
    if ! curl -s "$LIVE_URL/aws-exports.js" > /dev/null 2>&1; then
        echo "- aws-exports.js is missing or inaccessible"
        echo "- Check S3 deployment includes this file"
    fi
    
    echo ""
    echo "🛠️ IMMEDIATE ACTIONS REQUIRED"
    echo "============================="
    echo "1. Check CloudFront distribution: EPQU7PVDLQXUA"
    echo "2. Verify S3 bucket contents: acta-ui-frontend-prod"
    echo "3. Run deployment script: ./deploy-to-s3-cloudfront.sh"
    echo "4. Create CloudFront invalidation"
    echo "5. Re-run this smoke test"
    
    exit 1
fi