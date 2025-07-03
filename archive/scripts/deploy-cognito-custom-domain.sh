#!/bin/bash

# =============================================================================
# ACTA-UI Cognito Custom Domain Deployment Script
# =============================================================================
# This script deploys a custom domain for the existing Cognito User Pool
# and updates the application configuration accordingly.

set -e

echo "🚀 ACTA-UI Cognito Custom Domain Deployment"
echo "============================================"

# Configuration
STACK_NAME="acta-ui-cognito-domain"
TEMPLATE_FILE="infra/cognito-custom-domain.yaml"
REGION="us-east-2"
USER_POOL_ID="us-east-2_FyHLtOhiY"
DOMAIN_NAME="acta-ui-prod"
CLOUDWATCH_POLICY_ID="WDnzkPmx3dKaEAQgFKx2jj"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
log_info "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Get current AWS account info
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-2")
log_success "AWS Account: $AWS_ACCOUNT, Region: $AWS_REGION"

# Validate template
log_info "Validating CloudFormation template..."
if aws cloudformation validate-template --template-body file://$TEMPLATE_FILE --region $REGION &> /dev/null; then
    log_success "Template is valid"
else
    log_error "Template validation failed"
    exit 1
fi

# Check if stack exists
log_info "Checking if stack exists..."
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION &> /dev/null; then
    log_info "Stack exists, updating..."
    OPERATION="update-stack"
else
    log_info "Stack does not exist, creating..."
    OPERATION="create-stack"
fi

# Deploy the stack
log_info "Deploying Cognito custom domain..."
aws cloudformation $OPERATION \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --region $REGION \
    --parameters \
        ParameterKey=CognitoUserPoolId,ParameterValue=$USER_POOL_ID \
        ParameterKey=DomainName,ParameterValue=$DOMAIN_NAME \
        ParameterKey=CloudWatchLogsPolicyId,ParameterValue=$CLOUDWATCH_POLICY_ID \
    --capabilities CAPABILITY_IAM \
    --on-failure DELETE

if [ $? -eq 0 ]; then
    log_success "CloudFormation deployment initiated"
else
    log_error "CloudFormation deployment failed"
    exit 1
fi

# Wait for stack completion
log_info "Waiting for stack deployment to complete..."
aws cloudformation wait stack-${OPERATION%-stack}-complete \
    --stack-name $STACK_NAME \
    --region $REGION

if [ $? -eq 0 ]; then
    log_success "Stack deployment completed successfully"
else
    log_error "Stack deployment failed or timed out"
    exit 1
fi

# Get stack outputs
log_info "Retrieving stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs' \
    --output json)

if [ $? -eq 0 ]; then
    echo "$OUTPUTS" > cognito-domain-outputs.json
    log_success "Stack outputs saved to cognito-domain-outputs.json"
    
    # Extract key values
    DOMAIN_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoDomainURL") | .OutputValue')
    CLIENT_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoUserPoolClientId") | .OutputValue')
    LOGIN_URL=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="CognitoLoginURL") | .OutputValue')
    
    echo ""
    log_success "🎉 DEPLOYMENT COMPLETE!"
    echo "========================"
    echo "Domain URL: $DOMAIN_URL"
    echo "Client ID: $CLIENT_ID"
    echo "Login URL: $LOGIN_URL"
    echo "Policy ID: $CLOUDWATCH_POLICY_ID"
    echo ""
    
    # Update aws-exports.js
    log_info "Updating aws-exports.js configuration..."
    DOMAIN_ONLY=$(echo "$DOMAIN_URL" | sed 's|https://||' | sed 's|/.*||')
    
    # Create backup
    cp src/aws-exports.js src/aws-exports.js.backup
    
    # Update the domain in aws-exports.js
    sed -i "s|domain: '[^']*'|domain: '$DOMAIN_ONLY'|g" src/aws-exports.js
    sed -i "s|aws_user_pools_web_client_id: '[^']*'|aws_user_pools_web_client_id: '$CLIENT_ID'|g" src/aws-exports.js
    
    log_success "aws-exports.js updated successfully"
    log_info "Backup saved as src/aws-exports.js.backup"
    
else
    log_error "Failed to retrieve stack outputs"
    exit 1
fi

# Test the domain
log_info "Testing custom domain accessibility..."
OPENID_CONFIG_URL="$DOMAIN_URL/.well-known/openid_configuration"
if curl -s "$OPENID_CONFIG_URL" &> /dev/null; then
    log_success "Custom domain is accessible"
else
    log_warning "Custom domain may not be ready yet (DNS propagation can take up to 60 minutes)"
fi

# Summary
echo ""
log_success "🎯 DEPLOYMENT SUMMARY"
echo "====================="
echo "✅ Custom domain deployed: $DOMAIN_URL"
echo "✅ Client ID updated: $CLIENT_ID"
echo "✅ CloudWatch Policy ID: $CLOUDWATCH_POLICY_ID"
echo "✅ Configuration files updated"
echo ""
echo "📋 Next Steps:"
echo "1. Wait for DNS propagation (up to 60 minutes)"
echo "2. Test authentication flow"
echo "3. Deploy frontend changes"
echo ""
echo "🔗 Login URL: $LOGIN_URL"
