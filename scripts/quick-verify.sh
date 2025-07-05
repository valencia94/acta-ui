#!/bin/bash
# Simple verification script for the surgical intervention
set -e

echo "🧪 ACTA-UI Fix Verification"
echo "=========================="

API_ID="q2b9avfwv5"
REGION="us-east-2"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"
DIST_ID="EPQU7PVDLQXUA"

echo ""
echo "1. Testing API Gateway CORS..."
echo "------------------------------"

# Test CORS on health endpoint
echo "Testing OPTIONS /health:"
CORS_RESPONSE=$(curl -s -H "Origin: $ORIGIN" -X OPTIONS \
  "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health" \
  -w "HTTP_CODE:%{http_code}" -o /tmp/cors_response.txt)

HTTP_CODE=$(echo "$CORS_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
echo "HTTP Status: $HTTP_CODE"

if [ -f /tmp/cors_response.txt ]; then
  echo "Response: $(cat /tmp/cors_response.txt)"
fi

# Check for CORS headers
echo "Checking CORS headers:"
curl -s -I -H "Origin: $ORIGIN" -X OPTIONS \
  "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health" | \
  grep -i "access-control" || echo "No CORS headers found"

echo ""
echo "2. Testing CloudFront Configuration..."
echo "------------------------------------"

# Check origin request policy
POLICY_ID=$(aws cloudfront get-distribution --id "$DIST_ID" \
  --query 'Distribution.DistributionConfig.DefaultCacheBehavior.OriginRequestPolicyId' \
  --output text)

if [ "$POLICY_ID" != "None" ] && [ -n "$POLICY_ID" ]; then
  echo "✅ Origin Request Policy applied: $POLICY_ID"
  
  # Get policy details
  POLICY_NAME=$(aws cloudfront get-origin-request-policy --id "$POLICY_ID" \
    --query 'OriginRequestPolicy.OriginRequestPolicyConfig.Name' \
    --output text 2>/dev/null || echo "Unknown")
  echo "Policy Name: $POLICY_NAME"
else
  echo "❌ No Origin Request Policy found"
fi

echo ""
echo "3. Testing Full Request Flow..."
echo "------------------------------"

# Test CloudFront endpoint
echo "Testing CloudFront access:"
CF_RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}" -o /tmp/cf_response.txt "$ORIGIN/")
CF_HTTP_CODE=$(echo "$CF_RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d: -f2)
echo "CloudFront HTTP Status: $CF_HTTP_CODE"

if [ "$CF_HTTP_CODE" = "200" ]; then
  echo "✅ CloudFront serving content"
else
  echo "⚠️  CloudFront returned: $CF_HTTP_CODE"
fi

echo ""
echo "4. Summary..."
echo "------------"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ API Gateway CORS: Working"
elif [ "$HTTP_CODE" = "500" ]; then
  echo "⚠️  API Gateway CORS: Internal error (may need integration response fix)"
else
  echo "❌ API Gateway CORS: Failed ($HTTP_CODE)"
fi

if [ "$POLICY_ID" != "None" ] && [ -n "$POLICY_ID" ]; then
  echo "✅ CloudFront Headers: Policy applied"
else
  echo "❌ CloudFront Headers: No policy"
fi

if [ "$CF_HTTP_CODE" = "200" ]; then
  echo "✅ Frontend Access: Working"
else
  echo "❌ Frontend Access: Issues detected"
fi

echo ""
echo "🔍 Manual Testing Steps:"
echo "1. Open: $ORIGIN"
echo "2. Login with Cognito"
echo "3. Check browser console for CORS errors"
echo ""

# Cleanup
rm -f /tmp/cors_response.txt /tmp/cf_response.txt
