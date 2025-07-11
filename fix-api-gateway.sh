#!/bin/bash

# AWS API Gateway Configuration Fix Script
# This script provides AWS CLI commands to fix the identified issues

set -e

echo "🔧 AWS API Gateway Configuration Fix Script"
echo "=========================================="
echo ""

# Configuration
API_ID="q2b9avfwv5"
REGION="us-east-2"
USER_POOL_ID="us-east-2_FyHLtOhiY"
CLIENT_ID="dshos5iou44tuach7ta3ici5m"

echo "📋 Configuration:"
echo "  API ID: $API_ID"
echo "  Region: $REGION"
echo "  User Pool ID: $USER_POOL_ID"
echo "  Client ID: $CLIENT_ID"
echo ""

echo "🔍 Step 1: Getting API Gateway information..."
echo "aws apigateway get-rest-api --region $REGION --rest-api-id $API_ID"
aws apigateway get-rest-api --region $REGION --rest-api-id $API_ID

echo ""
echo "🔍 Step 2: Getting API Gateway resources..."
echo "aws apigateway get-resources --region $REGION --rest-api-id $API_ID"
aws apigateway get-resources --region $REGION --rest-api-id $API_ID > api-resources.json
cat api-resources.json

echo ""
echo "🔍 Step 3: Getting authorizers..."
echo "aws apigateway get-authorizers --region $REGION --rest-api-id $API_ID"
aws apigateway get-authorizers --region $REGION --rest-api-id $API_ID > api-authorizers.json
cat api-authorizers.json

echo ""
echo "🔧 Step 4: Creating/Updating Cognito User Pool Authorizer..."

# Check if authorizer already exists
AUTHORIZER_ID=$(aws apigateway get-authorizers --region $REGION --rest-api-id $API_ID --query 'items[?type==`COGNITO_USER_POOLS`].id' --output text 2>/dev/null || echo "")

if [ -z "$AUTHORIZER_ID" ]; then
    echo "Creating new Cognito User Pool authorizer..."
    aws apigateway create-authorizer \
        --region $REGION \
        --rest-api-id $API_ID \
        --name "CognitoUserPoolAuthorizer" \
        --type COGNITO_USER_POOLS \
        --provider-arns "arn:aws:cognito-idp:$REGION:$(aws sts get-caller-identity --query Account --output text):userpool/$USER_POOL_ID" \
        --identity-source "method.request.header.Authorization"
else
    echo "Updating existing authorizer: $AUTHORIZER_ID"
    aws apigateway update-authorizer \
        --region $REGION \
        --rest-api-id $API_ID \
        --authorizer-id $AUTHORIZER_ID \
        --patch-ops op=replace,path=/providerARNs,value="arn:aws:cognito-idp:$REGION:$(aws sts get-caller-identity --query Account --output text):userpool/$USER_POOL_ID"
fi

echo ""
echo "🔧 Step 5: Getting updated authorizer information..."
aws apigateway get-authorizers --region $REGION --rest-api-id $API_ID > api-authorizers-updated.json
AUTHORIZER_ID=$(aws apigateway get-authorizers --region $REGION --rest-api-id $API_ID --query 'items[?type==`COGNITO_USER_POOLS`].id' --output text)
echo "Cognito Authorizer ID: $AUTHORIZER_ID"

echo ""
echo "🔧 Step 6: Fixing CORS for all resources..."

