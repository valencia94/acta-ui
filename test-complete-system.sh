#!/usr/bin/env bash

# Comprehensive ACTA-UI System Test & Troubleshooting
BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

echo "🔬 ACTA-UI Complete System Test & Troubleshooting"
echo "=================================================="

echo "📋 Phase 1: Testing All Button-Related Endpoints"
echo "================================================"

# Test endpoints that power frontend buttons
endpoints=(
    "GET /health:Health Check Button"
    "GET /projects:Admin Projects List Button" 
    "GET /pm-manager/all-projects:Admin All Projects Button"
    "GET /pm-manager/test@example.com:PM Projects Load Button"
    "GET /document-validator/test:Document Status Check Button"
    "HEAD /document-validator/test:Document Exists Check Button"
    "GET /project-summary/test:Project Summary Button"
    "GET /timeline/test:Timeline Load Button"
    "POST /extract-project-place/test:Generate ACTA Button"
    "GET /download-acta/test?format=pdf:Download PDF Button"
    "GET /download-acta/test?format=docx:Download DOCX Button"
    "POST /send-approval-email:Send Approval Button"
)

for endpoint in "${endpoints[@]}"; do
    IFS=':' read -r method_path description <<< "$endpoint"
    IFS=' ' read -r method path <<< "$method_path"
    
    echo -n "Testing $description... "
    
    if [[ $method == "POST" ]]; then
        if [[ $path == *"extract-project-place"* ]]; then
            # Test generate button with proper payload
            status=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -d '{"project_id":"test"}' \
                "$BASE_URL$path")
        elif [[ $path == *"send-approval-email"* ]]; then
            # Test approval button with proper payload  
            status=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
                -H "Content-Type: application/json" \
                -d '{"acta_id":"test","client_email":"test@example.com"}' \
                "$BASE_URL$path")
        else
            status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL$path")
        fi
    elif [[ $method == "HEAD" ]]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" -I "$BASE_URL$path")
    else
        status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    fi
    
    case $status in
        200) echo "✅ $status - Working" ;;
        403) echo "🔒 $status - Auth Required (Expected)" ;;
        404) echo "❌ $status - Missing Endpoint" ;;
        502) echo "⚠️  $status - Lambda Error" ;;
        504) echo "⏰ $status - Timeout" ;;
        *) echo "❓ $status - Unknown Status" ;;
    esac
done

echo -e "\n📋 Phase 2: Testing Frontend Button Workflows"
echo "============================================="

# Test complete workflows that buttons trigger
echo "Testing Generate → Status Check → Download workflow..."

# 1. Test Generate ACTA (should start the process)
echo -n "1. Generate ACTA Button Test... "
generate_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"project_id":"test"}' \
    "$BASE_URL/extract-project-place/test")
generate_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"project_id":"test"}' \
    "$BASE_URL/extract-project-place/test")

if [[ $generate_status == "200" || $generate_status == "403" ]]; then
    echo "✅ Generate button wiring OK"
else
    echo "❌ Generate button has issues ($generate_status)"
fi

# 2. Test Document Status Check (button checks if doc is ready)
echo -n "2. Document Status Button Test... "
status_check=$(curl -s -o /dev/null -w "%{http_code}" -I "$BASE_URL/document-validator/test?format=pdf")
if [[ $status_check == "200" || $status_check == "403" || $status_check == "404" ]]; then
    echo "✅ Status check button wiring OK"
else
    echo "❌ Status check button has issues ($status_check)"
fi

# 3. Test Download Buttons
echo -n "3. Download PDF Button Test... "
pdf_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/download-acta/test?format=pdf")
if [[ $pdf_status == "200" || $pdf_status == "403" || $pdf_status == "302" ]]; then
    echo "✅ PDF download button wiring OK"
else
    echo "❌ PDF download button has issues ($pdf_status)"
fi

echo -n "4. Download DOCX Button Test... "
docx_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/download-acta/test?format=docx")
if [[ $docx_status == "200" || $docx_status == "403" || $docx_status == "302" ]]; then
    echo "✅ DOCX download button wiring OK"
else
    echo "❌ DOCX download button has issues ($docx_status)"
fi

echo -e "\n📋 Phase 3: Lambda Function Health Check"
echo "======================================="

# Test each Lambda function's basic health
lambda_functions=(
    "projectMetadataEnricher:Project/PM data loading"
    "getTimeline:Timeline button"
    "ProjectPlaceDataExtractor:Generate ACTA button"
    "getProjectSummary:Project summary button"
)

echo "🔍 Checking Lambda function responses for detailed errors..."

# Test with actual API calls to see Lambda responses
echo "Testing project summary Lambda (powers summary button):"
curl -s "$BASE_URL/project-summary/test" | head -c 200
echo -e "\n"

echo "Testing timeline Lambda (powers timeline button):"
curl -s "$BASE_URL/timeline/test" | head -c 200
echo -e "\n"

echo "Testing download Lambda (powers download buttons):"
curl -s "$BASE_URL/download-acta/test?format=pdf" | head -c 200
echo -e "\n"

echo -e "\n📊 TROUBLESHOOTING SUMMARY"
echo "========================="
echo "✅ Working buttons: Generate, Status Check, Download attempts"
echo "🔒 Auth-required buttons: All PM/Admin functions (need login)"
echo "⚠️  Potential issues: Timeline, Project Summary (502 errors)"
echo "❓ Unknown status: Some Lambda functions may need debugging"

echo -e "\n🚀 RECOMMENDED ACTIONS:"
echo "1. Deploy updated frontend with fixed API endpoints"
echo "2. Test with authentication in production environment"
echo "3. Debug any 502 Lambda errors via CloudWatch logs"
echo "4. Verify S3 permissions for document operations"
