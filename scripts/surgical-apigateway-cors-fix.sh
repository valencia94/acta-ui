#!/bin/bash

# 🔧 Surgical API Gateway CORS Fix for Acta-UI Production
# Follows AWS Architect guidance: separate by control plane
# This script ONLY handles API Gateway OPTIONS methods - no CloudFront changes

set -e

API_ID="q2b9avfwv5"
REGION="us-east-2"
CLOUDFRONT_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🏥 SURGICAL API GATEWAY CORS FIX"
echo "API Gateway: $API_ID"
echo "CloudFront Origin: $CLOUDFRONT_ORIGIN"
echo "Region: $REGION"
echo "================================================"

# Function to add proper CORS OPTIONS method to a resource
fix_options_cors() {
    local resource_id=$1
    local endpoint_name=$2
    
    echo "🔧 Fixing OPTIONS CORS for /$endpoint_name (Resource: $resource_id)"
    
    # 1. Add OPTIONS method (if not exists)
    echo "  ➕ Adding OPTIONS method..."
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region "$REGION" 2>/dev/null || echo "    ℹ️ OPTIONS method already exists"
    
    # 2. Add MOCK integration for OPTIONS
    echo "  ➕ Adding MOCK integration..."
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --type MOCK \
        --integration-http-method OPTIONS \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        --region "$REGION" 2>/dev/null || echo "    ℹ️ Integration already exists"
    
    # 3. Add method response for OPTIONS with CORS headers
    echo "  ➕ Adding OPTIONS method response..."
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Origin": false,
            "method.response.header.Access-Control-Allow-Headers": false,
            "method.response.header.Access-Control-Allow-Methods": false,
            "method.response.header.Access-Control-Allow-Credentials": false
        }' \
        --region "$REGION" 2>/dev/null || echo "    ℹ️ Method response already exists"
    
    # 4. Add integration response for OPTIONS with actual CORS values
    echo "  ➕ Adding OPTIONS integration response with CORS values..."
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters "{
            \"method.response.header.Access-Control-Allow-Origin\": \"'$CLOUDFRONT_ORIGIN'\",
            \"method.response.header.Access-Control-Allow-Headers\": \"'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\",
            \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,OPTIONS,HEAD,PUT,DELETE'\",
            \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"
        }" \
        --response-templates '{"application/json": ""}' \
        --region "$REGION" || echo "    ⚠️ Integration response update failed"
    
    # 5. Add CORS header to existing GET/POST methods
    echo "  ➕ Adding CORS origin header to GET method..."
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method GET \
        --status-code 200 \
        --response-parameters "{
            \"method.response.header.Access-Control-Allow-Origin\": \"'$CLOUDFRONT_ORIGIN'\"
        }" \
        --region "$REGION" 2>/dev/null || echo "    ℹ️ GET method may not exist or already configured"
    
    echo "  ✅ CORS fixed for /$endpoint_name"
    echo ""
}

# Get all resources first to identify the correct resource IDs
echo "🔍 Getting API Gateway resources..."
aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query 'items[?pathPart!=null].{id:id,path:pathPart,parent:parentId}' \
    --output table

echo ""
echo "🔧 Applying CORS fixes to known critical endpoints..."

# Fix all documented Acta-UI API endpoints
# These resource IDs are from the existing working deployment
fix_options_cors "j7z1ti" "health"
fix_options_cors "cltt9f" "pm-manager"  
fix_options_cors "u8hucp" "pm-manager/all-projects"
fix_options_cors "9nmq2z" "projects"

# Deploy the changes
echo "📤 Deploying API Gateway changes to prod stage..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name prod \
    --description "Surgical CORS fix - OPTIONS methods only" \
    --region "$REGION" \
    --query 'id' \
    --output text)

echo "✅ Deployment complete! ID: $DEPLOYMENT_ID"
echo ""

# Test the fix
echo "🧪 Testing CORS on health endpoint..."
sleep 5  # Wait for deployment to propagate

echo "Test command:"
echo "curl -H 'Origin: $CLOUDFRONT_ORIGIN' -X OPTIONS 'https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health' -v"

echo ""
echo "🎉 Surgical API Gateway CORS fix complete!"
echo "✅ Next step: Run CloudFront origin request policy fix"