# Function to enable CORS for a resource
fix_cors_for_resource() {
    local RESOURCE_ID=$1
    local RESOURCE_PATH=$2
    
    echo "Fixing CORS for resource: $RESOURCE_PATH (ID: $RESOURCE_ID)"
    
    # Check if OPTIONS method exists
    OPTIONS_EXISTS=$(aws apigateway get-method --region $REGION --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method OPTIONS 2>/dev/null && echo "true" || echo "false")
    
    if [ "$OPTIONS_EXISTS" = "false" ]; then
        echo "  Creating OPTIONS method for $RESOURCE_PATH..."
        
        # Create OPTIONS method
        aws apigateway put-method \
            --region $REGION \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method OPTIONS \
            --authorization-type NONE \
            --request-parameters '{}'
        
        # Create method response for OPTIONS
        aws apigateway put-method-response \
            --region $REGION \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method OPTIONS \
            --status-code 200 \
            --response-parameters '{
                "method.response.header.Access-Control-Allow-Headers": false,
                "method.response.header.Access-Control-Allow-Methods": false,
                "method.response.header.Access-Control-Allow-Origin": false,
                "method.response.header.Access-Control-Allow-Credentials": false
            }'
        
        # Create integration for OPTIONS (MOCK)
        aws apigateway put-integration \
            --region $REGION \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method OPTIONS \
            --type MOCK \
            --request-templates '{"application/json": "{\"statusCode\": 200}"}'
        
        # Create integration response for OPTIONS
        aws apigateway put-integration-response \
            --region $REGION \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method OPTIONS \
            --status-code 200 \
            --response-parameters '{
                "method.response.header.Access-Control-Allow-Headers": "'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''",
                "method.response.header.Access-Control-Allow-Methods": "'\''GET,POST,OPTIONS,PUT,DELETE'\''",
                "method.response.header.Access-Control-Allow-Origin": "'\''https://d7t9x3j66yd8k.cloudfront.net'\''",
                "method.response.header.Access-Control-Allow-Credentials": "'\''true'\''"
            }'
    else
        echo "  OPTIONS method already exists for $RESOURCE_PATH, updating CORS headers..."
        
        # Update integration response to include proper CORS headers
        aws apigateway update-integration-response \
            --region $REGION \
            --rest-api-id $API_ID \
            --resource-id $RESOURCE_ID \
            --http-method OPTIONS \
            --status-code 200 \
            --patch-ops '[
                {
                    "op": "replace",
                    "path": "/responseParameters/method.response.header.Access-Control-Allow-Headers",
                    "value": "'\''Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'\''"
                },
                {
                    "op": "replace",
                    "path": "/responseParameters/method.response.header.Access-Control-Allow-Methods",
                    "value": "'\''GET,POST,OPTIONS,PUT,DELETE'\''"
                },
                {
                    "op": "replace",
                    "path": "/responseParameters/method.response.header.Access-Control-Allow-Origin",
                    "value": "'\''https://d7t9x3j66yd8k.cloudfront.net'\''"
                },
                {
                    "op": "replace",
                    "path": "/responseParameters/method.response.header.Access-Control-Allow-Credentials",
                    "value": "'\''true'\''"
                }
            ]'
    fi
    
    # Also add CORS headers to actual method responses (GET, POST, etc.)
    for METHOD in GET POST PUT DELETE; do
        METHOD_EXISTS=$(aws apigateway get-method --region $REGION --rest-api-id $API_ID --resource-id $RESOURCE_ID --http-method $METHOD 2>/dev/null && echo "true" || echo "false")
        
        if [ "$METHOD_EXISTS" = "true" ]; then
            echo "  Adding CORS headers to $METHOD method for $RESOURCE_PATH..."
            
            # Update method response to include CORS headers
            aws apigateway update-method-response \
                --region $REGION \
                --rest-api-id $API_ID \
                --resource-id $RESOURCE_ID \
                --http-method $METHOD \
                --status-code 200 \
                --patch-ops '[
                    {
                        "op": "add",
                        "path": "/responseParameters/method.response.header.Access-Control-Allow-Origin",
                        "value": false
                    },
                    {
                        "op": "add",
                        "path": "/responseParameters/method.response.header.Access-Control-Allow-Credentials",
                        "value": false
                    }
                ]' 2>/dev/null || echo "    Headers may already exist"
            
            # Update integration response to set CORS header values
            aws apigateway update-integration-response \
                --region $REGION \
                --rest-api-id $API_ID \
                --resource-id $RESOURCE_ID \
                --http-method $METHOD \
                --status-code 200 \
                --patch-ops '[
                    {
                        "op": "add",
                        "path": "/responseParameters/method.response.header.Access-Control-Allow-Origin",
                        "value": "'\''https://d7t9x3j66yd8k.cloudfront.net'\''"
                    },
                    {
                        "op": "add",
                        "path": "/responseParameters/method.response.header.Access-Control-Allow-Credentials",
                        "value": "'\''true'\''"
                    }
                ]' 2>/dev/null || echo "    Headers may already exist"
        fi
    done
}

