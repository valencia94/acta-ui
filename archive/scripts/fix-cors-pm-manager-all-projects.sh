#!/bin/bash

# Fix CORS for /pm-manager/all-projects endpoint
# This is a critical endpoint your frontend calls

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
PROD_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🎯 Fixing CORS for /pm-manager/all-projects endpoint..."
echo "   Origin: $PROD_ORIGIN"
echo "   Adding credentials support"
echo ""

# Get resource ID for pm-manager/all-projects
echo "🔍 Finding resource ID for /pm-manager/all-projects..."
RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
    --query "items[?path=='/pm-manager/all-projects'].id | [0]" --output text)

if [[ "$RESOURCE_ID" == "None" || -z "$RESOURCE_ID" ]]; then
    echo "❌ Could not find resource for /pm-manager/all-projects"
    exit 1
fi

echo "✅ Found resource ID: $RESOURCE_ID"
echo ""

# Update Integration Response headers
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
    --description "Fix CORS for /pm-manager/all-projects endpoint" \
    --region "$REGION"

echo ""
echo "✅ CORS Fixed for /pm-manager/all-projects!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Applied to: /pm-manager/all-projects"
echo "   • Access-Control-Allow-Origin: $PROD_ORIGIN"
echo "   • Access-Control-Allow-Credentials: true"
echo ""
echo "🧪 Test with:"
echo "curl -X OPTIONS 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/pm-manager/all-projects' \\"
echo "  -H 'Origin: $PROD_ORIGIN' -v | grep Access-Control"
