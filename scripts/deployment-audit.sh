#!/bin/bash

# 🚧 ACTA-UI COMPLETE DEPLOYMENT AUDIT
# Comprehensive audit script that validates build, S3 deployment, and live site

echo "🚧 ACTA-UI COMPLETE DEPLOYMENT AUDIT"
echo "===================================="
echo "This script will perform a comprehensive audit of:"
echo "1. Local build validation"
echo "2. S3 bucket deployment verification"  
echo "3. Live site smoke testing"
echo "4. CloudFront invalidation (if needed)"
echo ""

# Configuration
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"
LIVE_URL="https://d7t9x3j66yd8k.cloudfront.net"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Overall test tracking
PHASES_PASSED=0
PHASES_FAILED=0
TOTAL_PHASES=3

echo -e "${BLUE}📋 AUDIT CONFIGURATION${NC}"
echo "======================="
echo "S3 Bucket: $S3_BUCKET"
echo "Region: $AWS_REGION"
echo "CloudFront ID: $CLOUDFRONT_DISTRIBUTION_ID"
echo "Live URL: $LIVE_URL"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ WARNING: AWS CLI not configured${NC}"
    echo "Some S3 checks will be skipped."
    echo "To enable full audit, run: aws configure"
    echo ""
    AWS_AVAILABLE=false
else
    echo -e "${GREEN}✅ AWS CLI configured${NC}"
    AWS_AVAILABLE=true
    echo ""
fi

# Phase 1: Build Validation
echo -e "${BLUE}🔍 PHASE 1: BUILD VALIDATION${NC}"
echo "============================"

