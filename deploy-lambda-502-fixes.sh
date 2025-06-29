#!/usr/bin/env bash

# Deploy Lambda Functions to Fix 502 Errors
# This script fixes all the 502/504 errors identified in the system test

set -e

echo "🚀 Deploying Lambda Functions to Fix 502 Errors"
echo "==============================================="

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured or expired"
    echo "Please provide fresh AWS credentials"
    exit 1
fi

echo "✅ AWS credentials verified"

# Function to create or update Lambda function
deploy_lambda() {
    local function_name=$1
    local zip_file=$2
    local description=$3
    
    echo "🔧 Deploying $function_name..."
    
    # Check if function exists
    if aws lambda get-function --function-name "$function_name" > /dev/null 2>&1; then
        echo "   Updating existing function: $function_name"
        aws lambda update-function-code \
            --function-name "$function_name" \
            --zip-file "fileb://$zip_file"
        
        aws lambda update-function-configuration \
            --function-name "$function_name" \
            --description "$description" \
            --timeout 30 \
            --memory-size 256
    else
        echo "   Creating new function: $function_name"
        aws lambda create-function \
            --function-name "$function_name" \
            --runtime python3.9 \
            --role "arn:aws:iam::703671891952:role/lambda-execution-role" \
            --handler "lambda_function.lambda_handler" \
            --zip-file "fileb://$zip_file" \
            --description "$description" \
            --timeout 30 \
            --memory-size 256
    fi
    
    # Add API Gateway invoke permission
    aws lambda add-permission \
        --function-name "$function_name" \
        --statement-id "api-gateway-invoke" \
        --action "lambda:InvokeFunction" \
        --principal "apigateway.amazonaws.com" \
        --source-arn "arn:aws:execute-api:us-east-2:703671891952:q2b9avfwv5/*/*" \
        > /dev/null 2>&1 || echo "   Permission already exists"
    
    echo "   ✅ $function_name deployed successfully"
}

# Navigate to lambda functions directory
cd /workspaces/acta-ui/lambda-functions

# Deploy each Lambda function that's causing 502 errors
echo "📦 Deploying Lambda functions to fix 502 errors..."

deploy_lambda "getProjectSummary" "getProjectSummary.zip" "Gets project summary data for ACTA-UI"
deploy_lambda "getTimeline" "getTimeline.zip" "Gets project timeline data for ACTA-UI"  
deploy_lambda "getDownloadActa" "getDownloadActa.zip" "Handles ACTA document downloads (PDF/DOCX)"
deploy_lambda "sendApprovalEmail" "sendApprovalEmail.zip" "Sends approval emails for ACTA documents"

echo ""
echo "🧪 Testing deployed functions..."

# Test each function individually
test_lambda() {
    local function_name=$1
    echo -n "   Testing $function_name... "
    
    if aws lambda invoke \
        --function-name "$function_name" \
        --payload '{"test": true}' \
        /tmp/lambda-test-output.json > /dev/null 2>&1; then
        echo "✅ Working"
    else
        echo "❌ Failed"
        cat /tmp/lambda-test-output.json 2>/dev/null || echo ""
    fi
}

test_lambda "getProjectSummary"
test_lambda "getTimeline" 
test_lambda "getDownloadActa"
test_lambda "sendApprovalEmail"

echo ""
echo "🌐 Running system test to verify fixes..."
cd /workspaces/acta-ui
./test-complete-system.sh

echo ""
echo "✅ Lambda deployment complete!"
echo "Check the system test results above to verify all 502 errors are resolved."
