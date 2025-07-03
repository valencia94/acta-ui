#!/bin/bash

# Fix CORS by Creating Proper OPTIONS Methods from Scratch
# The current OPTIONS methods are returning 500 errors

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
PROD_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🔧 Creating proper OPTIONS methods from scratch..."
echo "Production Origin: $PROD_ORIGIN"
echo ""

# Function to completely recreate an OPTIONS method
create_options_method() {
    local resource_id=$1
    local endpoint_name=$2
    
    echo "🔧 Creating OPTIONS method for $endpoint_name (Resource: $resource_id)"
    
    # Step 1: Delete existing OPTIONS method if it exists (to start fresh)
    echo "   🧹 Cleaning up existing OPTIONS method..."
    aws apigateway delete-method \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "OPTIONS" \
        --region "$REGION" 2>/dev/null || echo "   📝 No existing OPTIONS method to delete"
    
    # Step 2: Create OPTIONS method
    echo "   ➕ Creating OPTIONS method..."
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "OPTIONS" \
        --authorization-type "NONE" \
        --region "$REGION"
    
    # Step 3: Create mock integration
    echo "   🔗 Setting up mock integration..."
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "OPTIONS" \
        --type "MOCK" \
        --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
        --region "$REGION"
    
    # Step 4: Create method response with headers
    echo "   📤 Creating method response..."
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "OPTIONS" \
        --status-code "200" \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Origin": true,
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Credentials": true
        }' \
        --region "$REGION"
    
    # Step 5: Create integration response with header mappings
    echo "   🎯 Creating integration response with header mappings..."
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "OPTIONS" \
        --status-code "200" \
        --response-parameters "{
            \"method.response.header.Access-Control-Allow-Origin\": \"'$PROD_ORIGIN'\",
            \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,PUT,DELETE,OPTIONS,HEAD'\",
            \"method.response.header.Access-Control-Allow-Headers\": \"'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\",
            \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"
        }" \
        --response-templates '{"application/json":""}' \
        --region "$REGION"
    
    echo "   ✅ OPTIONS method fully configured for $endpoint_name"
    echo ""
}

# Get resource IDs and recreate OPTIONS methods
echo "🔍 Getting resource IDs and recreating OPTIONS methods..."

# Health endpoint (most important for testing)
HEALTH_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query "items[?path=='/health'].id | [0]" --output text)
if [[ "$HEALTH_ID" != "None" && -n "$HEALTH_ID" ]]; then
    create_options_method "$HEALTH_ID" "/health"
else
    echo "❌ Could not find /health resource"
fi

# Deploy changes
echo "🚀 Deploying changes to production..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "prod" \
    --description "Recreate OPTIONS methods with proper CORS configuration" \
    --region "$REGION"

echo ""
echo "✅ OPTIONS method recreated with proper CORS!"
echo "🌐 Configured for origin: $PROD_ORIGIN"
echo ""
echo "🧪 Testing the fix..."
sleep 2

# Test the fix
curl -X OPTIONS "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health" \
    -H "Origin: $PROD_ORIGIN" \
    -H "Access-Control-Request-Method: GET" \
    -w "\nHTTP Status: %{http_code}\n" \
    -s -D - -o /dev/null | head -10
