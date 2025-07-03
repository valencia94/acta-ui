#!/bin/bash

# 🧪 Surgical Fix Verification for Acta-UI Production
# Tests both API Gateway CORS and CloudFront header forwarding

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
CLOUDFRONT_URL="https://d7t9x3j66yd8k.cloudfront.net"
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod"

echo "🧪 SURGICAL FIX VERIFICATION"
echo "API Gateway: $API_ID"
echo "CloudFront: $CLOUDFRONT_URL"
echo "================================================"

echo ""
echo "1️⃣ Testing API Gateway CORS (Direct API call)"
echo "------------------------------------------------"
echo "Testing OPTIONS request to /health endpoint..."

CORS_TEST=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
    -H "Origin: $CLOUDFRONT_URL" \
    -X OPTIONS \
    "$API_URL/health")

echo "Response:"
echo "$CORS_TEST"

# Check if CORS headers are present
if echo "$CORS_TEST" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS headers found in API Gateway response"
else
    echo "❌ CORS headers missing from API Gateway response"
fi

echo ""
echo "2️⃣ Testing CloudFront Distribution Status"
echo "------------------------------------------------"
DIST_STATUS=$(aws cloudfront get-distribution \
    --id "EPQU7PVDLQXUA" \
    --region us-east-1 \
    --query 'Distribution.Status' \
    --output text)

echo "CloudFront Distribution Status: $DIST_STATUS"

if [ "$DIST_STATUS" = "Deployed" ]; then
    echo "✅ CloudFront distribution is deployed and ready"
else
    echo "⏰ CloudFront distribution is still updating... Status: $DIST_STATUS"
    echo "   Wait 10-15 minutes and try again"
fi

echo ""
echo "3️⃣ Testing Production App Load"
echo "------------------------------------------------"
echo "Testing if the production app loads without Cognito errors..."

# Test basic app load
APP_TEST=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" "$CLOUDFRONT_URL")
HTTP_CODE=$(echo "$APP_TEST" | tail -1 | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Production app loads successfully (HTTP 200)"
else
    echo "❌ Production app load failed (HTTP $HTTP_CODE)"
fi

echo ""
echo "4️⃣ Testing Backend Health Check"
echo "------------------------------------------------"
echo "Testing backend health endpoint..."

HEALTH_TEST=$(curl -s -w "\nHTTP_CODE:%{http_code}\n" \
    -H "Origin: $CLOUDFRONT_URL" \
    "$API_URL/health")

HEALTH_CODE=$(echo "$HEALTH_TEST" | tail -1 | cut -d: -f2)

if [ "$HEALTH_CODE" = "200" ]; then
    echo "✅ Backend health check passed (HTTP 200)"
else
    echo "❌ Backend health check failed (HTTP $HEALTH_CODE)"
fi

echo ""
echo "📋 VERIFICATION SUMMARY"
echo "================================================"
echo "API Gateway CORS: $(echo "$CORS_TEST" | grep -q "Access-Control-Allow-Origin" && echo "✅ WORKING" || echo "❌ NEEDS FIX")"
echo "CloudFront Status: $DIST_STATUS"
echo "App Load: $([ "$HTTP_CODE" = "200" ] && echo "✅ WORKING" || echo "❌ NEEDS FIX")"
echo "Backend Health: $([ "$HEALTH_CODE" = "200" ] && echo "✅ WORKING" || echo "❌ NEEDS FIX")"

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Open production app: $CLOUDFRONT_URL"
echo "2. Try to log in with test credentials"
echo "3. Navigate to Admin Dashboard"
echo "4. Test the API calls from dashboard buttons"
echo ""
echo "If any issues persist, check browser console for specific CORS errors."
