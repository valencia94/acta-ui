#!/bin/bash

# S3 Version Restore Script - Restore to July 8, 2025 10:58 PM UTC
# This script restores all files in the S3 bucket to their versions as of the target date

set -e

# Configuration
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA"
AWS_REGION="us-east-2"
TARGET_DATE="2025-07-08T22:58:12.000Z"  # July 8, 2025 10:58:12 PM UTC (4:58:12 PM CST)

echo "🔄 Starting S3 version restore process..."
echo "📅 Target date: $TARGET_DATE"
echo "🪣 S3 Bucket: $S3_BUCKET"
echo "🌐 CloudFront Distribution: $CLOUDFRONT_DISTRIBUTION_ID"
echo ""

# Step 1: Get all object versions
echo "📋 Getting all object versions from S3..."
aws s3api list-object-versions --bucket "$S3_BUCKET" --output json > all_versions.json

# Step 2: Extract versions close to the target date
echo "🔍 Finding versions near target date..."
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('all_versions.json', 'utf8'));
const targetDate = new Date('$TARGET_DATE');

const restoreCommands = [];
const processedKeys = new Set();

// Process Versions (not DeleteMarkers)
if (data.Versions) {
  data.Versions.forEach(version => {
    const versionDate = new Date(version.LastModified);
    const key = version.Key;
    
    // Skip if we already processed this key
    if (processedKeys.has(key)) return;
    
    // Find the version that was active at the target date
    // (last version before or at the target date)
    if (versionDate <= targetDate) {
      processedKeys.add(key);
      restoreCommands.push({
        key: key,
        versionId: version.VersionId,
        lastModified: version.LastModified,
        size: version.Size
      });
    }
  });
}

// Sort by key for organized output
restoreCommands.sort((a, b) => a.key.localeCompare(b.key));

// Write restore commands to a script
const scriptContent = restoreCommands.map(cmd => 
  'aws s3api copy-object \\\\' + '\n' +
  '  --bucket \"$S3_BUCKET\" \\\\' + '\n' +
  '  --key \"' + cmd.key + '\" \\\\' + '\n' +
  '  --copy-source \"$S3_BUCKET/' + cmd.key + '?versionId=' + cmd.versionId + '\" \\\\' + '\n' +
  '  --metadata-directive REPLACE \\\\' + '\n' +
  '  --region \"$AWS_REGION\"' + '\n' +
  'echo \"✅ Restored: ' + cmd.key + ' (' + cmd.size + ' bytes, ' + cmd.lastModified + ')\"' + '\n'
).join('\n');

fs.writeFileSync('restore_commands.sh', scriptContent);

console.log('📝 Generated restore commands for ' + restoreCommands.length + ' files');
console.log('📄 Files to restore:');
restoreCommands.forEach(cmd => {
  console.log('  - ' + cmd.key + ' (' + Math.round(cmd.size/1024) + 'KB, ' + cmd.lastModified + ')');
});
"

# Step 3: Execute restore commands
if [ -f "restore_commands.sh" ]; then
  echo ""
  echo "🔄 Executing restore commands..."
  echo ""
  
  # Source the restore commands
  . ./restore_commands.sh
  
  echo ""
  echo "✅ All files restored to versions from $TARGET_DATE"
else
  echo "❌ Failed to generate restore commands"
  exit 1
fi

# Step 4: Create CloudFront invalidation
echo ""
echo "🔄 Creating CloudFront invalidation..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "📋 Invalidation ID: $INVALIDATION_ID"
echo ""

# Step 5: Monitor invalidation status
echo "⏳ Monitoring invalidation progress..."
while true; do
  STATUS=$(aws cloudfront get-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --id "$INVALIDATION_ID" \
    --query 'Invalidation.Status' \
    --output text)
  
  echo "📊 Invalidation status: $STATUS"
  
  if [ "$STATUS" = "Completed" ]; then
    break
  fi
  
  sleep 30
done

# Step 6: Test the restored site
echo ""
echo "🧪 Testing restored site..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://d7t9x3j66yd8k.cloudfront.net/")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Site is responding (HTTP $HTTP_STATUS)"
else
  echo "⚠️  Site returned HTTP $HTTP_STATUS"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up temporary files..."
rm -f all_versions.json restore_commands.sh

echo ""
echo "🎉 S3 version restore completed!"
echo "📱 Your site should now be restored to: https://d7t9x3j66yd8k.cloudfront.net/"
echo "📅 All files restored to their state from: $TARGET_DATE"
echo ""
echo "ℹ️  Note: It may take 5-15 minutes for all changes to propagate through CloudFront."
