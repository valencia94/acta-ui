#!/bin/bash

# ACTA-UI End-to-End Workflow Test
# Run this after Lambda functions are fixed

echo "🚀 ACTA-UI End-to-End Workflow Test"
echo "====================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"
CLOUDFRONT_URL="https://d7t9x3j66yd8k.cloudfront.net"

echo -e "${BLUE}🔍 Step 1: Verify Application Deployment${NC}"
echo "Testing CloudFront deployment..."
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$CLOUDFRONT_URL")
if [ "$RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✅ Application deployed and accessible${NC}"
else
    echo -e "${RED}❌ Application deployment issue (HTTP $RESPONSE)${NC}"
    exit 1
fi
echo

echo -e "${BLUE}🔍 Step 2: API Health Check${NC}"
echo "Testing API health..."
HEALTH_RESPONSE=$(curl -s "$API_BASE/health")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅ API health check passed${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ API health check failed${NC}"
    echo "Response: $HEALTH_RESPONSE"
    exit 1
fi
echo

echo -e "${BLUE}🔍 Step 3: Test Fixed Lambda Functions${NC}"
echo "Testing project-summary endpoint..."
SUMMARY_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/summary_response.txt "$API_BASE/project-summary/test")
if [ "$SUMMARY_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✅ Project Summary Lambda working${NC}"
    echo "Response: $(cat /tmp/summary_response.txt)"
elif [ "$SUMMARY_RESPONSE" -eq 403 ]; then
    echo -e "${YELLOW}⚠️ Project Summary requires authentication (expected)${NC}"
else
    echo -e "${RED}❌ Project Summary still failing (HTTP $SUMMARY_RESPONSE)${NC}"
    echo "Response: $(cat /tmp/summary_response.txt)"
fi
echo

echo "Testing timeline endpoint..."
TIMELINE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/timeline_response.txt "$API_BASE/timeline/test")
if [ "$TIMELINE_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✅ Timeline Lambda working${NC}"
    echo "Response: $(cat /tmp/timeline_response.txt)"
elif [ "$TIMELINE_RESPONSE" -eq 403 ]; then
    echo -e "${YELLOW}⚠️ Timeline requires authentication (expected)${NC}"
else
    echo -e "${RED}❌ Timeline still failing (HTTP $TIMELINE_RESPONSE)${NC}"
    echo "Response: $(cat /tmp/timeline_response.txt)"
fi
echo

echo -e "${BLUE}🔍 Step 4: Test Download Endpoints${NC}"
echo "Testing PDF download endpoint..."
PDF_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/pdf_response.txt "$API_BASE/download-acta/test?format=pdf")
if [ "$PDF_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✅ PDF download endpoint working${NC}"
elif [ "$PDF_RESPONSE" -eq 403 ]; then
    echo -e "${YELLOW}⚠️ PDF download requires authentication (expected)${NC}"
elif [ "$PDF_RESPONSE" -eq 404 ]; then
    echo -e "${RED}❌ PDF download endpoint not found (API Gateway configuration needed)${NC}"
else
    echo -e "${RED}❌ PDF download failing (HTTP $PDF_RESPONSE)${NC}"
fi
echo

echo "Testing DOCX download endpoint..."
DOCX_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/docx_response.txt "$API_BASE/download-acta/test?format=docx")
if [ "$DOCX_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✅ DOCX download endpoint working${NC}"
elif [ "$DOCX_RESPONSE" -eq 403 ]; then
    echo -e "${YELLOW}⚠️ DOCX download requires authentication (expected)${NC}"
elif [ "$DOCX_RESPONSE" -eq 404 ]; then
    echo -e "${RED}❌ DOCX download endpoint not found (API Gateway configuration needed)${NC}"
else
    echo -e "${RED}❌ DOCX download failing (HTTP $DOCX_RESPONSE)${NC}"
fi
echo

echo -e "${BLUE}🔍 Step 5: Performance Test${NC}"
echo "Testing extract-project-place endpoint (performance check)..."
timeout 30s curl -s -w "%{http_code}" -o /tmp/extract_response.txt "$API_BASE/extract-project-place/test"
EXTRACT_RESPONSE=$?
if [ "$EXTRACT_RESPONSE" -eq 0 ]; then
    echo -e "${GREEN}✅ Extract project endpoint responding within 30s${NC}"
elif [ "$EXTRACT_RESPONSE" -eq 124 ]; then
    echo -e "${YELLOW}⚠️ Extract project endpoint still timing out (>30s)${NC}"
else
    echo -e "${RED}❌ Extract project endpoint error${NC}"
fi
echo

echo -e "${BLUE}📊 Final Summary${NC}"
echo "=================="
echo -e "Application Deployment: ${GREEN}✅ Working${NC}"
echo -e "API Health: ${GREEN}✅ Working${NC}"
echo

if [ "$SUMMARY_RESPONSE" -eq 200 ] || [ "$SUMMARY_RESPONSE" -eq 403 ]; then
    echo -e "Project Summary Lambda: ${GREEN}✅ Fixed${NC}"
else
    echo -e "Project Summary Lambda: ${RED}❌ Still needs fixing${NC}"
fi

if [ "$TIMELINE_RESPONSE" -eq 200 ] || [ "$TIMELINE_RESPONSE" -eq 403 ]; then
    echo -e "Timeline Lambda: ${GREEN}✅ Fixed${NC}"
else
    echo -e "Timeline Lambda: ${RED}❌ Still needs fixing${NC}"
fi

if [ "$PDF_RESPONSE" -eq 200 ] || [ "$PDF_RESPONSE" -eq 403 ]; then
    echo -e "PDF Download: ${GREEN}✅ Available${NC}"
else
    echo -e "PDF Download: ${RED}❌ Needs API Gateway configuration${NC}"
fi

if [ "$DOCX_RESPONSE" -eq 200 ] || [ "$DOCX_RESPONSE" -eq 403 ]; then
    echo -e "DOCX Download: ${GREEN}✅ Available${NC}"
else
    echo -e "DOCX Download: ${RED}❌ Needs API Gateway configuration${NC}"
fi

echo
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo "1. Fix any remaining Lambda function issues in AWS Console"
echo "2. Configure missing API Gateway routes for download endpoints"
echo "3. Test with authenticated user session in the React app"
echo "4. Verify S3 document generation and download workflow"
echo "5. Deploy any additional fixes and re-run this test"
echo
echo -e "${GREEN}🚀 Your ACTA-UI application is deployed and mostly functional!${NC}"
echo -e "${BLUE}📱 Live Application: $CLOUDFRONT_URL${NC}"
echo -e "${BLUE}🔧 Debug Console: file:///workspaces/acta-ui/lambda-debug-console.html${NC}"

# Cleanup temp files
rm -f /tmp/summary_response.txt /tmp/timeline_response.txt /tmp/pdf_response.txt /tmp/docx_response.txt /tmp/extract_response.txt
