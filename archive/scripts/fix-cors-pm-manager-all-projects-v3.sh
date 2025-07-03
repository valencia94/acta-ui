#!/bin/bash

# Fix CORS for /pm-manager/all-projects by updating existing method response
# Add missing Access-Control-Allow-Credentials header

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
PROD_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🎯 Fixing CORS for /pm-manager/all-projects (adding credentials header)..."
echo "   Origin: $PROD_ORIGIN"
echo ""

RESOURCE_ID="u8hucp"
echo "✅ Using resource ID: $RESOURCE_ID for /pm-manager/all-projects"
echo ""

# Check current method response
echo "🔍 Checking current method response..."
aws apigateway get-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --region "$REGION" \
    --query 'responseParameters' --output json || echo "Could not get method response"

echo ""

# Delete and recreate the method response with all headers
echo "🧹 Recreating method response with all CORS headers..."
aws apigateway delete-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --region "$REGION" || echo "   📝 No method response to delete"

echo "   ➕ Creating new method response with credentials header..."
aws apigateway put-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --response-parameters '{
        "method.response.header.Access-Control-Allow-Origin": true,
        "method.response.header.Access-Control-Allow-Methods": true,
        "method.response.header.Access-Control-Allow-Headers": true,
        "method.response.header.Access-Control-Allow-Credentials": true
    }' \
    --region "$REGION"

echo ""

# Now update Integration Response
echo "🔧 Updating Integration Response headers..."
aws apigateway put-integration-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --response-parameters "{
        \"method.response.header.Access-Control-Allow-Origin\": \"'$PROD_ORIGIN'\",
        \"method.response.header.Access-Control-Allow-Methods\": \"'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'\",
        \"method.response.header.Access-Control-Allow-Headers\": \"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\",
        \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"
    }" \
    --response-templates '{"application/json": "{}"}' \
    --region "$REGION"

echo ""
echo "🚀 Deploying changes..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "prod" \
    --description "Fix CORS for /pm-manager/all-projects with credentials header" \
    --region "$REGION"

echo ""
echo "✅ CORS Fixed for /pm-manager/all-projects!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Fixed: /pm-manager/all-projects"
echo "   • Access-Control-Allow-Origin: $PROD_ORIGIN"
echo "   • Access-Control-Allow-Credentials: true"