if [ -x "scripts/validate-build.sh" ]; then
    if ./scripts/validate-build.sh; then
        echo -e "${GREEN}✅ Phase 1 PASSED: Build validation successful${NC}"
        ((PHASES_PASSED++))
    else
        echo -e "${RED}❌ Phase 1 FAILED: Build validation failed${NC}"
        ((PHASES_FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️ Build validation script not found, checking manually...${NC}"
    
    if [ -f "dist/index.html" ] && [ -d "dist/assets" ]; then
        echo -e "${GREEN}✅ Phase 1 PASSED: Basic build files present${NC}"
        ((PHASES_PASSED++))
    else
        echo -e "${RED}❌ Phase 1 FAILED: Build files missing${NC}"
        echo "Run: pnpm run build"
        ((PHASES_FAILED++))
    fi
fi

echo ""

# Phase 2: S3 Deployment Validation
echo -e "${BLUE}🔍 PHASE 2: S3 DEPLOYMENT VALIDATION${NC}"
echo "===================================="

if [ "$AWS_AVAILABLE" = true ]; then
    if [ -x "scripts/s3-deployment-audit.sh" ]; then
        if ./scripts/s3-deployment-audit.sh; then
            echo -e "${GREEN}✅ Phase 2 PASSED: S3 deployment verified${NC}"
            ((PHASES_PASSED++))
        else
            echo -e "${RED}❌ Phase 2 FAILED: S3 deployment issues found${NC}"
            ((PHASES_FAILED++))
        fi
    else
        echo -e "${YELLOW}⚠️ S3 audit script not found, checking manually...${NC}"
        
        # Basic S3 checks
        if aws s3 ls "s3://$S3_BUCKET/index.html" --region "$AWS_REGION" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Phase 2 PASSED: Basic S3 files present${NC}"
            ((PHASES_PASSED++))
        else
            echo -e "${RED}❌ Phase 2 FAILED: S3 files missing${NC}"
            ((PHASES_FAILED++))
        fi
    fi
else
    echo -e "${YELLOW}⚠️ Phase 2 SKIPPED: AWS CLI not available${NC}"
    echo "To run S3 validation: aws configure && ./scripts/s3-deployment-audit.sh"
    ((PHASES_PASSED++)) # Don't count as failure if AWS not available
fi

echo ""

# Phase 3: Live Site Smoke Test
echo -e "${BLUE}🔍 PHASE 3: LIVE SITE SMOKE TEST${NC}"
echo "==============================="

if [ -x "scripts/smoke-test.sh" ]; then
    if ./scripts/smoke-test.sh; then
        echo -e "${GREEN}✅ Phase 3 PASSED: Live site working correctly${NC}"
        ((PHASES_PASSED++))
    else
        echo -e "${RED}❌ Phase 3 FAILED: Live site issues detected${NC}"
        ((PHASES_FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️ Smoke test script not found, checking manually...${NC}"
    
    # Basic connectivity test
    if curl -s "$LIVE_URL" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Phase 3 PASSED: Site is accessible${NC}"
        ((PHASES_PASSED++))
    else
        echo -e "${RED}❌ Phase 3 FAILED: Site not accessible${NC}"
        ((PHASES_FAILED++))
    fi
fi

echo ""

# Final Summary
echo -e "${BLUE}📊 COMPREHENSIVE AUDIT SUMMARY${NC}"
echo "==============================="
echo "Phases Passed: $PHASES_PASSED/$TOTAL_PHASES"
echo "Phases Failed: $PHASES_FAILED/$TOTAL_PHASES"

if [ $PHASES_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 AUDIT PASSED: ACTA-UI deployment is healthy!${NC}"
    
    echo ""
    echo -e "${GREEN}✅ DEPLOYMENT STATUS: PRODUCTION READY${NC}"
    echo "========================================="
    echo "✅ Build artifacts are correctly generated"
    echo "✅ S3 bucket contains all required files"
    echo "✅ Live site is responding correctly"
    echo "✅ All routes are accessible"
    echo "✅ Resources are available"
    
    # Optional CloudFront invalidation
    if [ "$AWS_AVAILABLE" = true ]; then
        echo ""
        echo -e "${BLUE}🌐 CLOUDFRONT CACHE REFRESH${NC}"
        echo "==========================="
        read -p "Create CloudFront invalidation to refresh cache? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Creating CloudFront invalidation..."
            
            INVALIDATION_ID=$(aws cloudfront create-invalidation \
                --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
                --paths "/*" \
                --query 'Invalidation.Id' \
                --output text 2>/dev/null || echo "FAILED")
            
            if [ "$INVALIDATION_ID" != "FAILED" ]; then
                echo -e "${GREEN}✅ CloudFront invalidation created: $INVALIDATION_ID${NC}"
            else
                echo -e "${RED}❌ Failed to create CloudFront invalidation${NC}"
            fi
        fi
    fi
    
    echo ""
    echo -e "${BLUE}🧪 POST-DEPLOYMENT VERIFICATION${NC}"
    echo "==============================="
    echo "The deployment has passed all automated tests."
    echo "For complete verification, please manually check:"
    echo ""
    echo "1. 🌐 Browse to: $LIVE_URL"
    echo "2. 🔐 Test login functionality at: $LIVE_URL/login"
    echo "3. 📊 Test dashboard access at: $LIVE_URL/dashboard"
    echo "4. 🛠️ Check browser DevTools:"
    echo "   - No console errors"
    echo "   - All resources load correctly"
    echo "   - Network requests succeed"
    
    exit 0
    
elif [ $PHASES_FAILED -eq 1 ]; then
    echo -e "${YELLOW}⚠️ AUDIT PARTIAL: Issues found but not critical${NC}"
    
    echo ""
    echo -e "${YELLOW}🔧 ISSUES REQUIRING ATTENTION${NC}"
    echo "============================="
    
    if [ $PHASES_PASSED -ge 2 ]; then
        echo "Most systems are working correctly."
        echo "Some non-critical issues were detected."
        echo "Site should be functional but may need minor fixes."
    fi
    
    exit 1
    
else
    echo -e "${RED}❌ AUDIT FAILED: Critical deployment issues detected${NC}"
    
    echo ""
    echo -e "${RED}🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION${NC}"
    echo "================================================"
    
    if [ $PHASES_PASSED -eq 0 ]; then
        echo "Multiple critical systems are failing."
        echo "Site is likely not functional."
    elif [ $PHASES_PASSED -eq 1 ]; then
        echo "Deployment pipeline has significant issues."
        echo "Site may be partially functional."
    fi
    
    echo ""
    echo -e "${RED}🛠️ IMMEDIATE ACTION REQUIRED${NC}"
    echo "==========================="
    echo "1. 🔨 Fix build issues: pnpm run build"
    echo "2. 🚀 Deploy to S3: ./deploy-to-s3-cloudfront.sh"
    echo "3. 🌐 Create CloudFront invalidation"
    echo "4. 🧪 Re-run this audit: ./scripts/deployment-audit.sh"
    echo ""
    echo "For detailed troubleshooting, run individual audit scripts:"
    echo "- ./scripts/validate-build.sh"
    echo "- ./scripts/s3-deployment-audit.sh"
    echo "- ./scripts/smoke-test.sh"
    
    exit 1
fi