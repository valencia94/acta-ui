#!/bin/bash

echo "🧪 Quick Dashboard Status Check"
echo "================================"

# Check if the main page loads
echo "1. Checking main page..."
curl -s -o /dev/null -w "Status: %{http_code}, Time: %{time_total}s\n" https://d7t9x3j66yd8k.cloudfront.net/

# Check if static assets are accessible
echo "2. Checking static assets..."
curl -s -o /dev/null -w "JS Bundle Status: %{http_code}\n" https://d7t9x3j66yd8k.cloudfront.net/assets/index.js
curl -s -o /dev/null -w "CSS Bundle Status: %{http_code}\n" https://d7t9x3j66yd8k.cloudfront.net/assets/index.css

# Check CORS on API endpoints
echo "3. Checking API CORS headers..."

# Health endpoint
echo "--- Health endpoint ---"
curl -s -I -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization,content-type" \
     -X OPTIONS https://api.acta.ai/health | grep -i "access-control"

# Projects endpoint  
echo "--- Projects endpoint ---"
curl -s -I -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization,content-type" \
     -X OPTIONS https://api.acta.ai/projects | grep -i "access-control"

# Admin stats endpoint
echo "--- Admin stats endpoint ---"
curl -s -I -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization,content-type" \
     -X OPTIONS https://api.acta.ai/admin/stats | grep -i "access-control"

echo ""
echo "✅ Quick status check complete!"
