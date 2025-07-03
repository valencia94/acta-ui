#!/bin/bash

# Fix CORS for /pm-manager/{pmEmail} endpoint
# This endpoint was completely missing CORS before

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
PROD_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🎯 Fixing CORS for /pm-manager/{pmEmail} endpoint..."
echo "   Origin: $PROD_ORIGIN"
echo ""

# Get resource ID for pm-manager/{pmEmail}
echo "🔍 Finding resource ID for /pm-manager/{pmEmail}..."
RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
    --query "items[?contains(path, 'pm-manager') && contains(path, '{pmEmail}')].id | [0]" --output text)

if [[ "$RESOURCE_ID" == "None" || -z "$RESOURCE_ID" ]]; then
    echo "❌ Could not find resource for /pm-manager/{pmEmail}"
    exit 1
fi

echo "✅ Found resource ID: $RESOURCE_ID"
echo ""

# Check if OPTIONS method exists
echo "🔍 Checking if OPTIONS method exists..."
if aws apigateway get-method --rest-api-id "$API_ID" --resource-id "$RESOURCE_ID" --http-method "OPTIONS" --region "$REGION" >/dev/null 2>&1; then
    echo "   ✅ OPTIONS method exists, updating headers..."
    
    # Update method response
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
    
else
    echo "   ❌ OPTIONS method does not exist, creating it..."
    
    # Create OPTIONS method
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$RESOURCE_ID" \
        --http-method "OPTIONS" \
        --authorization-type "NONE" \
        --region "$REGION"
    
    # Create integration
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$RESOURCE_ID" \
        --http-method "OPTIONS" \
        --type "MOCK" \
        --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
        --region "$REGION"
    
    # Create method response
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
fi

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
    --description "Fix CORS for /pm-manager/{pmEmail} endpoint" \
    --region "$REGION"

echo ""
echo "✅ CORS Fixed for /pm-manager/{pmEmail}!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Fixed: /pm-manager/{pmEmail}"
echo "   • Access-Control-Allow-Origin: $PROD_ORIGIN"
echo "   • Access-Control-Allow-Credentials: true"
