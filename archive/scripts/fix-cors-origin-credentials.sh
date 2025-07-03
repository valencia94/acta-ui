#!/bin/bash

# Fix CORS Origin and Credentials Headers for Production
# Change from * to exact domain and add credentials support

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
PROD_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🎯 Fixing CORS headers for credentials support..."
echo "   Current: Access-Control-Allow-Origin: *"
echo "   Fixed:   Access-Control-Allow-Origin: $PROD_ORIGIN"
echo "   Adding:  Access-Control-Allow-Credentials: true"
echo ""

# Function to fix just the origin and add credentials for one endpoint
fix_cors_credentials() {
    local resource_path=$1
    local resource_id=$2
    
    echo "🔧 Fixing $resource_path (Resource ID: $resource_id)"
    
    # Update Integration Response to fix origin and add credentials
    echo "   📝 Updating Integration Response headers..."
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
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
    
    echo "   ✅ Headers updated for $resource_path"
    echo ""
}

# Get resource IDs and fix the critical endpoints one by one
echo "🔍 Getting resource IDs..."

# Health endpoint
HEALTH_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query "items[?path=='/health'].id | [0]" --output text)
if [[ "$HEALTH_ID" != "None" && -n "$HEALTH_ID" ]]; then
    fix_cors_credentials "/health" "$HEALTH_ID"
fi

echo "🚀 Deploying changes..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "prod" \
    --description "Fix CORS origin from * to exact domain and add credentials" \
    --region "$REGION"

echo ""
echo "✅ CORS Fixed for Credentials Support!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Changes Applied:"
echo "   • Access-Control-Allow-Origin: $PROD_ORIGIN (exact match)"
echo "   • Access-Control-Allow-Credentials: true"
echo "   • Kept all other headers the same"
echo ""
echo "💡 This should fix the CORS error when using credentials: 'include'"
echo ""
echo "🧪 Test in 30 seconds with:"
echo "curl -X OPTIONS 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health' \\"
echo "  -H 'Origin: $PROD_ORIGIN' -v | grep Access-Control"
