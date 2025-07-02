#!/bin/bash

# Monitor CloudFormation deployment status and troubleshoot issues
# Usage: ./monitor-deployment-status.sh [stack-name] [region]

STACK_NAME="${1:-acta-api-wiring-stack-manual}"
REGION="${2:-us-east-2}"

echo "🔍 Monitoring CloudFormation Stack: $STACK_NAME"
echo "📍 Region: $REGION"
echo "=" | tr '=' '=' | head -c 50; echo

# Function to get stack status
get_stack_status() {
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "NONE"
}

# Function to get stack events
get_recent_events() {
    echo "📋 Recent Stack Events:"
    aws cloudformation describe-stack-events \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'StackEvents[0:10].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]' \
        --output table 2>/dev/null || echo "No events found"
}

# Function to get stack outputs
get_stack_outputs() {
    echo "📤 Stack Outputs:"
    aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].Outputs' \
        --output table 2>/dev/null || echo "No outputs available"
}

# Function to test API Gateway endpoints
test_endpoints() {
    echo "🧪 Testing API Gateway Endpoints:"
    
    BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
    
    # Test projects endpoint
    echo "Testing: $BASE_URL/projects"
    PROJECTS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/projects")
    echo "  → HTTP $PROJECTS_STATUS"
    
    # Test pm-manager endpoints
    echo "Testing: $BASE_URL/pm-manager/all-projects"
    PM_ALL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/pm-manager/all-projects")
    echo "  → HTTP $PM_ALL_STATUS"
    
    echo "Testing: $BASE_URL/pm-manager/test@example.com"
    PM_EMAIL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/pm-manager/test@example.com")
    echo "  → HTTP $PM_EMAIL_STATUS"
    
    # Test document check endpoint
    echo "Testing: $BASE_URL/check-document/123"
    DOC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/check-document/123")
    echo "  → HTTP $DOC_STATUS"
}

# Main monitoring loop
echo "🚀 Starting deployment monitoring..."
START_TIME=$(date +%s)

while true; do
    STATUS=$(get_stack_status)
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    
    echo ""
    echo "⏰ Time: $(date '+%H:%M:%S') (${ELAPSED}s elapsed)"
    echo "📊 Stack Status: $STATUS"
    
    case "$STATUS" in
        CREATE_IN_PROGRESS|UPDATE_IN_PROGRESS)
            echo "🔄 Deployment in progress..."
            get_recent_events
            ;;
        CREATE_COMPLETE|UPDATE_COMPLETE)
            echo "✅ Deployment completed successfully!"
            get_stack_outputs
            echo ""
            test_endpoints
            break
            ;;
        CREATE_FAILED|UPDATE_FAILED|ROLLBACK_COMPLETE|UPDATE_ROLLBACK_COMPLETE)
            echo "❌ Deployment failed!"
            get_recent_events
            echo ""
            echo "🔧 Troubleshooting Tips:"
            echo "1. Check the events above for specific error messages"
            echo "2. Verify that all Lambda functions exist and are deployable"
            echo "3. Check that API Gateway resources don't conflict with existing ones"
            echo "4. Ensure all required permissions are in place"
            echo "5. Review template syntax and resource dependencies"
            break
            ;;
        ROLLBACK_IN_PROGRESS|UPDATE_ROLLBACK_IN_PROGRESS)
            echo "🔄 Rolling back changes..."
            get_recent_events
            ;;
        NONE)
            echo "❓ Stack not found - check stack name and region"
            break
            ;;
        *)
            echo "❓ Unknown status: $STATUS"
            get_recent_events
            ;;
    esac
    
    # Wait before next check
    sleep 30
done

echo ""
echo "🏁 Monitoring completed at $(date)"
