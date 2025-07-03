#!/usr/bin/env bash
set -euo pipefail

echo "🔧 Deploying Enhanced projectMetadataEnricher Lambda"
echo "=================================================="

# Configuration
FUNCTION_NAME="projectMetadataEnricher"
LAMBDA_FILE="/workspaces/acta-ui/fixed-projectMetadataEnricher.py"
ZIP_FILE="/tmp/${FUNCTION_NAME}.zip"
AWS_REGION="us-east-2"

echo "📦 Step 1: Creating deployment package..."
# Create the deployment zip
cd /tmp
rm -f "$ZIP_FILE"
cp "$LAMBDA_FILE" lambda_function.py
zip "$ZIP_FILE" lambda_function.py
rm lambda_function.py

echo "🚀 Step 2: Updating Lambda function..."
# Update the function code
aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$ZIP_FILE" \
    --region "$AWS_REGION"

echo "⚙️  Step 3: Updating function configuration..."
# Update timeout and memory for better performance
aws lambda update-function-configuration \
    --function-name "$FUNCTION_NAME" \
    --timeout 30 \
    --memory-size 256 \
    --region "$AWS_REGION"

echo "✅ Step 4: Testing the deployment..."
# Test the health endpoint
echo "Testing health endpoint..."
aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload '{"httpMethod":"GET","path":"/health","pathParameters":null,"queryStringParameters":null,"body":null}' \
    --region "$AWS_REGION" \
    /tmp/test_response.json

echo "Response:"
cat /tmp/test_response.json
echo

echo "🎉 Lambda function updated successfully!"
echo "   Function: $FUNCTION_NAME"
echo "   Region: $AWS_REGION"
echo "   Next: Run system test to verify all endpoints work"

# Cleanup
rm -f "$ZIP_FILE" /tmp/test_response.json
