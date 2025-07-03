#!/bin/bash

# Comprehensive CORS Test - Debug what's happening
echo "🔍 ACTA-UI CORS Diagnostic Test"
echo "==============================="
echo ""

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "📋 Configuration:"
echo "   API Base: $API_BASE"
echo "   Origin: $ORIGIN"
echo ""

# Test 1: Basic connectivity
echo "1️⃣ Basic API Connectivity Test"
echo "------------------------------"
echo -n "Health endpoint GET request: "
if response=$(curl -s -w "%{http_code}" "$API_BASE/health" -o /tmp/health_response.txt 2>/dev/null); then
    http_code="${response: -3}"
    echo "HTTP $http_code"
    if [[ "$http_code" == "200" ]]; then
        echo "   ✅ API is accessible"
    else
        echo "   ⚠️  Unexpected status code"
    fi
else
    echo "   ❌ Connection failed"
fi
echo ""

# Test 2: OPTIONS request (CORS preflight)
echo "2️⃣ CORS Preflight Test (OPTIONS)"
echo "--------------------------------"
echo "Testing OPTIONS request to /health..."

# Capture both headers and status
temp_file="/tmp/cors_test_output.txt"
curl -X OPTIONS "$API_BASE/health" \
    -H "Origin: $ORIGIN" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Authorization" \
    -s -D "$temp_file" -o /dev/null 2>/dev/null

if [[ -f "$temp_file" ]]; then
    echo "Raw response headers:"
    cat "$temp_file"
    echo ""
    
    # Check specific CORS headers
    echo "CORS Headers Analysis:"
    echo "----------------------"
    
    if grep -q "Access-Control-Allow-Origin" "$temp_file"; then
        origin_header=$(grep "Access-Control-Allow-Origin" "$temp_file" | tr -d '\r')
        echo "✅ Allow-Origin: $origin_header"
        if [[ "$origin_header" == *"$ORIGIN"* ]]; then
            echo "   ✅ Correct origin configured"
        else
            echo "   ❌ Wrong origin (should be $ORIGIN)"
        fi
    else
        echo "❌ Access-Control-Allow-Origin: MISSING"
    fi
    
    if grep -q "Access-Control-Allow-Methods" "$temp_file"; then
        methods_header=$(grep "Access-Control-Allow-Methods" "$temp_file" | tr -d '\r')
        echo "✅ Allow-Methods: $methods_header"
    else
        echo "❌ Access-Control-Allow-Methods: MISSING"
    fi
    
    if grep -q "Access-Control-Allow-Headers" "$temp_file"; then
        headers_header=$(grep "Access-Control-Allow-Headers" "$temp_file" | tr -d '\r')
        echo "✅ Allow-Headers: $headers_header"
        if [[ "$headers_header" == *"Authorization"* ]]; then
            echo "   ✅ Authorization header allowed"
        else
            echo "   ❌ Authorization header NOT allowed"
        fi
    else
        echo "❌ Access-Control-Allow-Headers: MISSING"
    fi
    
    if grep -q "Access-Control-Allow-Credentials" "$temp_file"; then
        creds_header=$(grep "Access-Control-Allow-Credentials" "$temp_file" | tr -d '\r')
        echo "✅ Allow-Credentials: $creds_header"
        if [[ "$creds_header" == *"true"* ]]; then
            echo "   ✅ Credentials enabled"
        else
            echo "   ❌ Credentials not enabled"
        fi
    else
        echo "❌ Access-Control-Allow-Credentials: MISSING"
    fi
    
    rm -f "$temp_file"
else
    echo "❌ No response received from OPTIONS request"
fi

echo ""
echo "3️⃣ Critical Endpoints Test"
echo "--------------------------"

endpoints=(
    "/health"
    "/pm-manager/all-projects"
    "/pm-manager/test@example.com"
)

for endpoint in "${endpoints[@]}"; do
    echo "Testing: $endpoint"
    http_code=$(curl -X OPTIONS "$API_BASE$endpoint" \
        -H "Origin: $ORIGIN" \
        -s -w "%{http_code}" -o /dev/null 2>/dev/null)
    
    if [[ "$http_code" == "200" ]]; then
        echo "   ✅ OPTIONS returns 200"
    elif [[ "$http_code" == "404" ]]; then
        echo "   ❌ 404 - OPTIONS method not configured"
    elif [[ "$http_code" == "403" ]]; then
        echo "   ❌ 403 - OPTIONS method forbidden"
    else
        echo "   ❌ HTTP $http_code"
    fi
done

echo ""
echo "🏁 DIAGNOSIS COMPLETE"
echo "===================="
echo ""
echo "💡 If CORS headers are missing, the Integration Response"
echo "   header mappings need to be configured in API Gateway."
echo ""
echo "🔧 If OPTIONS methods return 404, they need to be created first."
