#!/usr/bin/env bash

# Create Missing Lambda Functions for ACTA-UI
set -euo pipefail

echo "🚀 Creating Missing Lambda Functions for ACTA-UI"
echo "==============================================="

REGION="us-east-2"
ROLE_ARN="arn:aws:iam::703671891952:role/service-role/codebuild-acta-ui-service-role"

# Function to create Lambda function
create_lambda_function() {
    local function_name=$1
    local zip_file=$2
    local description=$3
    
    echo "🔧 Creating Lambda function: $function_name..."
    
    # Check if function already exists
    if aws lambda get-function --region $REGION --function-name "$function_name" &>/dev/null; then
        echo "⚠️  Function $function_name already exists - updating code..."
        aws lambda update-function-code \
            --region $REGION \
            --function-name "$function_name" \
            --zip-file "fileb://$zip_file" && \
        echo "✅ $function_name updated successfully"
    else
        echo "📦 Creating new function: $function_name..."
        aws lambda create-function \
            --region $REGION \
            --function-name "$function_name" \
            --runtime python3.9 \
            --role "$ROLE_ARN" \
            --handler "${function_name}.lambda_handler" \
            --zip-file "fileb://$zip_file" \
            --description "$description" \
            --timeout 30 \
            --memory-size 256 && \
        echo "✅ $function_name created successfully"
    fi
}

# Create all the missing Lambda functions
echo "📋 Creating Lambda functions for button fixes..."

# Check if zip files exist
if [ ! -f "lambda-functions/getProjectSummary.zip" ]; then
    echo "❌ Lambda function packages not found. Run fix-lambda-functions.sh first."
    exit 1
fi

# Create the functions
create_lambda_function "GetProjectSummary" "lambda-functions/getProjectSummary.zip" "Fixed Project Summary Lambda for ACTA-UI summary button"
create_lambda_function "GetTimeline" "lambda-functions/getTimeline.zip" "Fixed Timeline Lambda for ACTA-UI timeline button"
create_lambda_function "GetDownloadActa" "lambda-functions/getDownloadActa.zip" "Fixed Download ACTA Lambda for ACTA-UI download buttons"
create_lambda_function "SendApprovalEmail" "lambda-functions/sendApprovalEmail.zip" "Fixed Send Approval Email Lambda for ACTA-UI approval button"

echo -e "\n🔧 Setting up API Gateway permissions..."

# Add API Gateway permissions for each function
functions=("GetProjectSummary" "GetTimeline" "GetDownloadActa" "SendApprovalEmail")

for func in "${functions[@]}"; do
    echo "🔒 Adding API Gateway permission for $func..."
    aws lambda add-permission \
        --region $REGION \
        --function-name "$func" \
        --statement-id "apigateway-invoke-$func" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:execute-api:$REGION:703671891952:q2b9avfwv5/*" 2>/dev/null || \
    echo "⚠️  Permission for $func may already exist"
done

echo -e "\n📊 SUMMARY"
echo "=========="
echo "✅ Lambda functions created/updated:"
echo "   - GetProjectSummary (for /project-summary/{id})"
echo "   - GetTimeline (for /timeline/{id})"
echo "   - GetDownloadActa (for /download-acta/{id})"
echo "   - SendApprovalEmail (for /send-approval-email)"
echo ""
echo "🔗 API Gateway permissions configured"
echo ""
echo "🚀 Ready to deploy API Gateway wiring!"

echo -e "\n💡 NEXT STEPS:"
echo "1. Deploy API Gateway wiring to connect endpoints to Lambda functions"
echo "2. Run test-complete-system.sh to verify fixes"
echo "3. Test buttons in production with authentication"
