# deploy-acta-ui.ps1
# One-stop local deploy script for Acta-UI frontend + CloudFront

$ErrorActionPreference = "Stop"

# Step 1: Build UI
Write-Host "📦 Building UI with Vite..."
pnpm install
pnpm run build

# Step 2: Set required env vars
$env:S3_BUCKET_NAME = "acta-ui-frontend-prod"
$env:CLOUDFRONT_DIST_ID = "EPQU7PVDLQXUA"

# Step 3: Sync dist/ to S3
Write-Host "☁️ Syncing assets to S3..."
aws s3 sync dist "s3://$env:S3_BUCKET_NAME" --delete

# Step 4: Upload /health with no-cache headers
Write-Host "💚 Uploading /health (no-cache)..."
aws s3 cp dist/health "s3://$env:S3_BUCKET_NAME/health" `
  --cache-control 'no-cache, no-store, must-revalidate' `
  --content-type 'application/json'

# Step 5: Invalidate CloudFront cache
Write-Host "🌐 Creating CloudFront invalidation..."
$invalidationId = aws cloudfront create-invalidation `
  --distribution-id "$env:CLOUDFRONT_DIST_ID" `
  --paths "/index.html" `
  --query 'Invalidation.Id' `
  --output text

Write-Host "🕒 Waiting for CloudFront invalidation to complete..."
aws cloudfront wait invalidation-completed `
  --distribution-id "$env:CLOUDFRONT_DIST_ID" `
  --id "$invalidationId"

# Step 6: Test Live API /health
Write-Host "🔍 Testing live /health endpoint..."
try {
  $result = Invoke-RestMethod "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health"
  Write-Host "✅ API /health check passed:"
  $result | ConvertTo-Json
} catch {
  Write-Host "❌ API /health check failed:"
  Write-Host $_.Exception.Message
}