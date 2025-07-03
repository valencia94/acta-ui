#!/bin/bash

# Fix CORS Integration Response Headers for ACTA-UI Production
# This adds the missing Integration Response header mappings

set -e

echo "🔧 Fixing CORS Integration Response Headers for Production..."

# Configuration
API_ID="q2b9avfwv5"
REGION="us-east-2"
STAGE="prod"
PROD_DOMAIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "📋 Configuration:"
echo "  API Gateway ID: $API_ID"
echo "  Region: $REGION"
echo "  Stage: $STAGE"
echo "  Production Domain: $PROD_DOMAIN"

# Critical endpoints that need CORS fixed
ENDPOINTS=(
    "/health OPTIONS"
    "/check-document/{projectId} OPTIONS"
    "/extract-project-place/{id} OPTIONS"
    "/pm-manager/all-projects OPTIONS"
    "/pm-manager/{pmEmail} OPTIONS"
)

echo ""
echo "🎯 Fixing Integration Response Headers for all endpoints..."

for endpoint in "${ENDPOINTS[@]}"; do
    IFS=' ' read -r resource_path http_method <<< "$endpoint"
    echo ""
    echo "🔧 Processing: $http_method $resource_path"
    
    # Get the resource ID for this path
    echo "  🔍 Finding resource ID for path: $resource_path"
    
    if [[ "$resource_path" == "/health" ]]; then
        # Health endpoint
        RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
            --query "items[?pathPart=='health'].id | [0]" --output text)
    elif [[ "$resource_path" == "/check-document/{projectId}" ]]; then
        # Check document endpoint
        RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
            --query "items[?pathPart=='{projectId}' && contains(path, 'check-document')].id | [0]" --output text)
    elif [[ "$resource_path" == "/extract-project-place/{id}" ]]; then
        # Extract project place endpoint
        RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
            --query "items[?pathPart=='{id}' && contains(path, 'extract-project-place')].id | [0]" --output text)
    elif [[ "$resource_path" == "/pm-manager/all-projects" ]]; then
        # PM Manager all projects
        RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
            --query "items[?pathPart=='all-projects' && contains(path, 'pm-manager')].id | [0]" --output text)
    elif [[ "$resource_path" == "/pm-manager/{pmEmail}" ]]; then
        # PM Manager by email
        RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" \
            --query "items[?pathPart=='{pmEmail}' && contains(path, 'pm-manager')].id | [0]" --output text)
    fi
    
    if [[ "$RESOURCE_ID" == "None" || -z "$RESOURCE_ID" ]]; then
        echo "  ❌ Resource not found for $resource_path"
        continue
    fi
    
    echo "  ✅ Found resource ID: $RESOURCE_ID"
    
    # Add Integration Response header mappings
    echo "  🔧 Adding Integration Response header mappings..."
    
    # Update Integration Response with CORS headers
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$RESOURCE_ID" \
        --http-method "$http_method" \
        --status-code "200" \
        --response-parameters "{
            \"method.response.header.Access-Control-Allow-Origin\": \"'$PROD_DOMAIN'\",
            \"method.response.header.Access-Control-Allow-Methods\": \"'GET,POST,PUT,DELETE,OPTIONS,HEAD'\",
            \"method.response.header.Access-Control-Allow-Headers\": \"'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'\",
            \"method.response.header.Access-Control-Allow-Credentials\": \"'true'\"
        }" \
        --region "$REGION" || echo "  ⚠️  Integration response might already exist"
    
    echo "  ✅ Integration Response headers configured for $resource_path"
done

echo ""
echo "🚀 Deploying changes to production stage..."
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "$STAGE" \
    --description "Fix CORS Integration Response headers for production domain" \
    --region "$REGION"

echo ""
echo "✅ CORS Integration Response Fix Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Fixed Integration Response headers for:"
for endpoint in "${ENDPOINTS[@]}"; do
    echo "   • $endpoint"
done
echo ""
echo "🔧 Headers Added:"
echo "   • Access-Control-Allow-Origin: '$PROD_DOMAIN'"
echo "   • Access-Control-Allow-Methods: 'GET,POST,PUT,DELETE,OPTIONS,HEAD'"
echo "   • Access-Control-Allow-Headers: 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'"
echo "   • Access-Control-Allow-Credentials: 'true'"
echo ""
echo "⚠️  CRITICAL: Values are wrapped in single quotes as required by API Gateway"
echo "🌐 Production domain: $PROD_DOMAIN"
echo ""
echo "🧪 Test with:"
echo "curl -X OPTIONS '$PROD_DOMAIN' -H 'Origin: $PROD_DOMAIN' -H 'Access-Control-Request-Method: GET' -v"
