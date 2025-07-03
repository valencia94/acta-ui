# Cache Invalidation & Deployment Fix Guide

## Issue Identified
The UI is not reflecting latest changes (document title, removal of test projects) due to aggressive caching at multiple levels:

1. **Browser Cache** - Users' browsers cache old JS/CSS files
2. **CDN/CloudFront Cache** - AWS caches files for performance
3. **Build Cache** - Vite build cache may use stale files
4. **Node Modules Cache** - Cached dependencies

## Solutions Implemented

### 1. Updated `amplify.yml` for Better Cache Control

```yaml
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g pnpm
        - pnpm install --frozen-lockfile
        - rm -rf node_modules/.vite  # Clear Vite cache
        - rm -rf dist                # Clear build output
    build:
      commands:
        - pnpm run build            # Use pnpm instead of npm
```

### 2. Added Cache-Busting Headers

```yaml
customHeaders:
  - pattern: '**/*.html'
    headers:
      - key: 'Cache-Control'
        value: 'no-cache, no-store, must-revalidate'
  - pattern: '**/*.js'
    headers:
      - key: 'Cache-Control'
        value: 'public, max-age=31536000, immutable'
  - pattern: '**/*.css'
    headers:
      - key: 'Cache-Control'
        value: 'public, max-age=31536000, immutable'
```

### 3. Enhanced Vite Build Configuration

- Added hash-based file names for all assets
- Added build timestamp for cache busting
- Improved chunk splitting for better caching

### 4. Created Deployment Script

`scripts/deploy-with-cache-invalidation.sh` provides:
- Complete cache clearing
- Fresh dependency installation
- Build verification
- Automatic cache invalidation (if AWS CLI available)

## Manual Cache Invalidation Steps

### For AWS Amplify Users:

1. **After each deployment, manually invalidate cache:**
   ```bash
   aws amplify start-job --app-id YOUR_APP_ID --branch-name main --job-type RELEASE
   ```

2. **Or use AWS Console:**
   - Go to AWS Amplify Console
   - Select your app
   - Go to "App settings" > "Rewrites and redirects"
   - Click "Invalidate cache"

### For CloudFront Users:

1. **Invalidate specific paths:**
   ```bash
   aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
   ```

2. **Or use AWS Console:**
   - Go to CloudFront Console
   - Select your distribution
   - Go to "Invalidations" tab
   - Create invalidation for `/*`

## User Browser Cache Clearing

For end users experiencing issues:

1. **Hard Refresh:**
   - Chrome/Firefox: `Ctrl+F5` or `Ctrl+Shift+R`
   - Safari: `Cmd+Shift+R`

2. **Clear Browser Cache:**
   - Chrome: Settings > Privacy > Clear browsing data
   - Firefox: Settings > Privacy > Clear Data
   - Safari: Develop > Empty Caches

## Verification Steps

After deployment and cache invalidation:

1. **Check Document Title:**
   - Should show "Ikusi · Acta Platform"
   - Not "Vite + React"

2. **Check No Test Projects:**
   - Dashboard should not show any test/mock projects
   - Only real projects from API

3. **Check Network Tab:**
   - All JS/CSS files should have new hash names
   - HTML should return with no-cache headers

## Prevention for Future Deployments

1. **Always use the deployment script:**
   ```bash
   ./scripts/deploy-with-cache-invalidation.sh
   ```

2. **Set environment variable for Amplify:**
   ```bash
   export AMPLIFY_APP_ID=your-app-id
   ```

3. **Monitor build output:**
   - Verify no test data in logs
   - Check file hashes change between builds

## Build Verification Commands

```bash
# Verify no test projects in build
grep -r "test-project\|mock-project" dist/ || echo "Clean build"

# Verify correct title
grep "Ikusi · Acta Platform" dist/index.html && echo "Title correct"

# Check file hashes
ls -la dist/assets/
```

## Emergency Cache Fix

If users still see old content after deployment:

1. **Immediate steps:**
   ```bash
   # Clear all caches and rebuild
   rm -rf node_modules/.vite dist .cache
   pnpm install --frozen-lockfile
   pnpm run build
   
   # Verify build
   grep "Ikusi · Acta Platform" dist/index.html
   ```

2. **Push emergency fix:**
   - Change a comment in `src/App.tsx`
   - Commit and push to trigger new deployment
   - This forces new file hashes

3. **User notification:**
   - Tell users to hard refresh their browsers
   - Or provide cache-busting URL with timestamp

## Success Criteria

✅ Document title shows "Ikusi · Acta Platform"  
✅ No test/mock projects visible in UI  
✅ All assets have new hash names after build  
✅ HTML returns with no-cache headers  
✅ API calls work correctly (with auth)  
✅ All button functionality preserved  

## Next Steps

1. Deploy using updated `amplify.yml`
2. Monitor first user reports
3. Implement automated cache invalidation in CI/CD
4. Add cache-busting query parameters if needed
