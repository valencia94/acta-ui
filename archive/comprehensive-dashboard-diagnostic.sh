#!/bin/bash
# Comprehensive Dashboard Diagnostic Script

echo "🔍 ACTA UI Dashboard Diagnostic - $(date)"
echo "======================================="

# Test 1: Check if the application is accessible
echo ""
echo "📋 Test 1: Application Accessibility"
echo "------------------------------------"

echo "🌐 Testing main URL..."
MAIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://d7t9x3j66yd8k.cloudfront.net/)
echo "Main URL Status: $MAIN_RESPONSE"

echo "🌐 Testing dashboard route..."
DASHBOARD_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://d7t9x3j66yd8k.cloudfront.net/dashboard)
echo "Dashboard URL Status: $DASHBOARD_RESPONSE"

echo "🌐 Testing admin route..."
ADMIN_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://d7t9x3j66yd8k.cloudfront.net/admin)
echo "Admin URL Status: $ADMIN_RESPONSE"

# Test 2: Check HTML content
echo ""
echo "📋 Test 2: HTML Content Analysis"
echo "--------------------------------"

echo "📄 Fetching main page HTML..."
curl -s https://d7t9x3j66yd8k.cloudfront.net/ > /tmp/main_page.html

if [ -f /tmp/main_page.html ]; then
    echo "✅ HTML file downloaded"
    
    # Check for React root
    if grep -q 'id="root"' /tmp/main_page.html; then
        echo "✅ React root element found"
    else
        echo "❌ React root element NOT found"
    fi
    
    # Check for JavaScript files
    JS_FILES=$(grep -o 'src="[^"]*\.js"' /tmp/main_page.html | wc -l)
    echo "📊 JavaScript files found: $JS_FILES"
    
    # Check for CSS files
    CSS_FILES=$(grep -o 'href="[^"]*\.css"' /tmp/main_page.html | wc -l)
    echo "📊 CSS files found: $CSS_FILES"
    
    # Check for specific keywords
    if grep -q "Dashboard" /tmp/main_page.html; then
        echo "✅ Dashboard text found in HTML"
    else
        echo "⚠️ Dashboard text NOT found in HTML"
    fi
    
    # Check HTML size
    HTML_SIZE=$(wc -c < /tmp/main_page.html)
    echo "📊 HTML file size: $HTML_SIZE bytes"
    
    if [ "$HTML_SIZE" -lt 500 ]; then
        echo "❌ HTML file suspiciously small - may indicate error page"
    fi
    
else
    echo "❌ Failed to download HTML file"
fi

# Test 3: Check JavaScript and CSS assets
echo ""
echo "📋 Test 3: Asset Loading"
echo "------------------------"

# Extract asset URLs and test them
if [ -f /tmp/main_page.html ]; then
    echo "🔍 Testing JavaScript assets..."
    grep -o '/assets/[^"]*\.js' /tmp/main_page.html | while read -r asset; do
        ASSET_URL="https://d7t9x3j66yd8k.cloudfront.net$asset"
        ASSET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ASSET_URL")
        echo "JS Asset $asset: $ASSET_STATUS"
    done
    
    echo "🔍 Testing CSS assets..."
    grep -o '/assets/[^"]*\.css' /tmp/main_page.html | while read -r asset; do
        ASSET_URL="https://d7t9x3j66yd8k.cloudfront.net$asset"
        ASSET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ASSET_URL")
        echo "CSS Asset $asset: $ASSET_STATUS"
    done
fi

# Test 4: Check API endpoints
echo ""
echo "📋 Test 4: API Connectivity"
echo "----------------------------"

echo "🔧 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s https://d7t9x3j66yd8k.cloudfront.net/health)
echo "Health Response: $HEALTH_RESPONSE"

echo "🔧 Testing API Gateway..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health)
echo "API Gateway Status: $API_RESPONSE"

