#!/bin/bash

# Fix CORS for /pm-manager/all-projects endpoint
# First add method response headers, then integration response

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
PROD_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🎯 Fixing CORS for /pm-manager/all-projects endpoint (with method response)..."
echo "   Origin: $PROD_ORIGIN"
echo ""

# Get resource ID for pm-manager/all-projects
RESOURCE_ID="u8hucp"  # We know this from the previous run
echo "✅ Using resource ID: $RESOURCE_ID for /pm-manager/all-projects"
echo ""

# Step 1: Add method response headers (if missing)
echo "📋 Adding method response headers..."
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
    --region "$REGION" || echo "   📝 Method response headers may already exist"

echo ""

# Step 2: Update Integration Response headers
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
    --description "Fix CORS for /pm-manager/all-projects with method response" \
    --region "$REGION"

echo ""
echo "✅ CORS Fixed for /pm-manager/all-projects!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Applied to: /pm-manager/all-projects"
echo "   • Method Response: Headers defined"
echo "   • Integration Response: Headers mapped"
echo "   • Access-Control-Allow-Origin: $PROD_ORIGIN"
echo "   • Access-Control-Allow-Credentials: true"
