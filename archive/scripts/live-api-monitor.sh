#!/bin/bash

# Simple real-time monitoring of button clicks and API calls
# Run this while testing buttons in the UI

echo "🔍 LIVE API CALL MONITORING"
echo "=========================="
echo ""
echo "Monitoring API calls to: https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com"
echo "Press Ctrl+C to stop monitoring"
echo ""

API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com"

# Function to monitor a specific endpoint
monitor_endpoint() {
    local endpoint="$1"
    local description="$2"
    local method="${3:-GET}"
    
    echo "📡 Testing $description ($method $endpoint)..."
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "Status:%{http_code} Time:%{time_total}s" "$API_BASE$endpoint" 2>/dev/null)
    else
        response=$(curl -s -w "Status:%{http_code} Time:%{time_total}s" -X POST "$API_BASE$endpoint" -H "Content-Type: application/json" -d '{}' 2>/dev/null)
    fi
    
    status=$(echo "$response" | grep -o "Status:[0-9]*" | cut -d: -f2)
    time=$(echo "$response" | grep -o "Time:[0-9.]*s" | cut -d: -f2)
    
    if [ "$status" = "401" ]; then
        echo "   ✅ $description: Properly secured (401) - ${time}"
    elif [ "$status" = "200" ]; then
        echo "   🔓 $description: Accessible (200) - ${time}"
    elif [ "$status" = "403" ]; then
        echo "   🔒 $description: Forbidden (403) - ${time}"
    elif [ "$status" = "404" ]; then
        echo "   📄 $description: Not found (404) - ${time}"
    elif [ "$status" = "500" ]; then
        echo "   ❌ $description: Server error (500) - ${time}"
    else
        echo "   ⚠️ $description: Unknown status ($status) - ${time}"
    fi
}

echo "⏱️ CONTINUOUS MONITORING STARTED"
echo "================================="
echo ""

while true; do
    echo "$(date '+%H:%M:%S') - Checking all endpoints..."
    
    monitor_endpoint "/prod/health" "Health Check" "GET"
    monitor_endpoint "/prod/timeline/1000000049842296" "Timeline" "GET"
    monitor_endpoint "/prod/project-summary/1000000049842296" "Project Summary" "GET"  
    monitor_endpoint "/prod/download-acta/1000000049842296?format=pdf" "PDF Download" "GET"
    monitor_endpoint "/prod/download-acta/1000000049842296?format=docx" "Word Download" "GET"
    monitor_endpoint "/prod/extract-project-place/1000000049842296" "Generate ACTA" "POST"
    monitor_endpoint "/prod/send-approval-email" "Send Approval" "POST"
    
    echo ""
    echo "💡 Now test buttons in the UI. Expected behavior:"
    echo "   - Buttons should make requests to the endpoints above"
    echo "   - With Authorization headers, status should be 200 or 404"
    echo "   - Without Authorization headers, status should be 401"
    echo ""
    echo "⏳ Next check in 30 seconds... (Ctrl+C to stop)"
    echo ""
    
    sleep 30
done
