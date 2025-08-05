#!/bin/bash
# Complete ACTA-UI Production Restore Script
# This script orchestrates all the necessary fixes for the production deployment

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}🔥 ACTA-UI Production Restore Script${NC}"
echo "====================================="
echo ""
echo -e "${BLUE}This script will restore the ACTA-UI production deployment by:${NC}"
echo "✅ Verifying frontend configuration"
echo "🔧 Creating AWS infrastructure fix scripts"
echo "🏗️  Building the application with SPA routing fix"
echo "🚀 Preparing for deployment"
echo ""

# Step 1: Verify frontend configuration
echo -e "${YELLOW}1️⃣ VERIFYING FRONTEND CONFIGURATION${NC}"
echo "------------------------------------"

echo "🔍 Checking AWS exports configuration..."

# Check src/aws-exports.js
if [ -f "src/aws-exports.js" ]; then
    echo "✅ src/aws-exports.js exists"
    
    # Verify Cognito domain
    if grep -q "us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com" src/aws-exports.js; then
        echo "✅ Cognito domain correct in src/aws-exports.js"
    else
        echo "❌ Cognito domain needs fixing in src/aws-exports.js"
        exit 1
    fi
    
    # Verify region
    if grep -q '"us-east-2"' src/aws-exports.js; then
        echo "✅ Region set to us-east-2 in src/aws-exports.js"
    else
        echo "❌ Region needs fixing in src/aws-exports.js"
        exit 1
    fi
else
    echo "❌ src/aws-exports.js not found"
    exit 1
fi

# Check public/aws-exports.js
if [ -f "public/aws-exports.js" ]; then
    echo "✅ public/aws-exports.js exists"
    
    # Verify Cognito domain
    if grep -q "us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com" public/aws-exports.js; then
        echo "✅ Cognito domain correct in public/aws-exports.js"
    else
        echo "❌ Cognito domain needs fixing in public/aws-exports.js"
        exit 1
    fi
    
    # Verify window.awsmobile
    if grep -q "window.awsmobile" public/aws-exports.js; then
        echo "✅ window.awsmobile defined in public/aws-exports.js"
    else
        echo "❌ window.awsmobile not defined in public/aws-exports.js"
        exit 1
    fi
else
    echo "❌ public/aws-exports.js not found"
    exit 1
fi

echo -e "${GREEN}✅ Frontend configuration verified${NC}"
echo ""

# Step 2: Build application
echo -e "${YELLOW}2️⃣ BUILDING APPLICATION${NC}"
echo "-------------------------"

echo "🏗️  Building production bundle with SPA routing fix..."
if pnpm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
    
    # Verify 404.html was created
    if [ -f "dist/404.html" ]; then
        echo "✅ 404.html created for SPA routing"
    else
        echo "❌ 404.html not found - SPA routing may not work"
        exit 1
    fi
    
    # Verify aws-exports.js was copied
    if [ -f "dist/aws-exports.js" ]; then
        echo "✅ aws-exports.js copied to dist/"
    else
        echo "❌ aws-exports.js not found in dist/"
        exit 1
    fi
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Show build statistics
echo ""
echo "📊 Build Statistics:"
echo "==================="
du -sh dist/
ls -la dist/ | head -10
echo ""

# Step 3: Make scripts executable
echo -e "${YELLOW}3️⃣ PREPARING AWS FIX SCRIPTS${NC}"
echo "------------------------------"

chmod +x scripts/fix-cloudfront-cors.sh
chmod +x scripts/fix-api-gateway-cors.sh
chmod +x scripts/fix-iam-permissions.sh

echo "✅ AWS fix scripts are now executable"
echo ""

# Step 4: Summary and next steps
echo -e "${PURPLE}🎉 ACTA-UI RESTORE PREPARATION COMPLETE${NC}"
echo "======================================="
echo ""
echo -e "${GREEN}✅ What's been fixed in the repository:${NC}"
echo "  🎨 Frontend AWS configuration verified (Cognito domain, regions)"
echo "  📱 SPA routing fix implemented (404.html fallback)"
echo "  🏗️  Production build successful with optimizations"
echo "  🔧 AWS infrastructure fix scripts created"
echo ""
echo -e "${YELLOW}⚠️  Manual AWS Infrastructure Steps Required:${NC}"
echo ""
echo -e "${BLUE}Run these scripts in order to fix AWS infrastructure:${NC}"
echo ""
echo "1️⃣ Fix CloudFront distribution:"
echo "   ./scripts/fix-cloudfront-cors.sh"
echo ""
echo "2️⃣ Fix API Gateway CORS:"
echo "   ./scripts/fix-api-gateway-cors.sh"
echo ""
echo "3️⃣ Fix IAM permissions:"
echo "   ./scripts/fix-iam-permissions.sh"
echo ""
echo "4️⃣ Deploy to production:"
echo "   ./deploy-production.sh"
echo ""
echo -e "${BLUE}🧪 Test the complete flow:${NC}"
echo "1. Open: https://d7t9x3j66yd8k.cloudfront.net/"
echo "2. Login with credentials"
echo "3. Test dashboard buttons (Copy ID, Generate ACTA, Download PDF/DOCX, Send Email)"
echo "4. Verify project data loads from DynamoDB"
echo ""
echo -e "${GREEN}🚀 All frontend fixes are complete and ready for deployment!${NC}"