#!/bin/bash

# Deploy Cognito Custom Domain Configuration
# This script creates a custom domain for the existing Cognito User Pool

set -e

echo "🔐 Deploying Cognito Custom Domain Configuration"
echo "================================================"

# Configuration
STACK_NAME="acta-ui-cognito-domain"
TEMPLATE_FILE="infra/cognito-custom-domain.yaml"
AWS_REGION="us-east-2"

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed or not in PATH"
    exit 1
fi

# Check if template file exists
if [ ! -f "$TEMPLATE_FILE" ]; then
    echo "❌ Template file not found: $TEMPLATE_FILE"
    exit 1
fi

echo "📋 Stack Name: $STACK_NAME"
echo "📋 Template: $TEMPLATE_FILE"
echo "📋 Region: $AWS_REGION"
echo ""

# Check if stack already exists
if aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" &> /dev/null; then
    echo "📦 Stack exists. Updating..."
    OPERATION="update-stack"
    WAIT_CONDITION="stack-update-complete"
else
    echo "📦 Creating new stack..."
    OPERATION="create-stack"
    WAIT_CONDITION="stack-create-complete"
fi

# Deploy the stack
echo "🚀 Deploying CloudFormation stack..."
aws cloudformation $OPERATION \
    --stack-name "$STACK_NAME" \
    --template-body file://"$TEMPLATE_FILE" \
    --region "$AWS_REGION" \
    --capabilities CAPABILITY_IAM \
    --parameters \
        ParameterKey=CognitoUserPoolId,ParameterValue=us-east-2_FyHLtOhiY \
        ParameterKey=DomainName,ParameterValue=acta-ui-prod \
        ParameterKey=CloudWatchLogsPolicyId,ParameterValue=WDnzkPmx3dKaEAQgFKx2jj

echo "⏳ Waiting for stack deployment to complete..."
aws cloudformation wait "$WAIT_CONDITION" \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION"

if [ $? -eq 0 ]; then
    echo "✅ Stack deployment completed successfully!"
    echo ""
    
    # Get stack outputs
    echo "📋 Stack Outputs:"
    echo "=================="
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
        
    echo ""
    echo "🔧 Next Steps:"
    echo "1. Update your aws-exports.js file with the new domain"
    echo "2. Update your .env file if needed"
    echo "3. Test the authentication flow"
    echo "4. Commit and deploy the configuration changes"
    
else
    echo "❌ Stack deployment failed!"
    
    # Show stack events for debugging
    echo "📋 Recent stack events:"
    aws cloudformation describe-stack-events \
        --stack-name "$STACK_NAME" \
        --region "$AWS_REGION" \
        --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`].[ResourceType,LogicalResourceId,ResourceStatusReason]' \
        --output table
    
    exit 1
fi
