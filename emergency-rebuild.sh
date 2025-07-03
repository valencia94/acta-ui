#!/bin/bash
echo "🔧 EMERGENCY CLIENT ID FIX & DEPLOYMENT"
echo "======================================="
echo ""

echo "✅ All fixed files now have correct client ID: dshos5iou44tuach7ta3ici5m"
echo ""

echo "📦 Building frontend..."
rm -rf dist/
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🔍 Verifying new build..."
    NEW_JS_FILE=$(find dist/assets -name "index-*.js" | head -1)
    
    if [ -f "$NEW_JS_FILE" ]; then
        echo "Checking: $NEW_JS_FILE"
        CORRECT_COUNT=$(grep -o "dshos5iou44tuach7ta3ici5m" "$NEW_JS_FILE" | wc -l)
        INCORRECT_COUNT=$(grep -o "1hdn8b19ub2kmfkuse8rsjpv8e" "$NEW_JS_FILE" | wc -l)
        
        echo "✅ Correct client ID found: $CORRECT_COUNT times"
        echo "❌ Incorrect client ID found: $INCORRECT_COUNT times"
        
        if [ "$CORRECT_COUNT" -gt 0 ] && [ "$INCORRECT_COUNT" -eq 0 ]; then
            echo ""
            echo "✅ BUILD SUCCESS: Bundle contains ONLY correct client ID!"
            echo ""
            
            echo "🚀 Deploying to S3..."
            aws s3 sync dist/ s3://acta-ui-frontend-prod --delete --region us-east-2
            
            if [ $? -eq 0 ]; then
                echo ""
                echo "🔄 Invalidating CloudFront cache..."
                INVALIDATION_ID=$(aws cloudfront create-invalidation \
                    --distribution-id EPQU7PVDLQXUA \
                    --paths "/*" \
                    --query 'Invalidation.Id' \
                    --output text)
                
                echo "✅ Cache invalidation created: $INVALIDATION_ID"
                echo ""
                echo "🎉 EMERGENCY FIX DEPLOYED!"
                echo ""
                echo "📋 Summary:"
                echo "   • Fixed incorrect client ID in all source files"
                echo "   • Rebuilt frontend with correct configuration"
                echo "   • Deployed to S3 bucket: acta-ui-frontend-prod"
                echo "   • CloudFront cache invalidated"
                echo ""
                echo "⏳ Wait 2-3 minutes for CloudFront propagation"
                echo "🌐 Then test: https://d7t9x3j66yd8k.cloudfront.net"
                echo ""
                echo "Expected result: NO MORE 'User pool client does not exist' errors!"
            else
                echo "❌ S3 deployment failed"
                exit 1
            fi
        else
            echo "❌ BUILD ISSUE: Bundle still contains incorrect client ID"
            exit 1
        fi
    else
        echo "❌ No JavaScript bundle found after build"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi
