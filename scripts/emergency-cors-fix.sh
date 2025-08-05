#!/bin/bash
# Emergency CORS Fix - Simplified
set -e

echo "🔧 Emergency CORS Fix Starting..."

API_ID="q2b9avfwv5"
REGION="us-east-2"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

# Fix health endpoint first
echo "Fixing /health endpoint..."
aws apigateway put-integration-response \
  --rest-api-id "$API_ID" \
  --resource-id "j7z1ti" \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'$ORIGIN'\",\"method.response.header.Access-Control-Allow-Headers\":\"'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\",\"method.response.header.Access-Control-Allow-Methods\":\"'GET,POST,OPTIONS'\",\"method.response.header.Access-Control-Allow-Credentials\":\"'true'\"}" \
  --response-templates '{"application/json":""}' \
  --region "$REGION"

# Deploy changes
echo "Deploying..."
aws apigateway create-deployment \
  --rest-api-id "$API_ID" \
  --stage-name prod \
  --description "Emergency CORS fix" \
  --region "$REGION"

echo "✅ Emergency CORS fix complete!"
echo "Test with: curl -H 'Origin: $ORIGIN' -X OPTIONS 'https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health' -i"
