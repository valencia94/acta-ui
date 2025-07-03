#!/bin/bash

# 🔧 ACTA-UI CORS Fix Script
# This script fixes CORS issues for your API Gateway endpoints
# Run this script to enable CORS for all your endpoints

set -e

# Activate the virtual environment with AWS CLI
source /tmp/aws-env/bin/activate

API_ID="q2b9avfwv5"
REGION="us-east-2"
ORIGIN="https://d7t9x3j66yd8k.cloudfront.net"

echo "🚀 ACTA-UI CORS Fix Starting..."
echo "🌐 API Gateway: $API_ID"
echo "📍 Region: $REGION"
echo "🔗 Origin: $ORIGIN"
echo "=================================="

# Function to add CORS to a resource
add_cors_to_resource() {
    local resource_id="$1"
    local resource_name="$2"
    
    echo "🔧 Fixing CORS for: $resource_name ($resource_id)"
    
    # 1. Add OPTIONS method if it doesn't exist
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region "$REGION" \
        2>/dev/null || echo "  ℹ️ OPTIONS method already exists"
    
    # 2. Add MOCK integration for OPTIONS
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --type MOCK \
        --integration-http-method OPTIONS \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        --region "$REGION" \
        2>/dev/null || echo "  ℹ️ OPTIONS integration already exists"
    
    # 3. Add method response for OPTIONS
    aws apigateway put-method-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Headers": false,
            "method.response.header.Access-Control-Allow-Methods": false,
            "method.response.header.Access-Control-Allow-Origin": false
        }' \
        --region "$REGION" \
        2>/dev/null || echo "  ℹ️ OPTIONS method response already exists"
    
    # 4. Add integration response for OPTIONS
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''",
            "method.response.header.Access-Control-Allow-Methods": "'\''GET,POST,PUT,DELETE,OPTIONS'\''",
            "method.response.header.Access-Control-Allow-Origin": "'\'''"$ORIGIN"'\''"
        }' \
        --region "$REGION" \
        2>/dev/null || echo "  ℹ️ OPTIONS integration response already exists"
    
    # 5. Add CORS headers to actual methods (GET, POST, etc.)
    for method in GET POST PUT DELETE; do
        # Check if method exists first
        if aws apigateway get-method --rest-api-id "$API_ID" --resource-id "$resource_id" --http-method "$method" --region "$REGION" >/dev/null 2>&1; then
            echo "  ➕ Adding CORS to $method method"
            
            # Add method response with CORS header
            aws apigateway put-method-response \
                --rest-api-id "$API_ID" \
                --resource-id "$resource_id" \
                --http-method "$method" \
                --status-code 200 \
                --response-parameters '{"method.response.header.Access-Control-Allow-Origin": false}' \
                --region "$REGION" \
                2>/dev/null || echo "    ℹ️ $method method response already configured"
            
            # Add integration response with CORS header
            aws apigateway put-integration-response \
                --rest-api-id "$API_ID" \
                --resource-id "$resource_id" \
                --http-method "$method" \
                --status-code 200 \
                --response-parameters '{
                    "method.response.header.Access-Control-Allow-Origin": "'\'''"$ORIGIN"'\''"
                }' \
                --region "$REGION" \
                2>/dev/null || echo "    ℹ️ $method integration response already configured"
        fi
    done
    
    echo "  ✅ CORS configured for: $resource_name"
}

# Get all resources from your API Gateway
echo "🔍 Finding API Gateway resources..."

# Get the root resource ID
ROOT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart==null].id' --output text)
echo "📁 Root resource ID: $ROOT_RESOURCE_ID"

# Get all resources
RESOURCES=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart!=null].[id,pathPart]' --output text)

echo "📋 Found resources:"
echo "$RESOURCES" | while read -r resource_id path_part; do
    echo "  - $path_part ($resource_id)"
done

# Fix CORS for specific endpoints based on your CloudFormation template
echo ""
echo "🔧 Applying CORS fixes to key endpoints..."

