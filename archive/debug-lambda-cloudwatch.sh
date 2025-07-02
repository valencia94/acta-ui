#!/bin/bash

# Lambda CloudWatch Debug Script
# Use this script to investigate the 502 errors in your Lambda functions

echo "🔍 Lambda Function CloudWatch Debug Investigation"
echo "📋 Investigating 502 errors with Request IDs:"
echo "   • Project Summary: 85bca6c3-645f-4b56-87fd-601b2f0ea90b"
echo "   • Timeline: 890621fa-ffc7-43b8-adf1-0ec9e318abe9"
echo ""

# Set the time range (last 2 hours)
START_TIME=$(date -d "2 hours ago" +%s)000
END_TIME=$(date +%s)000

echo "🕐 Time range: $(date -d "2 hours ago") to $(date)"
echo "📊 Timestamp range: $START_TIME to $END_TIME"
echo ""

echo "🚀 Step 1: List all Lambda log groups"
echo "Running: aws logs describe-log-groups --log-group-name-prefix '/aws/lambda/'"
echo ""

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first:"
    echo "   curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'"
    echo "   unzip awscliv2.zip"
    echo "   sudo ./aws/install"
    echo ""
    echo "📱 Alternative: Use AWS Console directly:"
    echo "   https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups"
    exit 1
fi

echo "📋 Available Lambda log groups:"
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/" --query 'logGroups[].logGroupName' --output table 2>/dev/null || {
    echo "⚠️ AWS CLI error. Check your credentials or use AWS Console:"
    echo "   https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups"
    echo ""
}

echo ""
echo "🔍 Step 2: Search for errors in the most likely Lambda functions"

# Common function names to check
FUNCTIONS=(
    "acta-project-summary"
    "acta-timeline"
    "ProjectSummaryFunction"
    "TimelineFunction" 
    "acta-backend"
    "acta-api"
    "extract-project"
)

for func in "${FUNCTIONS[@]}"; do
    LOG_GROUP="/aws/lambda/$func"
    echo ""
    echo "🔬 Checking: $LOG_GROUP"
    
    # Check if log group exists and get recent errors
    aws logs filter-log-events \
        --log-group-name "$LOG_GROUP" \
        --start-time "$START_TIME" \
        --end-time "$END_TIME" \
        --filter-pattern "ERROR" \
        --query 'events[*].[timestamp,message]' \
        --output table 2>/dev/null && echo "✅ Found log group: $LOG_GROUP" || echo "❌ Log group not found: $LOG_GROUP"
done

echo ""
echo "🎯 Step 3: Search for specific Request IDs"

echo ""
echo "🔍 Searching for Request ID: 85bca6c3-645f-4b56-87fd-601b2f0ea90b (Project Summary)"
for func in "${FUNCTIONS[@]}"; do
    LOG_GROUP="/aws/lambda/$func"
    aws logs filter-log-events \
        --log-group-name "$LOG_GROUP" \
        --start-time "$START_TIME" \
        --filter-pattern "85bca6c3-645f-4b56-87fd-601b2f0ea90b" \
        --query 'events[*].message' \
        --output text 2>/dev/null | head -5
done

echo ""
echo "🔍 Searching for Request ID: 890621fa-ffc7-43b8-adf1-0ec9e318abe9 (Timeline)"
for func in "${FUNCTIONS[@]}"; do
    LOG_GROUP="/aws/lambda/$func"
    aws logs filter-log-events \
        --log-group-name "$LOG_GROUP" \
        --start-time "$START_TIME" \
        --filter-pattern "890621fa-ffc7-43b8-adf1-0ec9e318abe9" \
        --query 'events[*].message' \
        --output text 2>/dev/null | head -5
done

echo ""
echo "📊 Step 4: Check for common Lambda issues"

echo ""
echo "🕐 Checking for timeout errors:"
for func in "${FUNCTIONS[@]}"; do
    LOG_GROUP="/aws/lambda/$func"
    aws logs filter-log-events \
        --log-group-name "$LOG_GROUP" \
        --start-time "$START_TIME" \
        --filter-pattern "Task timed out" \
        --query 'events[*].message' \
        --output text 2>/dev/null | head -3
done

echo ""
echo "💾 Checking for memory errors:"
for func in "${FUNCTIONS[@]}"; do
    LOG_GROUP="/aws/lambda/$func"
    aws logs filter-log-events \
        --log-group-name "$LOG_GROUP" \
        --start-time "$START_TIME" \
        --filter-pattern "Runtime.OutOfMemory" \
        --query 'events[*].message' \
        --output text 2>/dev/null | head -3
done

echo ""
echo "🐛 Checking for import/dependency errors:"
for func in "${FUNCTIONS[@]}"; do
    LOG_GROUP="/aws/lambda/$func"
    aws logs filter-log-events \
        --log-group-name "$LOG_GROUP" \
        --start-time "$START_TIME" \
        --filter-pattern "ModuleNotFoundError" \
        --query 'events[*].message' \
        --output text 2>/dev/null | head -3
done

echo ""
echo "🌐 Checking for external API connection errors:"
for func in "${FUNCTIONS[@]}"; do
    LOG_GROUP="/aws/lambda/$func"
    aws logs filter-log-events \
        --log-group-name "$LOG_GROUP" \
        --start-time "$START_TIME" \
        --filter-pattern "ConnectionError" \
        --query 'events[*].message' \
        --output text 2>/dev/null | head -3
done

echo ""
echo "🎯 Manual Investigation Steps:"
echo ""
echo "1. 🖥️ AWS Console CloudWatch:"
echo "   https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups"
echo ""
echo "2. 🔍 Search for Request IDs in CloudWatch:"
echo "   • 85bca6c3-645f-4b56-87fd-601b2f0ea90b"
echo "   • 890621fa-ffc7-43b8-adf1-0ec9e318abe9"
echo ""
echo "3. 🔧 API Gateway Console:"
echo "   https://console.aws.amazon.com/apigateway/main/apis?region=us-east-2"
echo ""
echo "4. ⚙️ Lambda Console:"
echo "   https://console.aws.amazon.com/lambda/home?region=us-east-2#/functions"
echo ""
echo "5. 📊 Most likely issues to check:"
echo "   • Function timeout (default 3 seconds may be too short)"
echo "   • Memory allocation too low"
echo "   • Missing environment variables"
echo "   • IAM role permissions"
echo "   • External API dependencies failing"
echo ""
echo "✅ Investigation complete. Check the output above for any errors found."
