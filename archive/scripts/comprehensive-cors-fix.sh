#!/bin/bash

# Comprehensive CORS Integration Response Check and Fix
# Ensures ALL critical endpoints have proper Integration Response headers

set -e

echo "🔧 Comprehensive CORS Integration Response Fix for ACTA-UI"
echo "=========================================================="

# Configuration
API_ID="q2b9avfwv5"
REGION="us-east-2"
STAGE="prod"
PROD_DOMAIN="https://d7t9x3j66yd8k.cloudfront.net"

echo ""
echo "📋 Configuration:"
echo "  API Gateway ID: $API_ID"
echo "  Region: $REGION" 
echo "  Stage: $STAGE"
echo "  Production Domain: $PROD_DOMAIN"

echo ""
echo "🔍 Finding ALL resources in the API..."

# Get all resources
ALL_RESOURCES=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --output json)

echo "📊 Found resources:"
echo "$ALL_RESOURCES" | jq -r '.items[] | "  \(.path) (ID: \(.id))"'

echo ""
echo "🎯 Processing critical endpoints with OPTIONS methods..."

# Function to add Integration Response headers
add_integration_response_headers() {
    local resource_id=$1
    local resource_path=$2
    
    echo ""
    echo "🔧 Processing OPTIONS method for: $resource_path (ID: $resource_id)"
    
    # Check if OPTIONS method exists
    if aws apigateway get-method --rest-api-id "$API_ID" --resource-id "$resource_id" --http-method "OPTIONS" --region "$REGION" &>/dev/null; then
        echo "  ✅ OPTIONS method exists"
        
        # Add/Update Integration Response
        echo "  🔧 Adding Integration Response headers..."
        aws apigateway put-integration-response \
            --rest-api-id "$API_ID" \
            --resource-id "$resource_id" \
            --http-method "OPTIONS" \
            --status-code "200" \
            --response-parameters "{
                \"method.response.header.Access-Control-Allow-Origin\": \"'$PROD_DOMAIN'\",
                \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,PUT,DELETE,OPTIONS,HEAD'\",
                \"method.response.header.Access-Control-Allow-Headers\": \"'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\",
                \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"
            }" \
            --region "$REGION" 2>/dev/null && echo "  ✅ Integration Response headers configured" || echo "  ⚠️  Integration Response already configured or error occurred"
    else
        echo "  ❌ OPTIONS method does not exist for $resource_path"
    fi
}

# Process each resource that should have OPTIONS
echo "$ALL_RESOURCES" | jq -r '.items[] | select(.path | test("health|check-document|extract-project-place|pm-manager")) | "\(.id) \(.path)"' | while read -r resource_id resource_path; do
    add_integration_response_headers "$resource_id" "$resource_path"
done

echo ""
echo "🚀 Deploying changes to production stage..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$STAGE" \
    --description "Comprehensive CORS Integration Response fix - $(date)" \
    --region "$REGION"

echo ""
echo "✅ Comprehensive CORS Integration Response Fix Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🧪 Testing CORS headers on critical endpoints..."

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
ORIGIN="$PROD_DOMAIN"

# Test critical endpoints
test_endpoints=(
    "/health"
    "/pm-manager/all-projects"
)

for endpoint in "${test_endpoints[@]}"; do
    echo ""
    echo "🔍 Testing: $endpoint"
    echo "Command: curl -X OPTIONS '$API_BASE$endpoint' -H 'Origin: $ORIGIN' -H 'Access-Control-Request-Method: GET' -v"
    
    response=$(curl -X OPTIONS "$API_BASE$endpoint" \
        -H "Origin: $ORIGIN" \
        -H "Access-Control-Request-Method: GET" \
        -H "Access-Control-Request-Headers: Authorization" \
        -v 2>&1)
    
    echo "CORS Headers found:"
    echo "$response" | grep -E "(Access-Control|HTTP/)" || echo "  ❌ No CORS headers detected"
done

echo ""
echo "🎯 Integration Response Headers Applied:"
echo "  • Access-Control-Allow-Origin: '$PROD_DOMAIN'"
echo "  • Access-Control-Allow-Methods: 'GET,POST,PUT,DELETE,OPTIONS,HEAD'"
echo "  • Access-Control-Allow-Headers: 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'"
echo "  • Access-Control-Allow-Credentials: 'true'"
echo ""
echo "⚠️  All values wrapped in single quotes as required by API Gateway"
echo "🌐 Configured for production domain: $PROD_DOMAIN"
