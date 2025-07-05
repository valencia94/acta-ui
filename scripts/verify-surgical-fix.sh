#!/bin/bash
# ACTA-UI Production Fix Verification Script
# Tests all the fixes applied by the surgical intervention
set -euo pipefail

echo "🧪 ACTA-UI Production Fix Verification"
echo "======================================"

API_ID="q2b9avfwv5"
REGION="us-east-2"
STAGE="prod"
CLOUDFRONT_URL="https://d7t9x3j66yd8k.cloudfront.net"
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/$STAGE"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

test_cors() {
  local endpoint="$1"
  local test_name="$2"
  
  echo -e "${BLUE}🔍 Testing CORS: $test_name${NC}"
  
  local response=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Origin: $CLOUDFRONT_URL" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Authorization,Content-Type" \
    -X OPTIONS \
    "$endpoint" 2>/dev/null || echo "000")
  
  if [[ "$response" == "200" ]]; then
    echo -e "   ${GREEN}✅ CORS working (HTTP $response)${NC}"
    
    # Get CORS headers
    local headers=$(curl -s -I \
      -H "Origin: $CLOUDFRONT_URL" \
      -H "Access-Control-Request-Method: GET" \
      -X OPTIONS \
      "$endpoint" 2>/dev/null | grep -i "access-control" || echo "No CORS headers")
    
    echo "   📋 Headers: $headers"
  else
    echo -e "   ${RED}❌ CORS failed (HTTP $response)${NC}"
  fi
  echo ""
}

test_cloudfront_policy() {
  echo -e "${BLUE}🔍 Testing CloudFront Origin Request Policy${NC}"
  
  # Check if the policy is applied
  local policy_id=$(aws cloudfront get-distribution \
    --id "EPQU7PVDLQXUA" \
    --query 'Distribution.DistributionConfig.DefaultCacheBehavior.OriginRequestPolicyId' \
    --output text 2>/dev/null || echo "None")
  
  if [[ "$policy_id" != "None" && "$policy_id" != "" ]]; then
    echo -e "   ${GREEN}✅ Origin Request Policy applied: $policy_id${NC}"
    
    # Get policy details
    local policy_name=$(aws cloudfront get-origin-request-policy \
      --id "$policy_id" \
      --query 'OriginRequestPolicy.OriginRequestPolicyConfig.Name' \
      --output text 2>/dev/null || echo "Unknown")
    
    echo "   📋 Policy Name: $policy_name"
  else
    echo -e "   ${RED}❌ No Origin Request Policy found${NC}"
  fi
  echo ""
}

test_api_resource_policy() {
  echo -e "${BLUE}🔍 Testing API Gateway Resource Policy${NC}"
  
  local policy=$(aws apigateway get-rest-api \
    --rest-api-id "$API_ID" \
    --region "$REGION" \
    --query 'policy' \
    --output text 2>/dev/null || echo "None")
  
  if [[ "$policy" != "None" && "$policy" != "" ]]; then
    echo -e "   ${GREEN}✅ Resource Policy applied${NC}"
    echo "   📋 Policy exists (restricts direct access)"
    
    # Test direct access (should be blocked if policy is restrictive)
    local direct_response=$(curl -s -o /dev/null -w "%{http_code}" \
      "$API_URL/health" 2>/dev/null || echo "000")
    
    if [[ "$direct_response" == "403" ]]; then
      echo -e "   ${GREEN}✅ Direct access blocked (HTTP $direct_response)${NC}"
    else
      echo -e "   ${YELLOW}⚠️  Direct access allowed (HTTP $direct_response)${NC}"
    fi
  else
    echo -e "   ${BLUE}ℹ️  No Resource Policy (all access allowed)${NC}"
  fi
  echo ""
}

test_health_endpoint() {
  echo -e "${BLUE}🔍 Testing Health Endpoint${NC}"
  
  # Test via CloudFront
  local cf_response=$(curl -s -o /dev/null -w "%{http_code}" \
    "$CLOUDFRONT_URL/api/health" 2>/dev/null || echo "000")
  
  echo -e "   CloudFront: HTTP $cf_response"
  
  # Test direct API
  local api_response=$(curl -s -o /dev/null -w "%{http_code}" \
    "$API_URL/health" 2>/dev/null || echo "000")
  
  echo -e "   Direct API: HTTP $api_response"
  
  if [[ "$cf_response" == "200" || "$cf_response" == "403" ]]; then
    echo -e "   ${GREEN}✅ CloudFront routing working${NC}"
  else
    echo -e "   ${RED}❌ CloudFront routing issue${NC}"
  fi
  echo ""
}

echo "🚀 Starting verification tests..."
echo ""

# Test 1: CORS functionality
echo -e "${YELLOW}━━━ CORS TESTS ━━━${NC}"
test_cors "$API_URL/health" "Health Endpoint"
test_cors "$API_URL/projects" "Projects Endpoint"
test_cors "$API_URL/pm-manager/all-projects" "PM Manager Endpoint"

# Test 2: CloudFront configuration
echo -e "${YELLOW}━━━ CLOUDFRONT TESTS ━━━${NC}"
test_cloudfront_policy
test_health_endpoint

# Test 3: Security policy
echo -e "${YELLOW}━━━ SECURITY TESTS ━━━${NC}"
test_api_resource_policy

# Test 4: Integration test
echo -e "${YELLOW}━━━ INTEGRATION TEST ━━━${NC}"
echo -e "${BLUE}🔍 Testing Full Request Flow${NC}"

# Simulate a real browser request via CloudFront
echo "   Testing CloudFront → API Gateway → Lambda flow..."

local full_test=$(curl -s -w "HTTP: %{http_code} | Time: %{time_total}s" \
  -H "Accept: application/json" \
  -H "User-Agent: ACTA-UI-Test/1.0" \
  "$CLOUDFRONT_URL/" 2>/dev/null || echo "Connection failed")

echo "   📊 Result: $full_test"
echo ""

# Summary
echo -e "${GREEN}🎯 VERIFICATION SUMMARY${NC}"
echo "================================="
echo ""
echo "✅ Tests completed. Check results above."
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. If CORS tests pass: ✅ Frontend API calls should work"
echo "2. If CloudFront tests pass: ✅ Header forwarding is working"
echo "3. If security tests pass: ✅ API is properly protected"
echo ""
echo -e "${YELLOW}🧪 Manual Testing:${NC}"
echo "1. Open your ACTA-UI app: $CLOUDFRONT_URL"
echo "2. Login with Cognito credentials"
echo "3. Navigate to dashboard/projects"
echo "4. Check browser console for CORS errors (should be none)"
echo ""
echo -e "${BLUE}📊 If issues persist:${NC}"
echo "- Wait 5-15 minutes for CloudFront propagation"
echo "- Check browser console for specific error messages"
echo "- Verify Cognito auth tokens are being sent"
echo ""
echo "🏁 Verification complete!"
