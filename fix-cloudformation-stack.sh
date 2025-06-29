#!/bin/bash

# Cancel and reset CloudFormation stack that's stuck in UPDATE_ROLLBACK_IN_PROGRESS
# This script helps recover from failed deployments

set -euo pipefail

STACK_NAME="acta-api-wiring-stack-manual"
REGION="us-east-2"

echo "🔄 Checking CloudFormation stack status..."

# Get current stack status
STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || echo "STACK_NOT_FOUND")

echo "Current status: $STATUS"

case "$STATUS" in
    "UPDATE_ROLLBACK_IN_PROGRESS")
        echo "❌ Stack is stuck in UPDATE_ROLLBACK_IN_PROGRESS"
        echo "⏳ Waiting for rollback to complete..."
        
        # Wait for rollback to complete
        aws cloudformation wait stack-update-complete \
            --stack-name "$STACK_NAME" \
            --region "$REGION" || true
        
        # Check status again
        STATUS=$(aws cloudformation describe-stacks \
            --stack-name "$STACK_NAME" \
            --region "$REGION" \
            --query 'Stacks[0].StackStatus' \
            --output text 2>/dev/null || echo "STACK_NOT_FOUND")
        
        echo "Status after waiting: $STATUS"
        ;;
    
    "UPDATE_ROLLBACK_COMPLETE")
        echo "✅ Stack rollback completed successfully"
        echo "🚀 Ready for new deployment"
        ;;
    
    "CREATE_COMPLETE"|"UPDATE_COMPLETE")
        echo "✅ Stack is in good state: $STATUS"
        echo "🚀 Ready for deployment"
        ;;
    
    "STACK_NOT_FOUND")
        echo "❌ Stack not found - will be created on first deployment"
        ;;
    
    *)
        echo "⚠️  Unexpected stack status: $STATUS"
        echo "📋 Getting recent stack events for debugging..."
        
        aws cloudformation describe-stack-events \
            --stack-name "$STACK_NAME" \
            --region "$REGION" \
            --max-items 10 \
            --query 'StackEvents[?ResourceStatus==`CREATE_FAILED` || ResourceStatus==`UPDATE_FAILED`].[Timestamp,LogicalResourceId,ResourceStatusReason]' \
            --output table || true
        ;;
esac

echo ""
echo "💡 Next steps:"
echo "1. If stack is ready (CREATE_COMPLETE, UPDATE_COMPLETE, UPDATE_ROLLBACK_COMPLETE):"
echo "   → Run GitHub Actions workflow or manual deployment"
echo "2. If stack is still in progress:"
echo "   → Wait for it to complete, then run deployment"
echo "3. The new deployment uses 'template-permissions-only.yaml' which only manages Lambda permissions"
echo "   → This avoids conflicts with existing API Gateway resources"
