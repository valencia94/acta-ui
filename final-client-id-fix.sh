#!/bin/bash

# PRODUCTION CLIENT ID FIX - Final Deployment
# ==========================================

echo "🔧 EMERGENCY FIX: Deploying Corrected Client ID"
echo "==============================================="
echo ""

echo "📋 Issue Confirmed:"
echo "   • Production site still shows: 'User pool client 1hdn8b19ub2kmfkuse8rsjpv8e does not exist'"
echo "   • This proves the current deployed build has the wrong client ID"
echo ""

echo "✅ Files Already Fixed:"
echo "   • src/aws-exports.js -> dshos5iou44tuach7ta3ici5m"  
echo "   • .env.production -> dshos5iou44tuach7ta3ici5m"
echo "   • .env.example -> dshos5iou44tuach7ta3ici5m"
echo "   • src/utils/authFlowTest.ts -> dshos5iou44tuach7ta3ici5m"
echo ""

echo "🚨 CRITICAL: The production site needs a new build with the corrected client ID"
echo ""

cd /Users/diegobotero/acta-ui

echo "📦 Step 1: Clean and rebuild frontend..."
rm -rf dist/
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🔍 Step 2: Verify the new build..."
    NEW_JS_FILE=$(find dist/assets -name "index-*.js" | head -1)
    
    if [ -f "$NEW_JS_FILE" ]; then
        echo "   Checking bundle: $NEW_JS_FILE"
        
        CORRECT_COUNT=$(grep -o "dshos5iou44tuach7ta3ici5m" "$NEW_JS_FILE" | wc -l | tr -d ' ')
        INCORRECT_COUNT=$(grep -o "1hdn8b19ub2kmfkuse8rsjpv8e" "$NEW_JS_FILE" | wc -l | tr -d ' ')
        
        echo "   ✅ Correct client ID found: $CORRECT_COUNT times"
        echo "   ❌ Incorrect client ID found: $INCORRECT_COUNT times"
        
        if [ "$CORRECT_COUNT" -gt 0 ] && [ "$INCORRECT_COUNT" -eq 0 ]; then
            echo ""
            echo "✅ BUILD VERIFICATION PASSED!"
            echo ""
            
            echo "🚀 Step 3: Deploy to production S3..."
            aws s3 sync dist/ s3://acta-ui-frontend-prod --delete --region us-east-2
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "🔄 Step 4: Invalidate CloudFront cache..."
                INVALIDATION_ID=$(aws cloudfront create-invalidation \
                    --distribution-id EPQU7PVDLQXUA \
                    --paths "/*" \
                    --query 'Invalidation.Id' \
                    --output text)
                
                echo "✅ CloudFront invalidation: $INVALIDATION_ID"
                echo ""
                echo "🎉 PRODUCTION DEPLOYMENT COMPLETE!"
                echo "=================================="
                echo ""
                echo "📋 What was fixed:"
                echo "   • Incorrect client ID: 1hdn8b19ub2kmfkuse8rsjpv8e (REMOVED)"
                echo "   • Correct client ID: dshos5iou44tuach7ta3ici5m (DEPLOYED)"
                echo ""
                echo "🌐 Test URL: https://d7t9x3j66yd8k.cloudfront.net"
                echo ""
                echo "⏳ Wait 2-3 minutes for CloudFront propagation, then:"
                echo "   1. Refresh the browser (Ctrl+F5)"
                echo "   2. Try logging in again"
                echo "   3. The 'User pool client does not exist' error should be GONE"
                echo ""
                echo "✅ EXPECTED RESULT: Successful login to dashboard!"
                
            else
                echo "❌ S3 deployment failed"
                exit 1
            fi
        else
            echo ""
            echo "❌ BUILD VERIFICATION FAILED!"
            echo "   The bundle still contains the incorrect client ID."
            echo "   Check for additional configuration files that may need fixing."
            exit 1
        fi
    else
        echo "❌ No JavaScript bundle found after build"
        exit 1
    fi
else
    echo "❌ Frontend build failed"
    exit 1
fi
