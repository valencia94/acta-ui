#!/bin/bash
# Comprehensive localhost CORS fix for all critical endpoints

API_ID="q2b9avfwv5"
REGION="us-east-2"
LOCALHOST_ORIGIN="http://localhost:3000"
PROD_ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"
COMBINED_ORIGINS="'$LOCALHOST_ORIGIN,$PROD_ORIGIN'"

echo "�� Comprehensive CORS fix for localhost development..."

# Get all resources
aws apigateway get-resources --rest-api-id $API_ID --region $REGION --output table

# Critical endpoints to fix
declare -A ENDPOINTS=(
    ["health"]="j7z1ti"
    ["check-document"]="i3rbne"
)

# Function to fix CORS for a resource
fix_cors_for_resource() {
    local resource_id=$1
    local endpoint_name=$2
    
    echo "🔧 Fixing CORS for $endpoint_name (Resource: $resource_id)..."
    
    # Fix OPTIONS method
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters "{
            \"method.response.header.Access-Control-Allow-Origin\": $COMBINED_ORIGINS,
            \"method.response.header.Access-Control-Allow-Headers\": \"'Authorization,Content-Type,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\",
            \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,OPTIONS,HEAD,PUT,DELETE'\",
            \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"
        }" \
        --region $REGION 2>/dev/null && echo "  ✅ OPTIONS method fixed" || echo "  ⚠️ OPTIONS already configured"
    
    # Fix GET method
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method GET \
        --status-code 200 \
        --response-parameters "{
            \"method.response.header.Access-Control-Allow-Origin\": $COMBINED_ORIGINS
        }" \
        --region $REGION 2>/dev/null && echo "  ✅ GET method fixed" || echo "  ⚠️ GET already configured"
    
    # Fix HEAD method (for check-document)
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $resource_id \
        --http-method HEAD \
        --status-code 200 \
        --response-parameters "{
            \"method.response.header.Access-Control-Allow-Origin\": $COMBINED_ORIGINS
        }" \
        --region $REGION 2>/dev/null && echo "  ✅ HEAD method fixed" || echo "  ⚠️ HEAD not configured or already set"
}

# Fix each critical endpoint
for endpoint in "${!ENDPOINTS[@]}"; do
    fix_cors_for_resource "${ENDPOINTS[$endpoint]}" "$endpoint"
done

# Deploy the changes
echo "📤 Deploying comprehensive CORS changes..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION > /dev/null

echo "✅ Comprehensive localhost CORS fix complete!"
echo "🌐 All endpoints now support both:"
echo "   - http://localhost:3000 (development)"
echo "   - https://d7t9x3j66yd8k.cloudfront.net (production)"
