#!/bin/bash
echo "🔍 Testing Current Dashboard Content After Fresh Deployment"
echo "=========================================================="

echo ""
echo "📱 Testing main application..."
curl -s https://d7t9x3j66yd8k.cloudfront.net/ | grep -A 5 -B 5 "test\|loan\|demo" || echo "No test content found in main page"

echo ""
echo "📱 Testing dashboard route..."
curl -s https://d7t9x3j66yd8k.cloudfront.net/dashboard | grep -A 5 -B 5 "test\|loan\|demo" || echo "No test content found in dashboard"

echo ""
echo "🔍 Checking for specific keywords that might indicate test data..."
curl -s https://d7t9x3j66yd8k.cloudfront.net/ | grep -i "loan\|test.*project\|sample\|demo" || echo "✅ No test/demo content detected in main HTML"

echo ""
echo "📄 Checking JavaScript bundle for test content..."
JS_FILE=$(curl -s https://d7t9x3j66yd8k.cloudfront.net/ | grep -o '/assets/index-[^"]*\.js' | head -1)
if [ ! -z "$JS_FILE" ]; then
    echo "Found JS file: $JS_FILE"
    curl -s "https://d7t9x3j66yd8k.cloudfront.net$JS_FILE" | grep -o "test.*loan\|loan.*test\|sample.*project" | head -5 || echo "✅ No test loan content found in JavaScript bundle"
else
    echo "❌ Could not find JavaScript bundle"
fi

echo ""
echo "🏁 Test complete. If you're still seeing test loans, it may be:"
echo "   1. Browser cache - try hard refresh (Ctrl+Shift+R / Cmd+Shift+R)"
echo "   2. CloudFront cache still updating (wait 1-2 minutes)"
echo "   3. Test data coming from API/backend rather than frontend"
