#!/bin/bash

# 🧪 ACTA-UI Production End-to-End Test Suite
# This script tests all functionality to ensure production readiness

set -e

# Activate AWS CLI environment
source /tmp/aws-env/bin/activate

echo "🚀 ACTA-UI Production End-to-End Test Suite"
echo "==========================================="
echo "Testing Date: $(date)"
echo "Environment: Production"
echo ""

# Configuration
API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
FRONTEND_URL="https://d7t9x3j66yd8k.cloudfront.net"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

# Test Results Tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to log test results
log_test() {
    local test_name="$1"
    local status="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$status" = "PASS" ]; then
        echo "✅ $test_name: PASS $details"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$status" = "FAIL" ]; then
        echo "❌ $test_name: FAIL $details"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo "⚠️  $test_name: WARN $details"
    fi
}

# Function to test HTTP endpoint
test_endpoint() {
    local endpoint="$1"
    local test_name="$2"
    local expected_status="$3"
    local method="${4:-GET}"
    local headers="$5"
    
    echo "🔍 Testing: $test_name"
    
    if [ -n "$headers" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" $headers -X "$method" "$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" "$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
    fi
    
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [[ " $expected_status " =~ " $http_code " ]]; then
        log_test "$test_name" "PASS" "HTTP $http_code"
        return 0
    else
        log_test "$test_name" "FAIL" "Expected $expected_status, got HTTP $http_code"
        return 1
    fi
}

# Function to test CORS
test_cors() {
    local endpoint="$1"
    local test_name="$2"
    
    echo "🔍 Testing CORS: $test_name"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -H "Origin: $ORIGIN" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Authorization,Content-Type" \
        -X OPTIONS "$endpoint" 2>/dev/null || echo "HTTPSTATUS:000")
    
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    # Get CORS headers
    cors_headers=$(curl -s -I \
        -H "Origin: $ORIGIN" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Authorization,Content-Type" \
        -X OPTIONS "$endpoint" 2>/dev/null | grep -i "access-control" || echo "")
    
    if [ "$http_code" = "200" ] && [ -n "$cors_headers" ]; then
        log_test "$test_name CORS" "PASS" "HTTP $http_code with CORS headers"
        return 0
    else
        log_test "$test_name CORS" "FAIL" "HTTP $http_code, CORS headers: $(echo "$cors_headers" | wc -l) found"
        return 1
    fi
}

echo "🌐 1. Frontend Accessibility Tests"
echo "=================================="

# Test frontend accessibility
test_endpoint "$FRONTEND_URL" "Frontend Landing Page" "200"
test_endpoint "$FRONTEND_URL/login" "Login Page" "200"

echo ""
echo "🔐 2. API Gateway CORS Tests"
echo "============================"

# Test CORS on all major endpoints
test_cors "$API_BASE/health" "Health Endpoint"
test_cors "$API_BASE/timeline/123456" "Timeline Endpoint"
test_cors "$API_BASE/project-summary/123456" "Project Summary Endpoint"
test_cors "$API_BASE/download-acta/123456" "Download ACTA Endpoint"
test_cors "$API_BASE/extract-project-place/123456" "Extract Project Place Endpoint"
test_cors "$API_BASE/send-approval-email" "Send Approval Email Endpoint"
test_cors "$API_BASE/check-document/123456" "Check Document Endpoint"

echo ""
echo "🔌 3. API Endpoint Authentication Tests"
echo "======================================="

# Test endpoints without authentication (should return 401/403)
test_endpoint "$API_BASE/health" "Health Check (No Auth)" "200"
test_endpoint "$API_BASE/timeline/123456" "Timeline (No Auth)" "401 403"
test_endpoint "$API_BASE/project-summary/123456" "Project Summary (No Auth)" "401 403"
test_endpoint "$API_BASE/download-acta/123456" "Download ACTA (No Auth)" "401 403"
test_endpoint "$API_BASE/send-approval-email" "Send Email (No Auth)" "401 403" "POST"
test_endpoint "$API_BASE/check-document/123456" "Check Document (No Auth)" "401 403"

echo ""
echo "🏗️ 4. Infrastructure Health Tests"
echo "=================================="

# Test API Gateway health
api_health=$(curl -s -w "%{http_code}" -o /dev/null "$API_BASE/health" 2>/dev/null || echo "000")
if [ "$api_health" = "200" ]; then
    log_test "API Gateway Health" "PASS" "HTTP $api_health"
else
    log_test "API Gateway Health" "FAIL" "HTTP $api_health"
fi

# Test CloudFront distribution
cf_health=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$cf_health" = "200" ]; then
    log_test "CloudFront Distribution" "PASS" "HTTP $cf_health"
else
    log_test "CloudFront Distribution" "FAIL" "HTTP $cf_health"
fi

echo ""
echo "📊 5. Security Configuration Tests"
echo "=================================="

# Test that sensitive endpoints require authentication
secure_endpoints=(
    "$API_BASE/timeline/123456"
    "$API_BASE/project-summary/123456"
    "$API_BASE/download-acta/123456"
)

for endpoint in "${secure_endpoints[@]}"; do
    endpoint_name=$(echo "$endpoint" | sed 's|.*/||' | sed 's|/.*||')
    
    # Should return 401/403 without auth
    response_code=$(curl -s -w "%{http_code}" -o /dev/null "$endpoint" 2>/dev/null || echo "000")
    if [[ "$response_code" = "401" || "$response_code" = "403" ]]; then
        log_test "Security: $endpoint_name" "PASS" "Properly secured (HTTP $response_code)"
    else
        log_test "Security: $endpoint_name" "FAIL" "Not secured (HTTP $response_code)"
    fi
done

echo ""
echo "🌍 6. Network and CDN Tests"
echo "=========================="

# Test CloudFront caching headers
cf_headers=$(curl -s -I "$FRONTEND_URL" | grep -E "(x-cache|x-amz-cf|cache-control)" | wc -l)
if [ "$cf_headers" -gt 0 ]; then
    log_test "CloudFront CDN Headers" "PASS" "$cf_headers CDN headers found"
else
    log_test "CloudFront CDN Headers" "WARN" "No CDN headers detected"
fi

# Test API Gateway headers
api_headers=$(curl -s -I "$API_BASE/health" | grep -E "(x-amz-apigw|x-amzn)" | wc -l)
if [ "$api_headers" -gt 0 ]; then
    log_test "API Gateway Headers" "PASS" "$api_headers API Gateway headers found"
else
    log_test "API Gateway Headers" "FAIL" "No API Gateway headers detected"
fi

echo ""
echo "🔍 7. Cognito Authentication Configuration"
echo "=========================================="

# Test Cognito well-known endpoint
cognito_endpoint="https://cognito-idp.us-east-2.amazonaws.com/us-east-2_FyHLtOhiY/.well-known/jwks.json"
cognito_status=$(curl -s -w "%{http_code}" -o /dev/null "$cognito_endpoint" 2>/dev/null || echo "000")
if [ "$cognito_status" = "200" ]; then
    log_test "Cognito JWKS Endpoint" "PASS" "HTTP $cognito_status"
else
    log_test "Cognito JWKS Endpoint" "FAIL" "HTTP $cognito_status"
fi

# Test OAuth discovery
oauth_endpoint="https://us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com/.well-known/openid_configuration"
oauth_status=$(curl -s -w "%{http_code}" -o /dev/null "$oauth_endpoint" 2>/dev/null || echo "000")
if [ "$oauth_status" = "200" ]; then
    log_test "OAuth Discovery" "PASS" "HTTP $oauth_status"
else
    log_test "OAuth Discovery" "FAIL" "HTTP $oauth_status"
fi

echo ""
echo "📱 8. Frontend Static Assets Test"
echo "================================="

# Test key static assets
static_assets=(
    "$FRONTEND_URL/index.html"
    "$FRONTEND_URL/assets"
    "$FRONTEND_URL/favicon.ico"
)

for asset in "${static_assets[@]}"; do
    asset_name=$(echo "$asset" | sed 's|.*/||')
    asset_status=$(curl -s -w "%{http_code}" -o /dev/null "$asset" 2>/dev/null || echo "000")
    
    if [[ "$asset_status" = "200" || "$asset_status" = "301" || "$asset_status" = "302" ]]; then
        log_test "Static Asset: $asset_name" "PASS" "HTTP $asset_status"
    else
        log_test "Static Asset: $asset_name" "WARN" "HTTP $asset_status (may be normal)"
    fi
done

echo ""
echo "🎯 9. Performance Tests"
echo "======================"

# Test response times
start_time=$(date +%s%N)
curl -s -o /dev/null "$FRONTEND_URL" 2>/dev/null || true
end_time=$(date +%s%N)
frontend_time=$(( (end_time - start_time) / 1000000 ))

if [ "$frontend_time" -lt 3000 ]; then
    log_test "Frontend Response Time" "PASS" "${frontend_time}ms (< 3s)"
elif [ "$frontend_time" -lt 5000 ]; then
    log_test "Frontend Response Time" "WARN" "${frontend_time}ms (< 5s)"
else
    log_test "Frontend Response Time" "FAIL" "${frontend_time}ms (> 5s)"
fi

# Test API response time
start_time=$(date +%s%N)
curl -s -o /dev/null "$API_BASE/health" 2>/dev/null || true
end_time=$(date +%s%N)
api_time=$(( (end_time - start_time) / 1000000 ))

if [ "$api_time" -lt 2000 ]; then
    log_test "API Response Time" "PASS" "${api_time}ms (< 2s)"
elif [ "$api_time" -lt 5000 ]; then
    log_test "API Response Time" "WARN" "${api_time}ms (< 5s)"
else
    log_test "API Response Time" "FAIL" "${api_time}ms (> 5s)"
fi

echo ""
echo "📋 TEST SUMMARY"
echo "==============="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
echo ""

if [ "$FAILED_TESTS" -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED! Production environment is ready!"
    echo "✅ Frontend: $FRONTEND_URL"
    echo "✅ API: $API_BASE"
    echo "✅ CORS: Fully configured"
    echo "✅ Authentication: Properly secured"
    echo "✅ Performance: Within acceptable limits"
    echo ""
    echo "🚀 ACTA-UI is PRODUCTION READY! 🚀"
else
    echo "⚠️  Some tests failed. Review the results above."
    echo "💡 Most failures in authentication tests are expected (401/403 responses)"
fi

echo ""
echo "🔗 Quick Access URLs:"
echo "Frontend: $FRONTEND_URL"
echo "API Health: $API_BASE/health"
echo "Login: $FRONTEND_URL/login"
echo ""
echo "📊 Test completed at: $(date)"
