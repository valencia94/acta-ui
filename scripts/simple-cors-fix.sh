#!/bin/bash
# Simple CORS fix for health endpoint
set -e

echo "🔧 Simple CORS Fix for Health Endpoint"
echo "======================================"

API_ID="q2b9avfwv5"
RESOURCE_ID="j7z1ti"
REGION="us-east-2"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "Fixing CORS for /health endpoint..."

# Create integration response with CORS headers
aws apigateway put-integration-response \
  --rest-api-id "$API_ID" \
  --resource-id "$RESOURCE_ID" \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters "{
    \"method.response.header.Access-Control-Allow-Origin\": \"'$ORIGIN'\",
    \"method.response.header.Access-Control-Allow-Headers\": \"'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\",
    \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,OPTIONS,HEAD,PUT,DELETE'\",
    \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"
  }" \
  --response-templates '{"application/json":""}' \
  --region "$REGION"

echo "Deploying changes..."
aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name prod \
  --description "Fix CORS integration response" \
  --region "$REGION"

echo "✅ CORS fix complete!"
echo "Test with: curl -H 'Origin: $ORIGIN' -X OPTIONS 'https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health' -i"
