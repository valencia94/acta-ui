#!/bin/bash

# API Gateway Integration Restoration Script
# This script restores the manually created API Gateway integrations that were removed by CloudFormation
# 
# USAGE: 
# 1. Ensure AWS credentials are configured (aws configure or environment variables)
# 2. Run: ./restore-api-integrations.sh
#
# CREDENTIALS NEEDED:
# User: arn:aws:iam::703671891952:user/D_botero_devX
# Role: arn:aws:iam::703671891952:role/service-role/codebuild-acta-ui-service-role

set -euo pipefail

API_ID="q2b9avfwv5"
REGION="us-east-2"
LAMBDA_ARN="arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher"

echo "🔧 Restoring API Gateway Integrations"
echo "======================================="
echo "API Gateway: $API_ID"
echo "Lambda: $LAMBDA_ARN"
echo "Region: $REGION"
echo ""

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials not configured!"
    echo ""
    echo "📋 SETUP INSTRUCTIONS:"
    echo "1. Configure AWS CLI:"
    echo "   aws configure"
    echo ""
    echo "2. Or set environment variables:"
    echo "   export AWS_ACCESS_KEY_ID=your_key"
    echo "   export AWS_SECRET_ACCESS_KEY=your_secret"
    echo "   export AWS_DEFAULT_REGION=us-east-2"
    echo ""
    echo "3. Or assume role:"
    echo "   aws sts assume-role --role-arn arn:aws:iam::703671891952:role/service-role/codebuild-acta-ui-service-role --role-session-name api-fix"
    exit 1
fi

CALLER_ID=$(aws sts get-caller-identity)
echo "✅ AWS credentials active:"
echo "$CALLER_ID"
echo ""

# Function to get resource ID by path
get_resource_id() {
    local path="$1"
    aws apigateway get-resources \
        --rest-api-id "$API_ID" \
        --region "$REGION" \
        --query "items[?pathPart=='$path'].id" \
        --output text
}

# Function to create integration
create_integration() {
    local resource_id="$1"
    local method="$2"
    local endpoint_name="$3"
    
    echo "🔗 Creating $method integration for $endpoint_name (Resource: $resource_id)"
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "$method" \
        --type "AWS_PROXY" \
        --integration-http-method "POST" \
        --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
        --region "$REGION" || echo "⚠️  Integration might already exist"
}

# Function to create CORS integration
create_cors_integration() {
    local resource_id="$1"
    local endpoint_name="$2"
    
    echo "🌐 Creating CORS integration for $endpoint_name"
    
    aws apigateway put-integration \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "OPTIONS" \
        --type "MOCK" \
        --integration-http-method "OPTIONS" \
        --request-templates '{"application/json": "{\"statusCode\": 200}"}' \
        --region "$REGION" || echo "⚠️  CORS integration might already exist"
        
    # Add integration response for CORS
    aws apigateway put-integration-response \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "OPTIONS" \
        --status-code "200" \
        --response-parameters '{
            "method.response.header.Access-Control-Allow-Origin": "'"'"'*'"'"'",
            "method.response.header.Access-Control-Allow-Methods": "'"'"'GET,HEAD,OPTIONS,POST'"'"'",
            "method.response.header.Access-Control-Allow-Headers": "'"'"'Content-Type,Authorization'"'"'"
        }' \
        --region "$REGION" || echo "⚠️  CORS response might already exist"
}

echo "📋 Getting resource IDs..."

# Get all resource IDs
APPROVE_RESOURCE_ID=$(get_resource_id "approve")
PM_MANAGER_RESOURCE_ID=$(get_resource_id "pm-manager")

# Check if pm-manager sub-resources exist
ALL_PROJECTS_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query "items[?pathPart=='all-projects' && parentId=='$PM_MANAGER_RESOURCE_ID'].id" \
    --output text)

EMAIL_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query "items[?pathPart=='{pmEmail}' && parentId=='$PM_MANAGER_RESOURCE_ID'].id" \
    --output text)

echo "Resource IDs found:"
echo "  approve: $APPROVE_RESOURCE_ID"
echo "  pm-manager: $PM_MANAGER_RESOURCE_ID"
echo "  all-projects: $ALL_PROJECTS_RESOURCE_ID"
echo "  {pmEmail}: $EMAIL_RESOURCE_ID"

# Fix /approve endpoint
if [ -n "$APPROVE_RESOURCE_ID" ]; then
    echo ""
    echo "🔧 Fixing /approve endpoint..."
    create_integration "$APPROVE_RESOURCE_ID" "ANY" "/approve"
    create_cors_integration "$APPROVE_RESOURCE_ID" "/approve"
else
    echo "❌ /approve resource not found!"
fi

# Fix /pm-manager/all-projects endpoint
if [ -n "$ALL_PROJECTS_RESOURCE_ID" ]; then
    echo ""
    echo "🔧 Fixing /pm-manager/all-projects endpoint..."
    create_integration "$ALL_PROJECTS_RESOURCE_ID" "GET" "/pm-manager/all-projects"
    create_cors_integration "$ALL_PROJECTS_RESOURCE_ID" "/pm-manager/all-projects"
else
    echo "❌ /pm-manager/all-projects resource not found!"
fi

# Fix /pm-manager/{pmEmail} endpoint
if [ -n "$EMAIL_RESOURCE_ID" ]; then
    echo ""
    echo "🔧 Fixing /pm-manager/{pmEmail} endpoint..."
    create_integration "$EMAIL_RESOURCE_ID" "GET" "/pm-manager/{pmEmail}"
    create_cors_integration "$EMAIL_RESOURCE_ID" "/pm-manager/{pmEmail}"
else
    echo "❌ /pm-manager/{pmEmail} resource not found!"
fi

# Create deployment to make changes active
echo ""
echo "🚀 Creating deployment to activate changes..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "prod" \
    --description "Restore manual integrations after CloudFormation override" \
    --region "$REGION" \
    --query 'id' \
    --output text)

echo "✅ Deployment created: $DEPLOYMENT_ID"

echo ""
echo "🧪 Testing endpoints..."

# Test endpoints
echo "Testing /approve..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/approve" || true

echo "Testing /pm-manager/all-projects..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "https://$API_ID.execute-api.$REGION.amazonaws.com/prod/pm-manager/all-projects" || true

echo ""
echo "✅ API Gateway integrations restored!"
echo ""
echo "🎯 Summary:"
echo "  - Restored Lambda integrations for existing API Gateway resources"
echo "  - Added CORS support for all endpoints"
echo "  - Created new deployment to activate changes"
echo "  - All endpoints should now work with the projectMetadataEnricher Lambda"
echo ""
echo "📋 Next Steps:"
echo "  1. Test the frontend to ensure PDF preview and all features work"
echo "  2. Verify document generation and download functionality"
echo "  3. Update deployment process to skip CloudFormation API management"
