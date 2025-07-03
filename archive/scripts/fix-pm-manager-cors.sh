#!/bin/bash

# Fix CORS for pm-manager endpoints
API_ID="q2b9avfwv5"
REGION="us-east-2"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🔧 Adding CORS to pm-manager endpoints..."

# pm-manager/all-projects (u8hucp)
echo "📋 Adding CORS to /pm-manager/all-projects..."

# Add OPTIONS method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id u8hucp \
  --http-method OPTIONS \
  --authorization-type NONE \
  --region $REGION

# Add OPTIONS integration
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id u8hucp \
  --http-method OPTIONS \
  --type MOCK \
  --integration-http-method OPTIONS \
  --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
  --region $REGION

# Add OPTIONS method response
aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id u8hucp \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters "method.response.header.Access-Control-Allow-Origin=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Headers=false" \
  --region $REGION

# Add OPTIONS integration response
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id u8hucp \
  --http-method OPTIONS \
  --status-code 200 \
  --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'$ORIGIN'\",\"method.response.header.Access-Control-Allow-Methods\":\"'GET,POST,OPTIONS'\",\"method.response.header.Access-Control-Allow-Headers\":\"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\"}" \
  --region $REGION

# Add CORS headers to GET method response
aws apigateway put-method-response \
  --rest-api-id $API_ID \
  --resource-id u8hucp \
  --http-method GET \
  --status-code 200 \
  --response-parameters "method.response.header.Access-Control-Allow-Origin=false" \
  --region $REGION

# Add CORS headers to GET integration response
aws apigateway put-integration-response \
  --rest-api-id $API_ID \
  --resource-id u8hucp \
  --http-method GET \
  --status-code 200 \
  --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'$ORIGIN'\"}" \
  --region $REGION

echo "✅ CORS added to pm-manager/all-projects"

# Deploy the changes
echo "📤 Deploying changes..."
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod \
  --region $REGION

echo "🎉 CORS fix complete for pm-manager endpoints!"

# Test the endpoint
echo "🧪 Testing CORS..."
curl -H "Origin: $ORIGIN" -X OPTIONS "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/pm-manager/all-projects" -I

