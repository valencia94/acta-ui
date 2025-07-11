#!/bin/bash
# Script to verify and fix aws-exports.js Cognito domain
set -e

echo "🔍 Checking aws-exports.js Cognito domain configuration..."

# Config
AWS_EXPORTS_FILE="src/aws-exports.js"
CORRECT_DOMAIN="us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com"

# Check if aws-exports.js exists
if [ ! -f "$AWS_EXPORTS_FILE" ]; then
  echo "❌ Error: $AWS_EXPORTS_FILE not found"
  exit 1
fi

# Check for domain in aws-exports.js
if grep -q "domain: *'$CORRECT_DOMAIN'" "$AWS_EXPORTS_FILE"; then
  echo "✅ Cognito domain is correctly configured"
  echo "   Domain: $CORRECT_DOMAIN"
else
  echo "❌ Incorrect Cognito domain found in $AWS_EXPORTS_FILE"
  
  # Find current domain configuration
  CURRENT_DOMAIN=$(grep -o "domain: *'[^']*'" "$AWS_EXPORTS_FILE" | sed "s/domain: *'//g" | sed "s/'//g")
  
  if [ -n "$CURRENT_DOMAIN" ]; then
    echo "   Current domain: $CURRENT_DOMAIN"
    echo "   Correct domain: $CORRECT_DOMAIN"
    
    # Create backup
    cp "$AWS_EXPORTS_FILE" "${AWS_EXPORTS_FILE}.bak"
    echo "   Backup created: ${AWS_EXPORTS_FILE}.bak"
    
    # Fix domain
    sed -i.tmp "s/domain: *'[^']*'/domain: '$CORRECT_DOMAIN'/" "$AWS_EXPORTS_FILE"
    rm -f "${AWS_EXPORTS_FILE}.tmp"
    
    echo "✅ Domain fixed in $AWS_EXPORTS_FILE"
  else
    echo "❓ Couldn't find domain configuration in $AWS_EXPORTS_FILE"
    echo "   Please check the file format and fix manually"
    exit 1
  fi
fi

echo ""
echo "📝 Reminder: After fixing aws-exports.js, you need to rebuild and redeploy the application"
echo "   Run: ./enhanced-deploy-production.sh"
echo ""
echo "🎉 Done!"
