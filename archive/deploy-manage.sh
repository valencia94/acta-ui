#!/bin/bash
# ACTA-UI Deployment Management Script
# Comprehensive deployment orchestration and monitoring

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}🚀 ACTA-UI Deployment Management${NC}"
echo "==============================="

# Help function
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  test-pre      Run pre-deployment tests"
    echo "  test-post     Run post-deployment tests"
    echo "  check         Quick deployment status check"
    echo "  monitor       Full deployment monitoring"
    echo "  watch         Monitor in watch mode"
    echo "  deploy        Deploy via local script"
    echo "  logs          Show recent deployment logs"
    echo "  endpoints     List all API endpoints"
    echo "  help          Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 test-pre           # Run proactive tests"
    echo "  $0 deploy             # Deploy using local script"
    echo "  $0 check              # Quick status check"
    echo "  $0 monitor            # Full monitoring"
    echo "  $0 watch              # Continuous monitoring"
    echo "  $0 test-post          # Test deployed endpoints"
    echo ""
}

# Pre-deployment testing
run_pre_tests() {
    echo -e "${CYAN}🧪 Running Pre-Deployment Tests...${NC}"
    if [ -x "./test-backend-proactive.sh" ]; then
        ./test-backend-proactive.sh
    else
        echo -e "${RED}❌ Pre-deployment test script not found${NC}"
        exit 1
    fi
}

# Post-deployment testing
run_post_tests() {
    echo -e "${CYAN}🧪 Running Post-Deployment Tests...${NC}"
    if [ -x "./test-backend-postdeploy.sh" ]; then
        ./test-backend-postdeploy.sh q2b9avfwv5 us-east-2 prod
    else
        echo -e "${RED}❌ Post-deployment test script not found${NC}"
        exit 1
    fi
}

# Quick status check
quick_check() {
    echo -e "${CYAN}⚡ Quick Deployment Check...${NC}"
    if [ -x "./quick-deploy-check.sh" ]; then
        ./quick-deploy-check.sh
    else
        echo -e "${RED}❌ Quick check script not found${NC}"
        exit 1
    fi
}

# Full monitoring
full_monitor() {
    echo -e "${CYAN}📊 Full Deployment Monitoring...${NC}"
    if [ -x "./monitor-deployment-progress.sh" ]; then
        ./monitor-deployment-progress.sh
    else
        echo -e "${RED}❌ Monitoring script not found${NC}"
        exit 1
    fi
}

# Watch mode
watch_mode() {
    echo -e "${CYAN}👀 Starting Watch Mode...${NC}"
    if [ -x "./monitor-deployment-progress.sh" ]; then
        ./monitor-deployment-progress.sh --watch
    else
        echo -e "${RED}❌ Monitoring script not found${NC}"
        exit 1
    fi
}

# Local deployment
local_deploy() {
    echo -e "${CYAN}🚀 Starting Local Deployment...${NC}"
    
    # Check if deployment script exists
    if [ -x "./deploy-simplified-backend.sh" ]; then
        echo -e "${YELLOW}Using deploy-simplified-backend.sh${NC}"
        ./deploy-simplified-backend.sh
    else
        echo -e "${YELLOW}No local deployment script found. Using AWS CLI directly...${NC}"
        
        # Run pre-tests first
        echo -e "${BLUE}Running pre-deployment tests...${NC}"
        run_pre_tests
        
        # Deploy CloudFormation
        echo -e "${BLUE}Deploying CloudFormation stack with API Gateway deployment...${NC}"
        TIMESTAMP=$(date +%Y%m%d-%H%M%S)
        
        aws cloudformation deploy \
            --template-file infra/template-simplified-lambda.yaml \
            --stack-name acta-api-wiring-stack-manual \
            --parameter-overrides \
              ExistingApiId=q2b9avfwv5 \
              ExistingApiRootResourceId=kw8f8zihjg \
              DeploymentTimestamp="$TIMESTAMP" \
            --capabilities CAPABILITY_IAM \
            --region us-east-2
        
        echo -e "${GREEN}✅ CloudFormation deployment completed (includes API Gateway deployment)!${NC}"
        
        # Run post-tests
        echo -e "${BLUE}Running post-deployment tests...${NC}"
        run_post_tests
    fi
}

# Show deployment logs
show_logs() {
    echo -e "${CYAN}📋 Recent Deployment Activity...${NC}"
    echo ""
    
    echo -e "${BLUE}Git Status:${NC}"
    git log --oneline -5
    echo ""
    
    echo -e "${BLUE}CloudFormation Events (if available):${NC}"
    if command -v aws >/dev/null 2>&1; then
        aws cloudformation describe-stack-events \
            --stack-name acta-api-wiring-stack-manual \
            --region us-east-2 \
            --query 'StackEvents[0:9].[Timestamp,LogicalResourceId,ResourceStatus]' \
            --output table 2>/dev/null || echo "Stack not found or no events"
    else
        echo "AWS CLI not available"
    fi
    echo ""
}

# List API endpoints
list_endpoints() {
    echo -e "${CYAN}🌐 ACTA-UI API Endpoints${NC}"
    echo "======================="
    
    local base_url="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
    
    echo -e "${BLUE}📋 PM/Admin Endpoints (New):${NC}"
    echo "  GET  $base_url/pm-projects/all-projects"
    echo "  GET  $base_url/pm-projects/{pmEmail}"
    echo "  GET  $base_url/projects"
    echo "  GET  $base_url/check-document/{projectId}"
    echo "  HEAD $base_url/check-document/{projectId}"
    echo ""
    
    echo -e "${BLUE}📋 Existing Endpoints:${NC}"
    echo "  GET  $base_url/health"
    echo "  GET  $base_url/project-summary/{projectId}"
    echo ""
    
    echo -e "${BLUE}🔧 Test Commands:${NC}"
    echo "  curl $base_url/health"
    echo "  curl $base_url/pm-projects/all-projects"
    echo "  curl $base_url/projects"
    echo ""
}

# Main command handling
case "${1:-help}" in
    "test-pre"|"pre")
        run_pre_tests
        ;;
    "test-post"|"post")
        run_post_tests
        ;;
    "check"|"status")
        quick_check
        ;;
    "monitor"|"mon")
        full_monitor
        ;;
    "watch"|"w")
        watch_mode
        ;;
    "deploy"|"d")
        local_deploy
        ;;
    "logs"|"log")
        show_logs
        ;;
    "endpoints"|"ep"|"urls")
        list_endpoints
        ;;
    "help"|"h"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
