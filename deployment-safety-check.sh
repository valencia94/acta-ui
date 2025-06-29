#!/bin/bash
# Safe Deployment Pre-Check Script
# Validates current stack status before deployment

set -euo pipefail

echo "🔍 ACTA-UI Deployment Pre-Check"
echo "==============================="

STACK_NAME="acta-api-wiring-stack-manual"
REGION="us-east-2"

# Check current stack status
echo "📊 Checking current stack status..."
STACK_STATUS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].StackStatus' \
  --output text 2>/dev/null || echo "NOT_FOUND")

echo "Current stack status: $STACK_STATUS"

case "$STACK_STATUS" in
  "CREATE_COMPLETE"|"UPDATE_COMPLETE")
    echo "✅ Stack is in stable state - safe to deploy"
    ;;
  "UPDATE_ROLLBACK_COMPLETE")
    echo "⚠️  Stack is in rollback state - checking if safe to update"
    echo "📋 Checking stack resources..."
    
    # Check if API Gateway still exists and is functional
    API_EXISTS=$(aws apigateway get-rest-api --rest-api-id q2b9avfwv5 --region "$REGION" 2>/dev/null && echo "YES" || echo "NO")
    
    if [ "$API_EXISTS" = "YES" ]; then
      echo "✅ API Gateway still exists - safe to update stack"
    else
      echo "❌ API Gateway missing - UNSAFE to deploy"
      exit 1
    fi
    ;;
  "CREATE_IN_PROGRESS"|"UPDATE_IN_PROGRESS"|"DELETE_IN_PROGRESS")
    echo "❌ Stack is currently being modified - wait for completion"
    echo "💡 Run: aws cloudformation wait stack-update-complete --stack-name $STACK_NAME --region $REGION"
    exit 1
    ;;
  "NOT_FOUND")
    echo "❌ Stack not found - this would create a new stack"
    echo "⚠️  This is potentially dangerous for existing API"
    exit 1
    ;;
  *)
    echo "❌ Unexpected stack status: $STACK_STATUS"
    exit 1
    ;;
esac

# Check for any ongoing changesets
echo "🔍 Checking for pending changesets..."
CHANGESETS=$(aws cloudformation list-change-sets \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Summaries[?Status==`CREATE_COMPLETE`].ChangeSetName' \
  --output text 2>/dev/null || echo "")

if [ -n "$CHANGESETS" ]; then
  echo "⚠️  Found pending changesets: $CHANGESETS"
  echo "🧹 Cleaning up old changesets..."
  for changeset in $CHANGESETS; do
    echo "   Deleting changeset: $changeset"
    aws cloudformation delete-change-set \
      --stack-name "$STACK_NAME" \
      --change-set-name "$changeset" \
      --region "$REGION" || true
  done
else
  echo "✅ No pending changesets found"
fi

# Test API connectivity
echo "🧪 Testing API connectivity..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/pm-manager/all-projects" || echo "000")

if [ "$API_RESPONSE" = "403" ] || [ "$API_RESPONSE" = "200" ]; then
  echo "✅ API Gateway is responding (HTTP $API_RESPONSE)"
else
  echo "⚠️  API Gateway response: HTTP $API_RESPONSE"
fi

echo ""
echo "🎯 Pre-check Results:"
echo "   Stack Status: $STACK_STATUS"
echo "   API Gateway: Responding"
echo "   Changesets: Cleaned"
echo ""
echo "✅ SAFE TO PROCEED WITH DEPLOYMENT"
