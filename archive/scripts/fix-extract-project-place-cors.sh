#!/bin/bash

# Fix CORS for extract-project-place/{id} endpoint
API_ID="q2b9avfwv5"
REGION="us-east-2"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"
RESOURCE_ID="j6ci0c"

echo "🔧 Fixing CORS for /extract-project-place/{id}..."

# Delete and recreate the OPTIONS integration response
echo "🔄 Updating OPTIONS integration response..."
aws apigateway delete-integration-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --region $REGION || echo "Integration response not found, will create new one"

# Add OPTIONS integration response with proper CORS headers
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'$ORIGIN'\",\"method.response.header.Access-Control-Allow-Methods\":\"'GET,POST,OPTIONS'\",\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\"}" \
  --region $REGION

echo "✅ OPTIONS integration response updated"

# Add CORS headers to POST method response (if not exists)
echo "🔄 Adding CORS to POST method..."
aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --status-code 200 \
  --response-parameters "method.response.header.Access-Control-Allow-Origin=false" \
  --region $REGION || echo "POST method response already exists"

# Add CORS headers to POST integration response
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method POST \
  --status-code 200 \
  --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'$ORIGIN'\"}" \
  --region $REGION || echo "POST integration response already exists"

echo "✅ POST CORS headers updated"

# Deploy the changes
echo "📤 Deploying changes..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION \
  --query 'id' --output text)

echo "✅ Deployment ID: $DEPLOYMENT_ID"

echo "⏳ Waiting for deployment to propagate..."
sleep 5

# Test the endpoint
echo "🧪 Testing CORS..."
echo "Testing OPTIONS request:"
curl -H "Origin: $ORIGIN" -X OPTIONS "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/extract-project-place/test" -I

echo ""
echo "🎉 CORS fix complete for extract-project-place/{id} endpoint!"

