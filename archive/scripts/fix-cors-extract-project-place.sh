#!/bin/bash

# Fix CORS for /extract-project-place/{id} endpoint

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
PROD_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🎯 Fixing CORS for /extract-project-place/{id} endpoint..."
echo "   Origin: $PROD_ORIGIN"
echo ""

# Get resource ID for extract-project-place/{id}
echo "🔍 Finding resource ID for /extract-project-place/{id}..."
RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
    --query "items[?contains(path, 'extract-project-place') && contains(path, '{id}')].id | [0]" --output text)

if [[ "$RESOURCE_ID" == "None" || -z "$RESOURCE_ID" ]]; then
    echo "❌ Could not find resource for /extract-project-place/{id}"
    exit 1
fi

echo "✅ Found resource ID: $RESOURCE_ID"
echo ""

# Update method response (recreate with credentials header)
echo "🧹 Recreating method response with all CORS headers..."
aws apigateway delete-method-response \
    --rest-api-id "$API_ID" \
    --resource-id "$RESOURCE_ID" \
    --http-method "OPTIONS" \
    --status-code "200" \
    --region "$REGION" || echo "   📝 No method response to delete"

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
    --description "Fix CORS for /extract-project-place/{id} endpoint" \
    --region "$REGION"

echo ""
echo "✅ CORS Fixed for /extract-project-place/{id}!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Fixed: /extract-project-place/{id}"
echo "   • Access-Control-Allow-Origin: $PROD_ORIGIN"
echo "   • Access-Control-Allow-Credentials: true"
