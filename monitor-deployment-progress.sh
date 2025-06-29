#!/bin/bash
# Deployment Progress Monitoring Script for ACTA-UI
# Monitors GitHub Actions workflows and AWS CloudFormation stack status

set -e

echo "📊 ACTA-UI Deployment Progress Monitor"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
REPO_OWNER="valencia94"
REPO_NAME="acta-ui"
STACK_NAME="acta-api-wiring-stack-manual"
REGION="us-east-2"
API_ID="q2b9avfwv5"

# GitHub API endpoints
GITHUB_API_BASE="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}"
WORKFLOWS_URL="${GITHUB_API_BASE}/actions/workflows"
RUNS_URL="${GITHUB_API_BASE}/actions/runs"

echo -e "${BLUE}📋 Monitoring Configuration:${NC}"
echo "  Repository: ${REPO_OWNER}/${REPO_NAME}"
echo "  CloudFormation Stack: ${STACK_NAME}"
echo "  AWS Region: ${REGION}"
echo "  API Gateway ID: ${API_ID}"
echo ""

# Function to check GitHub Actions workflows
check_github_workflows() {
    echo -e "${CYAN}🔍 Checking GitHub Actions Workflows...${NC}"
    
    if ! command -v curl >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠️  curl not available, skipping GitHub Actions check${NC}"
        return 0
    fi
    
    # Get recent workflow runs
    echo "  📋 Recent Workflow Runs:"
    
    local runs_response
    runs_response=$(curl -s "${RUNS_URL}?per_page=5" 2>/dev/null || echo '{"workflow_runs":[]}')
    
    # Parse the JSON response (simple parsing without jq)
    if echo "$runs_response" | grep -q "workflow_runs"; then
        echo "$runs_response" | grep -o '"name":"[^"]*"' | head -5 | while read -r line; do
            workflow_name=$(echo "$line" | sed 's/"name":"//g' | sed 's/"//g')
            echo "    • $workflow_name"
        done
        
        # Check for running workflows
        if echo "$runs_response" | grep -q '"status":"in_progress"'; then
            echo -e "${YELLOW}    🔄 Workflows currently running${NC}"
        elif echo "$runs_response" | grep -q '"status":"completed"'; then
            echo -e "${GREEN}    ✅ Recent workflows completed${NC}"
        fi
    else
        echo -e "${YELLOW}    ⚠️  Unable to fetch workflow status${NC}"
    fi
    echo ""
}

# Function to check CloudFormation stack status
check_cloudformation_stack() {
    echo -e "${CYAN}🔍 Checking CloudFormation Stack Status...${NC}"
    
    if ! command -v aws >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠️  AWS CLI not available, skipping CloudFormation check${NC}"
        return 0
    fi
    
    # Check if stack exists and get its status
    local stack_status
    stack_status=$(aws cloudformation describe-stacks \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --query 'Stacks[0].StackStatus' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    echo "  📦 Stack: $STACK_NAME"
    echo "  🌐 Region: $REGION"
    
    case "$stack_status" in
        "CREATE_COMPLETE")
            echo -e "  ✅ Status: ${GREEN}CREATE_COMPLETE${NC}"
            ;;
        "UPDATE_COMPLETE")
            echo -e "  ✅ Status: ${GREEN}UPDATE_COMPLETE${NC}"
            ;;
        "CREATE_IN_PROGRESS")
            echo -e "  🔄 Status: ${YELLOW}CREATE_IN_PROGRESS${NC}"
            ;;
        "UPDATE_IN_PROGRESS")
            echo -e "  🔄 Status: ${YELLOW}UPDATE_IN_PROGRESS${NC}"
            ;;
        "ROLLBACK_COMPLETE"|"UPDATE_ROLLBACK_COMPLETE")
            echo -e "  ⚠️  Status: ${YELLOW}ROLLBACK_COMPLETE${NC}"
            ;;
        "CREATE_FAILED"|"UPDATE_FAILED")
            echo -e "  ❌ Status: ${RED}FAILED${NC}"
            ;;
        "NOT_FOUND")
            echo -e "  📋 Status: ${BLUE}NOT_DEPLOYED${NC} (Stack not found)"
            ;;
        *)
            echo -e "  ❓ Status: ${PURPLE}$stack_status${NC}"
            ;;
    esac
    
    # Get stack events (last 5)
    if [ "$stack_status" != "NOT_FOUND" ]; then
        echo "  📝 Recent Stack Events:"
        aws cloudformation describe-stack-events \
            --stack-name "$STACK_NAME" \
            --region "$REGION" \
            --query 'StackEvents[0:4].[Timestamp,LogicalResourceId,ResourceStatus,ResourceStatusReason]' \
            --output table 2>/dev/null || echo "    Unable to fetch stack events"
    fi
    echo ""
}

