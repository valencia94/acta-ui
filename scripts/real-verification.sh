#!/bin/bash

# 🔍 REAL VERIFICATION TEST - Did Our Fixes Actually Work?
# This script will verify if our surgical intervention was successful

echo "🔍 VERIFICATION: Did Our Surgical Fixes Actually Work?"
echo "===================================================="

# Test 1: Check if the app loads without errors
echo ""
echo "1️⃣ Testing Production App Load..."
echo "URL: https://d7t9x3j66yd8k.cloudfront.net"

APP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://d7t9x3j66yd8k.cloudfront.net")
if [ "$APP_STATUS" = "200" ]; then
    echo "✅ App loads successfully (HTTP 200)"
else
    echo "❌ App load failed (HTTP $APP_STATUS)"
fi

# Test 2: Check API Gateway health endpoint
echo ""
echo "2️⃣ Testing API Gateway Health Endpoint..."
echo "URL: https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health"

API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health")
if [ "$API_STATUS" = "200" ]; then
    echo "✅ API Gateway health check passed (HTTP 200)"
else
    echo "❌ API Gateway health check failed (HTTP $API_STATUS)"
fi

# Test 3: Test if browser can make CORS requests (using a simple fetch test)
echo ""
echo "3️⃣ Testing CORS Headers (Browser Compatibility)..."

# Create a temporary HTML file to test CORS in browser
cat > /tmp/cors-test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>CORS Test</title>
</head>
<body>
    <h1>CORS Test</h1>
    <div id="result">Testing...</div>
    <script>
        async function testCORS() {
            const result = document.getElementById('result');
            
            try {
                // Test OPTIONS request first
                const optionsResponse = await fetch('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health', {
                    method: 'OPTIONS',
                    headers: {
                        'Origin': 'https://d7t9x3j66yd8k.cloudfront.net'
                    }
                });
                
                console.log('OPTIONS Response:', optionsResponse.status);
                console.log('CORS Headers:', optionsResponse.headers.get('Access-Control-Allow-Origin'));
                
                // Test actual GET request
                const getResponse = await fetch('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health');
                console.log('GET Response:', getResponse.status);
                
                if (optionsResponse.ok && getResponse.ok) {
                    result.innerHTML = '✅ CORS working! Both OPTIONS and GET requests succeeded.';
                    result.style.color = 'green';
                } else {
                    result.innerHTML = '⚠️ Partial success. OPTIONS: ' + optionsResponse.status + ', GET: ' + getResponse.status;
                    result.style.color = 'orange';
                }
                
            } catch (error) {
                console.error('CORS Error:', error);
                if (error.message.includes('CORS')) {
                    result.innerHTML = '❌ CORS Error: ' + error.message;
                    result.style.color = 'red';
                } else {
                    result.innerHTML = '❌ Network Error: ' + error.message;
                    result.style.color = 'red';
                }
            }
        }
        
        // Run test when page loads
        testCORS();
    </script>
</body>
</html>
EOF

echo "📄 CORS test page created at: file:///tmp/cors-test.html"
echo "🌐 Open this file in a browser to test CORS functionality"

# Test 4: Check CloudFront distribution status  
echo ""
echo "4️⃣ Checking CloudFront Distribution Status..."

CF_STATUS=$(aws cloudfront get-distribution --id EPQU7PVDLQXUA --region us-east-1 --query 'Distribution.Status' --output text 2>/dev/null || echo "ERROR")

if [ "$CF_STATUS" = "Deployed" ]; then
    echo "✅ CloudFront distribution is deployed and active"
elif [ "$CF_STATUS" = "InProgress" ]; then
    echo "⏰ CloudFront distribution is still updating (Status: InProgress)"
else
    echo "❌ CloudFront status unknown or error: $CF_STATUS"
fi

# Summary
echo ""
echo "📋 VERIFICATION SUMMARY"
echo "======================"
echo "Frontend App: $([ "$APP_STATUS" = "200" ] && echo "✅ WORKING" || echo "❌ ISSUE")"
echo "API Gateway: $([ "$API_STATUS" = "200" ] && echo "✅ WORKING" || echo "❌ ISSUE")"  
echo "CloudFront: $([ "$CF_STATUS" = "Deployed" ] && echo "✅ DEPLOYED" || echo "⏰ UPDATING")"

echo ""
echo "🎯 TO CONFIRM CORS IS REALLY FIXED:"
echo "1. Open: https://d7t9x3j66yd8k.cloudfront.net"
echo "2. Open browser console (F12)"
echo "3. Look for any CORS-related errors"
echo "4. If no CORS errors appear, our fixes worked! ✅"
echo ""
echo "If you see errors like 'Access to fetch... has been blocked by CORS policy'"
echo "then our fixes didn't take effect properly. ❌"
