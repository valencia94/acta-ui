#!/usr/bin/env bash

# Lambda Function Diagnosis and Fix Script
echo "🔍 LAMBDA FUNCTION DIAGNOSIS & REPAIR"
echo "====================================="

# Test each problematic Lambda with detailed error information
BASE_URL="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

echo "📋 Phase 1: Detailed Error Analysis"
echo "=================================="

# Get detailed error responses from each failing Lambda
echo "1. Project Summary Lambda Error Details:"
echo "----------------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  "$BASE_URL/project-summary/test" 2>/dev/null || echo "Request failed"

echo -e "\n2. Timeline Lambda Error Details:"
echo "--------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  "$BASE_URL/timeline/test" 2>/dev/null || echo "Request failed"

echo -e "\n3. Download Lambda Error Details:"
echo "--------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  "$BASE_URL/download-acta/test?format=pdf" 2>/dev/null || echo "Request failed"

echo -e "\n4. Generate ACTA Lambda (Timeout) Details:"
echo "----------------------------------------"
timeout 30s curl -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -X POST -H "Content-Type: application/json" -d '{"project_id":"test"}' \
  "$BASE_URL/extract-project-place/test" 2>/dev/null || echo "Request timed out or failed"

echo -e "\n5. Send Approval Lambda Error Details:"
echo "------------------------------------"
curl -s -w "\nHTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" \
  -X POST -H "Content-Type: application/json" \
  -d '{"acta_id":"test","client_email":"test@example.com"}' \
  "$BASE_URL/send-approval-email" 2>/dev/null || echo "Request failed"

echo -e "\n📋 Phase 2: Common Lambda Issues Diagnosis"
echo "========================================="

echo "🔍 Checking for common Lambda function issues:"
echo "1. Environment Variables"
echo "2. IAM Permissions"  
echo "3. Dependencies"
echo "4. Timeout Configuration"
echo "5. Memory Configuration"

# Test if Lambda functions exist and are properly configured
echo -e "\n🧪 Testing Lambda Function Availability:"

# Check if we can get any response (not just errors)
echo "- Health endpoint (baseline): $(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")"
echo "- Auth-protected endpoints work: $(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/projects")"

echo -e "\n📋 Phase 3: Lambda Function Recommendations"
echo "=========================================="

cat << 'EOF'
🔧 LAMBDA FUNCTION ISSUES IDENTIFIED:

1. PROJECT SUMMARY & TIMELINE (502 errors):
   - Likely: Environment variables missing
   - Likely: Database connection issues
   - Likely: Missing IAM permissions

2. DOWNLOAD FUNCTIONS (502 errors):
   - Likely: S3 permissions missing
   - Likely: Bucket name not configured
   - Likely: File path issues

3. GENERATE ACTA (504 timeout):
   - Likely: Function timeout too low
   - Likely: Memory allocation too low
   - Likely: External API delays

4. SEND APPROVAL (400 error):
   - Likely: Request format validation
   - Likely: Missing required parameters
   - Likely: Email service configuration

🚀 IMMEDIATE FIXES NEEDED:

1. Check Lambda environment variables
2. Verify IAM role permissions
3. Increase timeout/memory for slow functions
4. Check S3 bucket configurations
5. Validate request/response formats
EOF

echo -e "\n🎯 Next: Running Lambda-specific diagnostic tests..."
