#!/usr/bin/env bash

# Lambda Function Debugging and Deployment Script
set -euo pipefail

echo "🔧 ACTA-UI Lambda Function Debugging & Deployment"
echo "================================================"

REGION="us-east-2"
API_ID="q2b9avfwv5"

# Function to check if AWS CLI is working
check_aws_access() {
    echo "🔍 Checking AWS access..."
    if aws sts get-caller-identity &>/dev/null; then
        echo "✅ AWS access confirmed"
        return 0
    else
        echo "❌ AWS access failed - check credentials"
        return 1
    fi
}

# Function to get CloudWatch logs for Lambda function
get_lambda_logs() {
    local function_name=$1
    echo "📋 Getting recent logs for $function_name..."
    
    # Get log group name
    log_group="/aws/lambda/$function_name"
    
    # Get recent logs (last 1 hour)
    aws logs filter-log-events \
        --region $REGION \
        --log-group-name "$log_group" \
        --start-time $(($(date +%s) * 1000 - 3600000)) \
        --query 'events[*].[timestamp,message]' \
        --output table || echo "❌ Failed to get logs for $function_name"
}

# Function to deploy Lambda function
deploy_lambda() {
    local function_name=$1
    local zip_file=$2
    
    echo "🚀 Deploying $function_name..."
    
    if [ -f "$zip_file" ]; then
        aws lambda update-function-code \
            --region $REGION \
            --function-name "$function_name" \
            --zip-file "fileb://$zip_file" && \
        echo "✅ $function_name deployed successfully" || \
        echo "❌ Failed to deploy $function_name"
    else
        echo "❌ Zip file $zip_file not found"
    fi
}

# Main execution
if ! check_aws_access; then
    echo "💡 To run this script, ensure AWS credentials are properly configured"
    echo "   Try: aws configure or set environment variables"
    exit 1
fi

echo -e "\n🔍 Step 1: Analyzing Lambda Function Errors"
echo "==========================================="

# List of Lambda functions that are having issues
problematic_functions=(
    "projectMetadataEnricher"
    "getTimeline" 
    "getProjectSummary"
    "getDownloadActa"
    "ProjectPlaceDataExtractor"
    "sendApprovalEmail"
)

for func in "${problematic_functions[@]}"; do
    echo -e "\n📋 Checking $func..."
    
    # Check if function exists
    if aws lambda get-function --region $REGION --function-name "$func" &>/dev/null; then
        echo "✅ Function $func exists"
        
        # Get function configuration
        echo "🔧 Configuration:"
        aws lambda get-function-configuration \
            --region $REGION \
            --function-name "$func" \
            --query '{Runtime:Runtime,Timeout:Timeout,MemorySize:MemorySize,LastModified:LastModified}' \
            --output table
            
        # Get recent logs
        get_lambda_logs "$func"
        
    else
        echo "❌ Function $func does not exist"
    fi
done

echo -e "\n🔍 Step 2: Checking API Gateway Integration"
echo "========================================="

# Test API Gateway to Lambda integration
endpoints_to_check=(
    "/project-summary/test"
    "/timeline/test"
    "/download-acta/test"
    "/extract-project-place/test"
)

for endpoint in "${endpoints_to_check[@]}"; do
    echo "Testing $endpoint integration..."
    
    # Check API Gateway resource
    aws apigateway get-resources \
        --region $REGION \
        --rest-api-id $API_ID \
        --query "items[?pathPart=='${endpoint##*/}'].{Path:path,Id:id}" \
        --output table || echo "❌ Failed to check $endpoint"
done

echo -e "\n🔍 Step 3: Lambda Function Deployment (if needed)"
echo "=============================================="

# Check if Lambda function files exist and deploy them
lambda_files=(
    "lambda-functions/projectMetadataEnricher.zip"
    "lambda-functions/getTimeline.zip"
    "lambda-functions/getProjectSummary.zip"
    "lambda-functions/getDownloadActa.zip"
)

for zip_file in "${lambda_files[@]}"; do
    function_name=$(basename "$zip_file" .zip)
    if [ -f "$zip_file" ]; then
        deploy_lambda "$function_name" "$zip_file"
    else
        echo "⚠️  $zip_file not found - will need to be created"
    fi
done

echo -e "\n📊 SUMMARY"
echo "=========="
echo "✅ Use this script to debug Lambda function issues"
echo "⚠️  Focus on functions showing 502 errors"
echo "🔧 Check CloudWatch logs for specific error messages"
echo "🚀 Deploy updated Lambda functions as needed"

echo -e "\n💡 NEXT STEPS:"
echo "1. Review CloudWatch logs above for specific errors"
echo "2. Fix Lambda function code based on error messages"
echo "3. Re-deploy fixed Lambda functions"
echo "4. Test endpoints again"
