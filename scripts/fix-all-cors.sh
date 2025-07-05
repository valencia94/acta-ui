#!/bin/bash

# Fix CORS for all API Gateway endpoints
set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🔧 Fixing CORS for API Gateway: $API_ID"
echo "Origin: $ORIGIN"
echo "================================================"

# Function to add CORS to a resource
add_cors_to_resource() {
    local resource_id=$1
    local endpoint_name=$2
    
    echo "🔧 Fixing CORS for $endpoint_name (Resource ID: $resource_id)"
    
    # Add OPTIONS method if it doesn't exist
    echo "  Adding OPTIONS method..."
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region "$REGION" || echo "  OPTIONS method already exists"
    
    # Add MOCK integration for OPTIONS
    echo "  Adding MOCK integration..."
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --type MOCK \
        --integration-http-method OPTIONS \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        --region "$REGION" || echo "  Integration already exists"
    
    # Add method response for OPTIONS
    echo "  Adding OPTIONS method response..."
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers": false, "method.response.header.Access-Control-Allow-Methods": false, "method.response.header.Access-Control-Allow-Origin": false}' \
        --region "$REGION" || echo "  Method response already exists"
    
    # Add integration response for OPTIONS
    echo "  Adding OPTIONS integration response..."
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters "{\"method.response.header.Access-Control-Allow-Headers\":\"'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\",\"method.response.header.Access-Control-Allow-Methods\":\"'GET,POST,OPTIONS'\",\"method.response.header.Access-Control-Allow-Origin\":\"'$ORIGIN'\"}" \
        --response-templates '{"application/json":""}' \
        --region "$REGION" || echo "  Integration response already exists"
    
    # Add CORS header to GET method integration response
    echo "  Adding CORS header to GET integration response..."
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method GET \
        --status-code 200 \
        --response-parameters "{\"method.response.header.Access-Control-Allow-Origin\":\"'$ORIGIN'\"}" \
        --region "$REGION" || echo "  GET integration response already configured"
    
    echo "  ✅ CORS configured for $endpoint_name"
}

# Apply CORS to all known endpoints
add_cors_to_resource "j7z1ti" "health"
add_cors_to_resource "cltt9f" "pm-manager-email"
add_cors_to_resource "u8hucp" "pm-manager-all-projects"
add_cors_to_resource "9nmq2z" "projects"

# Get other resources and try to add CORS to them
echo "🔍 Finding other resources that might need CORS..."
aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart!=null].{id:id,path:pathPart}' --output table

echo "📤 Deploying changes to production..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name prod \
    --description "Comprehensive CORS fix" \
    --region "$REGION" \
    --query 'id' \
    --output text)

echo "✅ CORS fix complete! Deployment ID: $DEPLOYMENT_ID"
echo "⏰ Waiting 30 seconds for deployment to propagate..."
sleep 30

echo "🧪 Testing CORS on health endpoint..."
curl -H "Origin: $ORIGIN" -X OPTIONS "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health" -i

echo "🎉 CORS fix complete!"
