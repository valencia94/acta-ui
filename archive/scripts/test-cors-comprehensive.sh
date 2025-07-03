#!/bin/bash

# Comprehensive CORS Test Script
# Tests all critical endpoints for CORS compliance

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🧪 ACTA-UI CORS Comprehensive Test"
echo "=================================="
echo "🌐 API Base: $API_BASE"
echo "🔗 Origin: $ORIGIN"
echo ""

# Test function
test_cors() {
    local endpoint=$1
    local description=$2
    
    echo "🔍 Testing: $description"
    echo "   Endpoint: $endpoint"
    
    # Get HTTP status and CORS headers
    response=$(curl -s -H "Origin: $ORIGIN" -X OPTIONS "$API_BASE$endpoint" -w "HTTP_CODE:%{http_code}")
    http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
    headers=$(echo "$response" | grep -i "access-control")
    
    if [ "$http_code" = "200" ]; then
        echo "   ✅ Status: HTTP $http_code"
        if echo "$response" | grep -q "access-control-allow-origin"; then
            echo "   ✅ CORS: Headers present"
        else
            echo "   ⚠️  CORS: Headers missing"
        fi
    else
        echo "   ❌ Status: HTTP $http_code"
        echo "   ❌ CORS: Failed"
    fi
    echo ""
}

# Test critical endpoints
echo "📋 Testing Core API Endpoints:"
echo ""

test_cors "/pm-manager/all-projects" "All Projects (Admin)"
test_cors "/extract-project-place/1000000049842296" "Extract Project Place"
test_cors "/project-summary/123" "Project Summary"
test_cors "/download-acta/123" "Download Acta"
test_cors "/timeline/123" "Project Timeline"
test_cors "/health" "Health Check"

echo "🎯 Test Summary:"
echo "================"
echo "✅ Critical endpoints should show HTTP 200 with CORS headers"
echo "⚠️  Some endpoints may show 403/500 due to authentication requirements"
echo "❌ CORS failures indicate preflight request issues"
echo ""
echo "📱 Next Step: Test in browser at $ORIGIN"
echo "🔄 If issues persist, check browser console for specific errors"