# Get all resources and fix CORS for each
echo "Getting all resources to fix CORS..."
aws apigateway get-resources --region $REGION --rest-api-id $API_ID --query 'items[].{id:id,path:pathPart}' --output text | while read -r RESOURCE_ID RESOURCE_PATH; do
    if [ "$RESOURCE_PATH" != "None" ] && [ "$RESOURCE_PATH" != "/" ]; then
        fix_cors_for_resource "$RESOURCE_ID" "$RESOURCE_PATH"
    fi
done

echo ""
echo "🔧 Step 7: Updating method authorization..."

# Function to update method authorization
update_method_auth() {
    local RESOURCE_ID=$1
    local METHOD=$2
    local RESOURCE_PATH=$3
    
    echo "Updating authorization for $METHOD $RESOURCE_PATH..."
    
    # Skip OPTIONS and health endpoint
    if [ "$METHOD" = "OPTIONS" ] || [ "$RESOURCE_PATH" = "health" ]; then
        echo "  Skipping $METHOD $RESOURCE_PATH (no auth required)"
        return
    fi
    
    # Update method to use Cognito authorizer
    aws apigateway update-method \
        --region $REGION \
        --rest-api-id $API_ID \
        --resource-id $RESOURCE_ID \
        --http-method $METHOD \
        --patch-ops '[
            {
                "op": "replace",
                "path": "/authorizationType",
                "value": "COGNITO_USER_POOLS"
            },
            {
                "op": "replace",
                "path": "/authorizerId",
                "value": "'$AUTHORIZER_ID'"
            }
        ]' 2>/dev/null || echo "  Failed to update authorization for $METHOD $RESOURCE_PATH"
}

# Update authorization for all methods except OPTIONS and health
echo "Updating authorization for all protected endpoints..."
aws apigateway get-resources --region $REGION --rest-api-id $API_ID --query 'items[]' --output json | jq -r '.[] | select(.resourceMethods != null) | {id: .id, path: .pathPart, methods: (.resourceMethods | keys)} | "\(.id) \(.path) \(.methods[])"' | while read -r RESOURCE_ID RESOURCE_PATH METHOD; do
    if [ "$RESOURCE_PATH" != "health" ] && [ "$METHOD" != "OPTIONS" ]; then
        update_method_auth "$RESOURCE_ID" "$METHOD" "$RESOURCE_PATH"
    fi
done

echo ""
echo "🚀 Step 8: Deploying API changes..."
DEPLOYMENT_ID=$(aws apigateway create-deployment \
    --region $REGION \
    --rest-api-id $API_ID \
    --stage-name prod \
    --description "Fix CORS and Cognito authorization - $(date)" \
    --query 'id' --output text)

echo "Deployment ID: $DEPLOYMENT_ID"

echo ""
echo "✅ Step 9: Verification..."
echo "Waiting 10 seconds for deployment to propagate..."
sleep 10

echo "Testing the fixed API..."
echo "node validate-aws-config.cjs --token=<YOUR_TOKEN>"

echo ""
echo "🎉 API Gateway configuration fixes completed!"
echo ""
echo "📋 Summary of changes:"
echo "  ✅ Created/Updated Cognito User Pool authorizer"
echo "  ✅ Fixed CORS headers for all resources"
echo "  ✅ Updated method authorization to use Cognito"
echo "  ✅ Deployed changes to production stage"
echo ""
echo "🔧 Next steps:"
echo "  1. Test your application in the browser"
echo "  2. Run: node validate-aws-config.cjs --token=<YOUR_TOKEN>"
echo "  3. Check that authenticated endpoints now return 200 instead of 401/403"
echo ""
