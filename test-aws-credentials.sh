#!/bin/bash

# Test script to verify AWS credentials work
# This script will be used during deployment when real secrets are available

echo "🔧 Testing AWS Credentials and DynamoDB Access"
echo "==============================================="

# Check if AWS credentials are set
if [[ -z "$AWS_ACCESS_KEY_ID" || -z "$AWS_SECRET_ACCESS_KEY" ]]; then
    echo "❌ AWS credentials not found in environment"
    echo "   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    exit 1
fi

echo "✅ AWS credentials found in environment"
echo "   Access Key ID: ${AWS_ACCESS_KEY_ID:0:10}..."
echo "   Region: ${AWS_REGION:-us-east-2}"
echo "   S3 Bucket: ${S3_BUCKET_NAME:-projectplace-dv-2025-x9a7b}"
echo ""

# Test DynamoDB access using AWS CLI (if available)
if command -v aws &> /dev/null; then
    echo "🔍 Testing DynamoDB access with AWS CLI..."
    
    # List DynamoDB tables
    echo "📋 Listing DynamoDB tables..."
    aws dynamodb list-tables --region ${AWS_REGION:-us-east-2} --output table
    
    echo ""
    echo "📊 Testing ProjectsTable scan..."
    aws dynamodb scan \
        --table-name ProjectsTable \
        --region ${AWS_REGION:-us-east-2} \
        --max-items 5 \
        --output table
    
    echo ""
    echo "🪣 Testing S3 bucket access..."
    aws s3 ls s3://${S3_BUCKET_NAME:-projectplace-dv-2025-x9a7b}/ --region ${AWS_REGION:-us-east-2}
    
else
    echo "⚠️  AWS CLI not available - skipping direct tests"
    echo "   The application will test credentials at runtime"
fi

echo ""
echo "✅ Credential test complete"
echo "   If no errors above, credentials should work in the application"
