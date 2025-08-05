#!/bin/bash
# ACTA-UI Production Fix - Surgical Intervention Master Script
# Orchestrates all three control plane fixes in the correct order
set -euo pipefail

echo "🏥 ACTA-UI Production Surgical Intervention"
echo "==========================================="
echo "Fixing CloudFront headers, API Gateway CORS, and optional security"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/surgical_fix_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_and_echo() {
  echo -e "$1" | tee -a "$LOG_FILE"
}

run_step() {
  local step_name="$1"
  local script_path="$2"
  local description="$3"
  
  log_and_echo "${BLUE}🔄 Step: $step_name${NC}"
  log_and_echo "   $description"
  log_and_echo ""
  
  if [[ -f "$script_path" ]]; then
    if bash "$script_path" 2>&1 | tee -a "$LOG_FILE"; then
      log_and_echo "${GREEN}✅ $step_name completed successfully${NC}"
    else
      log_and_echo "${RED}❌ $step_name failed${NC}"
      log_and_echo "${YELLOW}⚠️  Check log file: $LOG_FILE${NC}"
      return 1
    fi
  else
    log_and_echo "${RED}❌ Script not found: $script_path${NC}"
    return 1
  fi
  
  log_and_echo ""
  log_and_echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_and_echo ""
  
  # Wait between steps to allow AWS propagation
  if [[ "$step_name" != "Security Policy" ]]; then
    log_and_echo "${YELLOW}⏳ Waiting 30 seconds for AWS propagation...${NC}"
    sleep 30
  fi
}

# Pre-flight checks
log_and_echo "${BLUE}🔍 Pre-flight Checks${NC}"
log_and_echo "Timestamp: $(date)"
log_and_echo "AWS CLI Version: $(aws --version 2>&1 | head -n1)"
log_and_echo "Current AWS Region: $(aws configure get region 2>/dev/null || echo 'Not configured')"
log_and_echo "Log File: $LOG_FILE"
log_and_echo ""

# Check AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
  log_and_echo "${RED}❌ AWS credentials not configured or invalid${NC}"
  log_and_echo "Please run: aws configure"
  exit 1
fi

AWS_IDENTITY=$(aws sts get-caller-identity --query 'Account' --output text)
log_and_echo "${GREEN}✅ AWS Account: $AWS_IDENTITY${NC}"
log_and_echo ""

# Confirm execution
log_and_echo "${YELLOW}⚠️  PRODUCTION SURGICAL INTERVENTION${NC}"
log_and_echo "This will modify live AWS resources:"
log_and_echo "   • CloudFront Distribution: EPQU7PVDLQXUA"
log_and_echo "   • API Gateway: q2b9avfwv5"
log_and_echo "   • Origin Request Policy: acta-ui-auth-policy"
log_and_echo ""
read -p "Continue with surgical intervention? [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  log_and_echo "${YELLOW}🛑 Operation cancelled by user${NC}"
  exit 0
fi

log_and_echo ""
log_and_echo "${GREEN}🚀 Starting Surgical Intervention${NC}"
log_and_echo ""

# Step 1: API Gateway CORS Fix (user-visible failure fix)
run_step "API Gateway CORS" \
  "$SCRIPT_DIR/apigateway-cors-fix.sh" \
  "Fix all OPTIONS integrations with proper CORS headers"

# Step 2: CloudFront Header Forwarding (auth header forwarding)
run_step "CloudFront Headers" \
  "$SCRIPT_DIR/cloudfront-header-fix.sh" \
  "Enable Authorization header forwarding through CloudFront"

# Step 3: Optional Security Policy
log_and_echo "${YELLOW}🔒 Optional Security Policy${NC}"
log_and_echo "Add API Gateway resource policy to restrict access to CloudFront only?"
log_and_echo "   • Pros: Enhanced security, blocks direct API access"
log_and_echo "   • Cons: May interfere with CLI testing or monitoring"
log_and_echo ""
read -p "Apply security policy? [y/N] " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  run_step "Security Policy" \
    "$SCRIPT_DIR/apigateway-security-policy.sh" \
    "Restrict API access to CloudFront distribution only"
else
  log_and_echo "${BLUE}⏭️  Skipping security policy (can be applied later)${NC}"
fi

log_and_echo ""
log_and_echo "${GREEN}🎉 SURGICAL INTERVENTION COMPLETE${NC}"
log_and_echo "================================================"
log_and_echo ""
log_and_echo "${GREEN}✅ What was fixed:${NC}"
log_and_echo "   1. ✅ API Gateway CORS headers for all endpoints"
log_and_echo "   2. ✅ CloudFront Authorization header forwarding"
if [[ $REPLY =~ ^[Yy]$ ]]; then
  log_and_echo "   3. ✅ API Gateway security policy applied"
else
  log_and_echo "   3. ⏭️  Security policy skipped"
fi
log_and_echo ""
log_and_echo "${BLUE}🔍 Verification Steps:${NC}"
log_and_echo ""
log_and_echo "1. Test CORS (should return 200 with headers):"
log_and_echo "   curl -H 'Origin: https://d7t9x3j66yd8k.cloudfront.net' \\"
log_and_echo "        -X OPTIONS \\"
log_and_echo "        'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health'"
log_and_echo ""
log_and_echo "2. Test via CloudFront (after 5-15 min propagation):"
log_and_echo "   curl -I 'https://d7t9x3j66yd8k.cloudfront.net/'"
log_and_echo ""
log_and_echo "3. Test authenticated request from React app:"
log_and_echo "   - Login to your app"
log_and_echo "   - Navigate to dashboard"
log_and_echo "   - Check browser console for CORS errors (should be none)"
log_and_echo ""
log_and_echo "${YELLOW}⏳ Timeline:${NC}"
log_and_echo "   • API Gateway changes: Active immediately"
log_and_echo "   • CloudFront changes: 5-15 minutes for global propagation"
log_and_echo ""
log_and_echo "${BLUE}📊 Full log saved to: $LOG_FILE${NC}"
log_and_echo ""
log_and_echo "${GREEN}🏁 Surgical intervention completed successfully!${NC}"
