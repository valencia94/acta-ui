#!/bin/bash

# Complete Lambda Functions Deployment Script
# Deploys all missing Lambda functions for ACTA-UI backend

set -e

echo "🚀 Starting Complete Lambda Functions Deployment..."

# Check if AWS CLI is available and configured
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install and configure AWS CLI first."
    exit 1
fi

# Set environment variables
export AWS_REGION=${AWS_REGION:-us-east-2}
export STACK_NAME="acta-ui-complete-lambda-stack"
export TEMPLATE_FILE="infra/template-complete-lambda.yaml"

# Check for required environment variables
if [ -z "$AWS_ROLE_ARN" ]; then
    echo "⚠️  AWS_ROLE_ARN not set. Using default IAM permissions."
fi

# Parameters for the CloudFormation template
EXISTING_API_ID="q2b9avfwv5"
EXISTING_API_ROOT_ID="kw8f8zihjg"
PROJECT_METADATA_ENRICHER_ARN="arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher"
S3_BUCKET="projectplace-dv-2025-x9a7b"
DYNAMODB_TABLE="ProjectPlace_DataExtrator_landing_table_v2"
LAMBDA_EXECUTION_ROLE="arn:aws:iam::703671891952:role/lambda-execution-role"
DEPLOYMENT_TIMESTAMP=$(date +"%Y%m%d-%H%M%S")

echo "📋 Deployment Configuration:"
echo "   Stack Name: $STACK_NAME"
echo "   API Gateway ID: $EXISTING_API_ID"
echo "   S3 Bucket: $S3_BUCKET"
echo "   DynamoDB Table: $DYNAMODB_TABLE"
echo "   Deployment Timestamp: $DEPLOYMENT_TIMESTAMP"
echo "   Template: $TEMPLATE_FILE"

# Validate the CloudFormation template
echo "✅ Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://$TEMPLATE_FILE \
    --region $AWS_REGION

if [ $? -ne 0 ]; then
    echo "❌ Template validation failed!"
    exit 1
fi

echo "✅ Template validation successful!"

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].StackName' \
    --output text 2>/dev/null || echo "NONE")

if [ "$STACK_EXISTS" = "NONE" ]; then
    echo "📦 Creating new CloudFormation stack..."
    OPERATION="create-stack"
else
    echo "🔄 Updating existing CloudFormation stack..."
    OPERATION="update-stack"
fi

# Deploy/Update the stack
echo "🚀 Deploying Lambda functions and API Gateway routes..."

aws cloudformation $OPERATION \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters \
        ParameterKey=ExistingApiId,ParameterValue=$EXISTING_API_ID \
        ParameterKey=ExistingApiRootResourceId,ParameterValue=$EXISTING_API_ROOT_ID \
        ParameterKey=ProjectMetadataEnricherArn,ParameterValue=$PROJECT_METADATA_ENRICHER_ARN \
        ParameterKey=ProjectMetadataEnricherFunctionName,ParameterValue=projectMetadataEnricher \
        ParameterKey=S3BucketName,ParameterValue=$S3_BUCKET \
        ParameterKey=DynamoDBTableName,ParameterValue=$DYNAMODB_TABLE \
        ParameterKey=LambdaExecutionRoleArn,ParameterValue=$LAMBDA_EXECUTION_ROLE \
        ParameterKey=DeploymentTimestamp,ParameterValue=$DEPLOYMENT_TIMESTAMP \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION

if [ $? -ne 0 ]; then
    echo "❌ Stack deployment failed!"
    exit 1
fi

echo "⏳ Waiting for stack deployment to complete..."

# Wait for stack operation to complete
aws cloudformation wait stack-${OPERATION%-stack}-complete \
    --stack-name $STACK_NAME \
    --region $AWS_REGION

if [ $? -ne 0 ]; then
    echo "❌ Stack deployment timed out or failed!"
    echo "📊 Check CloudFormation console for details."
    exit 1
fi

echo "✅ Stack deployment completed successfully!"

# Get stack outputs
echo "📋 Deployment Results:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

# Test the newly deployed endpoints
echo "🧪 Testing newly deployed endpoints..."

API_URL="https://$EXISTING_API_ID.execute-api.$AWS_REGION.amazonaws.com/prod"

echo "Testing endpoints (expecting 200 or 403):"

# Test /projects
echo -n "GET /projects: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/projects")
echo "HTTP $STATUS"

# Test /pm-projects/all-projects
echo -n "GET /pm-projects/all-projects: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/pm-projects/all-projects")
echo "HTTP $STATUS"

# Test /check-document/{id}
echo -n "GET /check-document/test123: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/check-document/test123")
echo "HTTP $STATUS"

# Test /download-acta/{id}
echo -n "GET /download-acta/test123: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/download-acta/test123")
echo "HTTP $STATUS"

echo ""
echo "🎉 Complete Lambda Functions Deployment Finished!"
echo ""
echo "📊 Summary:"
echo "   ✅ 4 new Lambda functions deployed"
echo "   ✅ API Gateway routes configured"
echo "   ✅ Permissions set up"
echo "   ✅ Production stage updated"
echo ""
echo "🔗 API Base URL: $API_URL"
echo ""
echo "📚 Available Endpoints:"
echo "   GET  /projects                    → projectsList Lambda"
echo "   GET  /pm-projects/all-projects    → projectsManager Lambda"
echo "   GET  /pm-projects/{pmEmail}       → projectsManager Lambda"
echo "   GET  /check-document/{id}         → documentStatus Lambda"
echo "   HEAD /check-document/{id}         → documentStatus Lambda"
echo "   GET  /download-acta/{id}          → downloadActa Lambda"
echo "   GET  /project-summary/{id}        → projectMetadataEnricher Lambda (existing)"
echo ""
echo "🏁 Next Steps:"
echo "   1. Run comprehensive endpoint testing"
echo "   2. Test frontend integration"
echo "   3. Monitor CloudWatch logs for any issues"
echo "   4. Update documentation if needed"
echo ""

# Optional: Run comprehensive post-deployment testing
if [ -f "./test-backend-postdeploy.sh" ]; then
    echo "🧪 Running comprehensive post-deployment tests..."
    ./test-backend-postdeploy.sh
fi
