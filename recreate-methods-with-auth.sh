#!/bin/bash

# Direct API Gateway Method Recreation with Authorization
# This script recreates specific methods with proper Cognito authorization

echo "🔧 RECREATING API GATEWAY METHODS WITH AUTHORIZATION"
echo "====================================================="

API_ID="q2b9avfwv5" 
REGION="us-east-2"
AUTHORIZER_ID="a7jeu9"

echo "Using API ID: $API_ID"
echo "Using Authorizer ID: $AUTHORIZER_ID"

# Function to get Lambda function ARN for integration
get_lambda_arn() {
    case $1 in
        "timeline")
            echo "arn:aws:lambda:us-east-2:703671891952:function:getTimeline"
            ;;
        "project-summary")
            echo "arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher"
            ;;
        "download-acta")
            echo "arn:aws:lambda:us-east-2:703671891952:function:GetDownloadActa"
            ;;
        "extract-project")
            echo "arn:aws:lambda:us-east-2:703671891952:function:ProjectPlaceDataExtractor"
            ;;
        "send-approval")
            echo "arn:aws:lambda:us-east-2:703671891952:function:SendApprovalEmail"
            ;;
    esac
}

# Function to recreate method with authorization
recreate_method_with_auth() {
    local resource_id="$1"
    local http_method="$2" 
    local function_name="$3"
    local endpoint_name="$4"
    
    echo ""
    echo "🔧 Recreating $endpoint_name method..."
    
    # Delete existing method
    echo "Deleting existing method..."
    aws apigateway delete-method \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "$http_method" \
        --region "$REGION" 2>/dev/null || echo "Method may not exist"
    
    # Get Lambda function ARN
    local lambda_arn=$(get_lambda_arn "$function_name")
    
    # Create new method with authorization
    echo "Creating new method with Cognito authorization..."
    aws apigateway put-method \
        --rest-api-id "$API_ID" \
        --resource-id "$resource_id" \
        --http-method "$http_method" \
        --authorization-type "COGNITO_USER_POOLS" \
        --authorizer-id "$AUTHORIZER_ID" \
        --region "$REGION"
    
    if [ $? -eq 0 ]; then
        echo "✅ Method created with authorization"
        
        # Create integration
        echo "Creating Lambda integration..."
        aws apigateway put-integration \
            --rest-api-id "$API_ID" \
            --resource-id "$resource_id" \
            --http-method "$http_method" \
            --type "AWS_PROXY" \
            --integration-http-method "POST" \
            --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$lambda_arn/invocations" \
            --region "$REGION"
        
        if [ $? -eq 0 ]; then
            echo "✅ Integration created"
        else
            echo "❌ Failed to create integration"
        fi
    else
        echo "❌ Failed to create method"
    fi
}

# Recreate each protected endpoint with proper authorization
recreate_method_with_auth "34dp4r" "GET" "timeline" "Timeline"
recreate_method_with_auth "dekkk2" "GET" "project-summary" "Project Summary"  
recreate_method_with_auth "i4rvyr" "GET" "download-acta" "Download ACTA"
recreate_method_with_auth "qzuik1" "POST" "extract-project" "Extract Project Place"
recreate_method_with_auth "lgb8i5" "POST" "send-approval" "Send Approval Email"

echo ""
echo "🚀 DEPLOYING CHANGES"
echo "===================="

# Deploy changes
aws apigateway create-deployment \
    --rest-api-id "$API_ID" \
    --stage-name "prod" \
    --description "Recreated methods with Cognito authorization - $(date)" \
    --region "$REGION"

echo "✅ Deployment created"

echo ""
echo "⏳ Waiting for changes to propagate..."
sleep 30

echo ""
echo "🔍 TESTING SECURITY"
echo "==================="

# Test endpoints
echo "Testing Timeline endpoint..."
curl -s -w "Status: %{http_code}\n" -o /dev/null https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/timeline/1000000049842296

echo "Testing Project Summary endpoint..."  
curl -s -w "Status: %{http_code}\n" -o /dev/null https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/project-summary/1000000049842296

echo "Testing Download ACTA endpoint..."
curl -s -w "Status: %{http_code}\n" -o /dev/null https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/download-acta/1000000049842296

echo ""
echo "🎉 METHOD RECREATION COMPLETE"
echo "=============================="