# Function to check API Gateway deployment
check_api_gateway() {
    echo -e "${CYAN}🔍 Checking API Gateway Status...${NC}"
    
    local base_url="https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod"
    echo "  🌐 Base URL: $base_url"
    
    if ! command -v curl >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠️  curl not available, skipping API Gateway check${NC}"
        return 0
    fi
    
    # Test key endpoints
    local endpoints=(
        "/health:Health Check"
        "/project-summary/test:Project Summary"
        "/pm-projects/all-projects:PM Projects (All)"
        "/projects:Projects List"
        "/check-document/test:Document Status"
    )
    
    echo "  📋 Endpoint Status:"
    for endpoint_info in "${endpoints[@]}"; do
        IFS=':' read -r endpoint description <<< "$endpoint_info"
        
        local http_code
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "${base_url}${endpoint}" 2>/dev/null || echo "000")
        
        case "$http_code" in
            "200")
                echo -e "    ✅ $description: ${GREEN}$http_code${NC}"
                ;;
            "403")
                echo -e "    🔐 $description: ${YELLOW}$http_code (Auth Required)${NC}"
                ;;
            "404")
                echo -e "    ❌ $description: ${RED}$http_code (Not Found)${NC}"
                ;;
            "000")
                echo -e "    ⚠️  $description: ${RED}Timeout/Error${NC}"
                ;;
            *)
                echo -e "    ❓ $description: ${PURPLE}$http_code${NC}"
                ;;
        esac
    done
    echo ""
}

# Function to check frontend deployment
check_frontend_deployment() {
    echo -e "${CYAN}🔍 Checking Frontend Deployment...${NC}"
    
    if ! command -v curl >/dev/null 2>&1; then
        echo -e "${YELLOW}  ⚠️  curl not available, skipping frontend check${NC}"
        return 0
    fi
    
    # Try to determine the frontend URL from secrets or common patterns
    local frontend_urls=(
        "https://acta-ui.s3-website.us-east-2.amazonaws.com"
        "https://d1234567890123.cloudfront.net"
        "https://acta.example.com"
    )
    
    echo "  🌐 Frontend Status:"
    for url in "${frontend_urls[@]}"; do
        local http_code
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
        
        local domain
        domain=$(echo "$url" | sed 's|https://||' | sed 's|/.*||')
        
        case "$http_code" in
            "200")
                echo -e "    ✅ $domain: ${GREEN}$http_code (Available)${NC}"
                break
                ;;
            "000")
                echo -e "    ⚠️  $domain: ${YELLOW}Not reachable${NC}"
                ;;
            *)
                echo -e "    ❓ $domain: ${PURPLE}$http_code${NC}"
                ;;
        esac
    done
    echo ""
}

# Function to show deployment summary
show_deployment_summary() {
    echo -e "${BLUE}📊 Deployment Summary${NC}"
    echo "===================="
    
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
    echo "  📅 Check Time: $timestamp"
    echo ""
    
    echo -e "${BLUE}🔗 Useful Links:${NC}"
    echo "  • GitHub Actions: https://github.com/${REPO_OWNER}/${REPO_NAME}/actions"
    echo "  • AWS Console (CloudFormation): https://console.aws.amazon.com/cloudformation/home?region=${REGION}#/stacks"
    echo "  • AWS Console (API Gateway): https://console.aws.amazon.com/apigateway/home?region=${REGION}#/apis/${API_ID}"
    echo "  • AWS Console (Lambda): https://console.aws.amazon.com/lambda/home?region=${REGION}#/functions"
    echo ""
    
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo "  1. Monitor GitHub Actions for workflow completion"
    echo "  2. Check CloudFormation stack for successful deployment"
    echo "  3. Verify API Gateway endpoints are responding"
    echo "  4. Test frontend integration"
    echo "  5. Run comprehensive endpoint tests"
    echo ""
}

# Main execution
main() {
    check_github_workflows
    check_cloudformation_stack
    check_api_gateway
    check_frontend_deployment
    show_deployment_summary
    
    echo -e "${GREEN}🎉 Deployment Progress Check Complete!${NC}"
    echo ""
    echo -e "${BLUE}💡 Tip:${NC} Run this script periodically to monitor deployment progress"
    echo "       ${CYAN}./monitor-deployment-progress.sh${NC}"
}

# Handle script arguments
case "${1:-}" in
    "--help"|"-h")
        echo "Usage: $0 [--help|--watch]"
        echo ""
        echo "Options:"
        echo "  --help    Show this help message"
        echo "  --watch   Run in watch mode (refresh every 30 seconds)"
        echo ""
        echo "Examples:"
        echo "  $0                    # Run once"
        echo "  $0 --watch           # Run continuously"
        echo "  watch -n 30 $0       # Run every 30 seconds using 'watch'"
        exit 0
        ;;
    "--watch")
        echo -e "${YELLOW}🔄 Watch mode enabled. Press Ctrl+C to stop.${NC}"
        echo ""
        while true; do
            clear
            main
            echo -e "${CYAN}⏱️  Refreshing in 30 seconds...${NC}"
            sleep 30
        done
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