# Test 5: Check CloudFront configuration
echo ""
echo "📋 Test 5: CloudFront Configuration"
echo "-----------------------------------"

echo "🌐 Getting CloudFront distribution info..."
aws cloudfront get-distribution --id EPQU7PVDLQXUA --region us-east-2 --query 'Distribution.DistributionConfig.DefaultCacheBehavior.ForwardedValues' > /tmp/cf_config.json 2>/dev/null

if [ -f /tmp/cf_config.json ]; then
    echo "✅ CloudFront config retrieved"
    cat /tmp/cf_config.json
else
    echo "⚠️ Could not retrieve CloudFront config"
fi

# Test 6: Check for SPA routing issues
echo ""
echo "📋 Test 6: SPA Routing Configuration"
echo "------------------------------------"

# Test various routes that should return index.html for SPA
ROUTES=("/dashboard" "/admin" "/profile" "/non-existent-route")

for route in "${ROUTES[@]}"; do
    echo "🔍 Testing route: $route"
    ROUTE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://d7t9x3j66yd8k.cloudfront.net$route")
    echo "Route $route Status: $ROUTE_RESPONSE"
    
    if [ "$ROUTE_RESPONSE" = "403" ] || [ "$ROUTE_RESPONSE" = "404" ]; then
        echo "❌ SPA routing issue detected for $route"
    fi
done

# Test 7: Check browser console errors simulation
echo ""
echo "📋 Test 7: Asset Analysis"
echo "-------------------------"

if [ -f /tmp/main_page.html ]; then
    echo "🔍 Analyzing potential JavaScript errors..."
    
    # Check for common error indicators in HTML
    if grep -qi "error\|exception\|failed" /tmp/main_page.html; then
        echo "⚠️ Potential error content found in HTML"
        grep -i "error\|exception\|failed" /tmp/main_page.html | head -3
    else
        echo "✅ No obvious error content in HTML"
    fi
fi

# Test 8: Check build artifacts
echo ""
echo "📋 Test 8: Build Verification"
echo "-----------------------------"

echo "📦 Checking if dist/ exists locally..."
if [ -d "dist" ]; then
    echo "✅ Local dist/ directory exists"
    echo "📊 Files in dist/:"
    ls -la dist/ | head -10
    
    # Check for source maps
    SOURCEMAP_COUNT=$(find dist/ -name "*.map" | wc -l)
    echo "📊 Source map files: $SOURCEMAP_COUNT"
    
else
    echo "❌ Local dist/ directory not found"
fi

# Generate summary
echo ""
echo "📋 DIAGNOSTIC SUMMARY"
echo "====================="

echo "🌐 URL Status Codes:"
echo "  - Main: $MAIN_RESPONSE"
echo "  - Dashboard: $DASHBOARD_RESPONSE" 
echo "  - Admin: $ADMIN_RESPONSE"
echo "  - API Gateway: $API_RESPONSE"

if [ "$DASHBOARD_RESPONSE" = "403" ] || [ "$ADMIN_RESPONSE" = "403" ]; then
    echo ""
    echo "❌ CRITICAL ISSUE DETECTED: SPA Routing Problem"
    echo "   CloudFront is returning 403 for SPA routes instead of serving index.html"
    echo "   This explains the black screen on dashboard - routes aren't being handled properly"
    echo ""
    echo "🔧 RECOMMENDED FIXES:"
    echo "   1. Configure CloudFront Error Pages to redirect 404/403 to index.html"
    echo "   2. Set up proper error pages in CloudFront distribution"
    echo "   3. Ensure all routes serve index.html for client-side routing"
fi

if [ "$HEALTH_RESPONSE" = '{"status":"ok"}' ]; then
    echo "✅ Health endpoint working"
else
    echo "⚠️ Health endpoint issue: $HEALTH_RESPONSE"
fi

echo ""
echo "🔍 Diagnostic complete. Check above for specific issues."
