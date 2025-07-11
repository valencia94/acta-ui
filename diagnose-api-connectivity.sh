#!/bin/bash

# API Gateway CORS and Connectivity Fix Script
# This script diagnoses and fixes API connectivity issues

set -e

# Configuration
API_BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
FRONTEND_DOMAIN="https://d7t9x3j66yd8k.cloudfront.net"
AWS_REGION="us-east-2"

echo "🔍 Diagnosing API connectivity issues..."
echo "🌐 API Base URL: $API_BASE_URL"
echo "🌐 Frontend Domain: $FRONTEND_DOMAIN"
echo ""

# Test 1: Basic connectivity
echo "📡 Test 1: Basic API connectivity"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/health" || echo "FAILED")
echo "📊 Health endpoint status: $HTTP_STATUS"

if [ "$HTTP_STATUS" = "FAILED" ]; then
    echo "❌ Cannot reach API Gateway at all"
    exit 1
fi

# Test 2: CORS headers
echo ""
echo "📡 Test 2: CORS configuration check"
curl -s -I "$API_BASE_URL/health" | grep -i "access-control" || echo "⚠️ No CORS headers found"

# Test 3: OPTIONS preflight request
echo ""
echo "📡 Test 3: CORS preflight request (OPTIONS)"
OPTIONS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X OPTIONS \
    -H "Origin: $FRONTEND_DOMAIN" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: authorization,content-type" \
    "$API_BASE_URL/health" || echo "FAILED")

echo "📊 OPTIONS request status: $OPTIONS_STATUS"

if [ "$OPTIONS_STATUS" != "200" ] && [ "$OPTIONS_STATUS" != "204" ]; then
    echo "❌ CORS preflight failing - this is likely the root cause"
    echo "🔧 Need to fix API Gateway CORS configuration"
else
    echo "✅ CORS preflight working"
fi

# Test 4: Check specific failing endpoint
echo ""
echo "📡 Test 4: Project extraction endpoint"
PROJECT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$API_BASE_URL/extract-project-place/1000000049842296" || echo "FAILED")
echo "📊 Project endpoint status: $PROJECT_STATUS"

# Test 5: Network connectivity from different angles
echo ""
echo "📡 Test 5: Network diagnostics"
echo "🔍 DNS Resolution:"
nslookup q2b9avfwv5.execute-api.us-east-2.amazonaws.com || echo "⚠️ DNS issues detected"

echo ""
echo "🔍 Ping test:"
ping -c 3 q2b9avfwv5.execute-api.us-east-2.amazonaws.com || echo "⚠️ Ping failed"

# Proposed fixes
echo ""
echo "🔧 PROPOSED FIXES:"
echo "==================="

if [ "$OPTIONS_STATUS" != "200" ] && [ "$OPTIONS_STATUS" != "204" ]; then
    echo "❌ Issue: CORS preflight requests failing"
    echo "🔧 Fix 1: Update API Gateway CORS to allow:"
    echo "   - Origin: $FRONTEND_DOMAIN"
    echo "   - Methods: GET, POST, PUT, DELETE, OPTIONS"  
    echo "   - Headers: authorization, content-type, x-amz-date, x-api-key"
    echo "   - Credentials: true"
    echo ""
    echo "🔧 Fix 2: Ensure all endpoints have CORS enabled"
    echo ""
fi

if [ "$HTTP_STATUS" = "403" ]; then
    echo "⚠️ Issue: API requires authentication"
    echo "🔧 Fix 3: Verify auth token is being sent correctly"
    echo "🔧 Fix 4: Check Cognito token validity"
    echo ""
fi

echo "🔧 Fix 5: Add retry logic and better error handling in frontend"
echo ""

echo "📋 DETAILED DIAGNOSIS COMPLETE"
echo "==============================="

# Create the API Gateway CORS fix command
echo ""
echo "🛠️ AWS CLI command to fix CORS (run manually):"
echo "aws apigateway put-gateway-response \\"
echo "    --rest-api-id 'q2b9avfwv5' \\"
echo "    --response-type DEFAULT_4XX \\"
echo "    --response-parameters '{\"gatewayresponse.header.Access-Control-Allow-Origin\":\"$FRONTEND_DOMAIN\",\"gatewayresponse.header.Access-Control-Allow-Headers\":\"authorization,content-type,x-amz-date,x-api-key\",\"gatewayresponse.header.Access-Control-Allow-Methods\":\"GET,POST,PUT,DELETE,OPTIONS\"}' \\"
echo "    --region $AWS_REGION"
echo ""
echo "aws apigateway put-gateway-response \\"
echo "    --rest-api-id 'q2b9avfwv5' \\"
echo "    --response-type DEFAULT_5XX \\"
echo "    --response-parameters '{\"gatewayresponse.header.Access-Control-Allow-Origin\":\"$FRONTEND_DOMAIN\",\"gatewayresponse.header.Access-Control-Allow-Headers\":\"authorization,content-type,x-amz-date,x-api-key\",\"gatewayresponse.header.Access-Control-Allow-Methods\":\"GET,POST,PUT,DELETE,OPTIONS\"}' \\"
echo "    --region $AWS_REGION"