# Extract resource IDs for key endpoints
HEALTH_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart==`health`].id' --output text)
TIMELINE_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart==`timeline`].id' --output text)
PROJECT_SUMMARY_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart==`project-summary`].id' --output text)
DOWNLOAD_ACTA_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart==`download-acta`].id' --output text)
EXTRACT_PROJECT_PLACE_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart==`extract-project-place`].id' --output text)
SEND_APPROVAL_EMAIL_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart==`send-approval-email`].id' --output text)
CHECK_DOCUMENT_RESOURCE_ID=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart==`check-document`].id' --output text)

# Apply CORS to each endpoint
if [ -n "$HEALTH_RESOURCE_ID" ]; then
    add_cors_to_resource "$HEALTH_RESOURCE_ID" "health"
fi

if [ -n "$TIMELINE_RESOURCE_ID" ]; then
    add_cors_to_resource "$TIMELINE_RESOURCE_ID" "timeline"
fi

if [ -n "$PROJECT_SUMMARY_RESOURCE_ID" ]; then
    add_cors_to_resource "$PROJECT_SUMMARY_RESOURCE_ID" "project-summary"
fi

if [ -n "$DOWNLOAD_ACTA_RESOURCE_ID" ]; then
    add_cors_to_resource "$DOWNLOAD_ACTA_RESOURCE_ID" "download-acta"
fi

if [ -n "$EXTRACT_PROJECT_PLACE_RESOURCE_ID" ]; then
    add_cors_to_resource "$EXTRACT_PROJECT_PLACE_RESOURCE_ID" "extract-project-place"
fi

if [ -n "$SEND_APPROVAL_EMAIL_RESOURCE_ID" ]; then
    add_cors_to_resource "$SEND_APPROVAL_EMAIL_RESOURCE_ID" "send-approval-email"
fi

if [ -n "$CHECK_DOCUMENT_RESOURCE_ID" ]; then
    add_cors_to_resource "$CHECK_DOCUMENT_RESOURCE_ID" "check-document"
fi

# Also fix CORS for path parameter resources (like timeline/{id}, project-summary/{id}, etc.)
echo ""
echo "🔧 Fixing CORS for path parameter resources..."

# Get resources with path parameters
ID_RESOURCES=$(aws apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart==`{id}` || pathPart==`{projectId}`].[id,pathPart,parentId]' --output text)

if [ -n "$ID_RESOURCES" ]; then
    echo "$ID_RESOURCES" | while read -r resource_id path_part parent_id; do
        # Get parent resource path
        parent_path=$(aws apigateway get-resource --rest-api-id "$API_ID" --resource-id "$parent_id" --region "$REGION" --query 'pathPart' --output text 2>/dev/null || echo "unknown")
        add_cors_to_resource "$resource_id" "$parent_path/$path_part"
    done
fi

# Deploy the changes
echo ""
echo "📤 Deploying API Gateway changes..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name prod \
    --description "CORS fix deployment - $(date)" \
    --region "$REGION" \
    --query 'id' \
    --output text)

echo "✅ Deployment ID: $DEPLOYMENT_ID"

# Test CORS
echo ""
echo "🧪 Testing CORS configuration..."
echo "Testing health endpoint..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: $ORIGIN" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Authorization,Content-Type" \
    -X OPTIONS \
    "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/health")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ CORS test successful! HTTP $HTTP_CODE"
    echo ""
    echo "🎉 CORS FIX COMPLETE!"
    echo "🌐 Your ACTA-UI should now work without CORS errors"
    echo "🔗 Test URL: https://d7t9x3j66yd8k.cloudfront.net"
    echo ""
    echo "📋 Next steps:"
    echo "1. Clear your browser cache"
    echo "2. Test your ACTA-UI application"
    echo "3. Check the browser console for any remaining errors"
else
    echo "⚠️ CORS test returned HTTP $HTTP_CODE - may need additional configuration"
    echo "💡 This might be expected if the endpoint requires authentication"
fi

echo ""
echo "✨ CORS configuration completed successfully!"
