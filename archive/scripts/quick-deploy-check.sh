#!/bin/bash
# Quick Deployment Status Check for ACTA-UI
# Simplified script for rapid deployment status checks

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 ACTA-UI Quick Deployment Check${NC}"
echo "================================="

# Configuration
STACK_NAME="acta-api-wiring-stack-manual"
REGION="us-east-2"
API_ID="q2b9avfwv5"
BASE_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"

# Quick CloudFormation check
echo -n "📦 CloudFormation Stack: "
if command -v aws >/dev/null 2>&1; then
    STACK_STATUS=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    case "$STACK_STATUS" in
        "CREATE_COMPLETE"|"UPDATE_COMPLETE")
            echo -e "${GREEN}✅ $STACK_STATUS${NC}"
            ;;
        "CREATE_IN_PROGRESS"|"UPDATE_IN_PROGRESS")
            echo -e "${YELLOW}🔄 $STACK_STATUS${NC}"
            ;;
        "NOT_FOUND")
            echo -e "${YELLOW}⚠️  NOT_DEPLOYED${NC}"
            ;;
        *)
            echo -e "${RED}❌ $STACK_STATUS${NC}"
            ;;
    esac
else
    echo -e "${YELLOW}⚠️  AWS CLI not available${NC}"
fi

# Quick API endpoints check
echo "🌐 API Endpoints:"
if command -v curl >/dev/null 2>&1; then
    # Test critical endpoints
    ENDPOINTS=(
        "/health:Health"
        "/pm-projects/all-projects:PM Projects"
        "/projects:Projects"
        "/check-document/test:Doc Status"
    )
    
    for endpoint_info in "${ENDPOINTS[@]}"; do
        IFS=':' read -r endpoint name <<< "$endpoint_info"
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "${BASE_URL}${endpoint}" 2>/dev/null || echo "000")
        
        echo -n "  $name: "
        case "$HTTP_CODE" in
            "200") echo -e "${GREEN}✅ $HTTP_CODE${NC}" ;;
            "403") echo -e "${YELLOW}🔐 $HTTP_CODE${NC}" ;;
            "404") echo -e "${RED}❌ $HTTP_CODE${NC}" ;;
            "000") echo -e "${RED}⚠️  Timeout${NC}" ;;
            *) echo -e "${YELLOW}❓ $HTTP_CODE${NC}" ;;
        esac
    done
else
    echo -e "  ${YELLOW}⚠️  curl not available${NC}"
fi

echo ""
echo -e "${BLUE}📋 Quick Actions:${NC}"
echo "  • Monitor: https://github.com/valencia94/acta-ui/actions"
echo "  • Test Backend: ./test-backend-postdeploy.sh"
echo "  • Full Monitor: ./monitor-deployment-progress.sh"
echo ""

# Return appropriate exit code
if [ "$STACK_STATUS" = "CREATE_COMPLETE" ] || [ "$STACK_STATUS" = "UPDATE_COMPLETE" ]; then
    echo -e "${GREEN}🎉 Deployment appears successful!${NC}"
    exit 0
elif [ "$STACK_STATUS" = "CREATE_IN_PROGRESS" ] || [ "$STACK_STATUS" = "UPDATE_IN_PROGRESS" ]; then
    echo -e "${YELLOW}🔄 Deployment in progress...${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Check deployment status manually${NC}"
    exit 1
fi
