#!/bin/bash
# fix-aws-exports-browser.sh
# Script to create a browser-compatible version of aws-exports.js for direct script tag use
set -euo pipefail

echo "🔧 Creating browser-compatible aws-exports.js..."

# Create browser-compatible version for public/aws-exports.js
cat > public/aws-exports.js << 'EOL'
// aws-exports.js - Browser compatible version for <script> tag
// This version assigns directly to window.awsmobile instead of using module exports
window.awsmobile = {
  // Region Configuration
  aws_project_region: 'us-east-2',
  
  // User Pool Configuration (for authentication)
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',
  
  // Identity Pool Configuration (for AWS service access, especially DynamoDB)
  aws_cognito_identity_pool_id: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
  aws_cognito_region: 'us-east-2',
  
  // OAuth Configuration
  oauth: {
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/',
    responseType: 'code',
    scope: ['email', 'openid', 'profile'],
  },
  
  // API Gateway Configuration
  aws_cloud_logic_custom: [{
    name: 'ActaAPI',
    endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
    region: 'us-east-2'
  }],
  
  // Auth role configuration for IAM
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  aws_cognito_role_arn: 'arn:aws:iam::703671891952:role/ActaUI-DynamoDB-AuthenticatedRole',
  
  // Mandatory auth flow configuration for both User Pool and Identity Pool
  Auth: {
    // Authentication flow configuration for sign-in
    authenticationFlowType: 'USER_SRP_AUTH',
    
    // Identity Pool configuration (for AWS service access, especially DynamoDB)
    identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
    identityPoolRegion: 'us-east-2',
    
    // User Pool configuration (for authentication)
    userPoolId: 'us-east-2_FyHLtOhiY',
    userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
    
    // Force sign-in to ensure credentials are available
    mandatorySignIn: true,
    region: 'us-east-2'
  }
};

console.log('✅ AWS Cognito config loaded successfully!');
EOL

echo "✅ Created browser-compatible version in public/aws-exports.js"

# Update vite.config.ts plugin to copy the browser-compatible version
cat > vite.config.ts << 'EOL'
// vite.config.ts
import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import path from 'path';
import tailwindcss from 'tailwindcss';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import { exec } from 'child_process';
import fs from 'fs';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [
    react(), 
    svgr(),
    {
      name: 'copy-aws-exports',
      closeBundle() {
        // Ensure the browser-compatible aws-exports.js file is copied to the dist folder
        console.log('📋 Copying browser-compatible aws-exports.js to dist folder...');
        if (fs.existsSync('public/aws-exports.js')) {
          fs.copyFileSync('public/aws-exports.js', 'dist/aws-exports.js');
          console.log('✅ Browser-compatible aws-exports.js copied successfully!');
        } else {
          console.log('❌ public/aws-exports.js not found!');
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  server: {
    host: true,
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  preview: {
    port: 5000,
  },
  build: {
    copyPublicDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          // Remove react-pdf entry as it's causing build failures
          // Separate other large dependencies
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
        },
        // Add timestamp to chunk names for better cache busting
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? path.basename(chunkInfo.facadeModuleId, path.extname(chunkInfo.facadeModuleId))
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit for PDF.js
    chunkSizeWarningLimit: 600,
  },
});
EOL

echo "✅ Updated vite.config.ts to copy browser-compatible aws-exports.js"

# Update deploy-production.sh to use the browser-compatible version
cat > deploy-production.sh << 'EOL'
#!/bin/bash
# deploy-production.sh
# Script to build and deploy ACTA UI to production
set -euo pipefail

# Production configuration from .env.production and infrastructure files
S3_BUCKET="acta-ui-frontend-prod"
CLOUDFRONT_DISTRIBUTION_ID="EPQU7PVDLQXUA" 
AWS_REGION="us-east-2"

echo "🚀 Deploying ACTA-UI to production..."
echo "→ S3 Bucket: $S3_BUCKET"
echo "→ CloudFront: $CLOUDFRONT_DISTRIBUTION_ID"
echo "→ AWS Region: $AWS_REGION"

# Step 0: Ensure browser-compatible aws-exports.js is in public/ folder
echo "🔒 Ensuring browser-compatible aws-exports.js exists..."
if [ ! -f public/aws-exports.js ] || ! grep -q "window.awsmobile" public/aws-exports.js; then
  echo "Creating browser-compatible aws-exports.js..."
  # Create from src version but make it browser-compatible
  cat > public/aws-exports.js << 'INNEREOF'
// aws-exports.js - Browser compatible version for <script> tag
// This version assigns directly to window.awsmobile instead of using module exports
window.awsmobile = {
  // Region Configuration
  aws_project_region: 'us-east-2',
  
  // User Pool Configuration (for authentication)
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',
  
  // Identity Pool Configuration (for AWS service access, especially DynamoDB)
  aws_cognito_identity_pool_id: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
  aws_cognito_region: 'us-east-2',
  
  // OAuth Configuration
  oauth: {
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/',
    responseType: 'code',
    scope: ['email', 'openid', 'profile'],
  },
  
  // API Gateway Configuration
  aws_cloud_logic_custom: [{
    name: 'ActaAPI',
    endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
    region: 'us-east-2'
  }],
  
  // Auth role configuration for IAM
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  aws_cognito_role_arn: 'arn:aws:iam::703671891952:role/ActaUI-DynamoDB-AuthenticatedRole',
  
  // Mandatory auth flow configuration for both User Pool and Identity Pool
  Auth: {
    // Authentication flow configuration for sign-in
    authenticationFlowType: 'USER_SRP_AUTH',
    
    // Identity Pool configuration (for AWS service access, especially DynamoDB)
    identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
    identityPoolRegion: 'us-east-2',
    
    // User Pool configuration (for authentication)
    userPoolId: 'us-east-2_FyHLtOhiY',
    userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
    
    // Force sign-in to ensure credentials are available
    mandatorySignIn: true,
    region: 'us-east-2'
  }
};

console.log('✅ AWS Cognito config loaded successfully!');
INNEREOF
  echo "✅ Created browser-compatible aws-exports.js"
else
  echo "✅ Browser-compatible aws-exports.js already exists"
fi

# Step 1: Build the application
echo "📦 Building application..."
pnpm run build

# Step 1.2: Force inclusion of critical API functions in build (tree-shake prevention)
echo "🔒 Ensuring critical API functions are included in build..."
# This step handled in main.tsx directly now

# Step 1.3: Verify aws-exports.js in dist/ (AFTER build)
echo "🔄 Verifying aws-exports.js in dist/ (post-build)..."
if [ -f dist/aws-exports.js ]; then
  if grep -q "window.awsmobile" dist/aws-exports.js; then
    echo "✅ Browser-compatible aws-exports.js confirmed in dist/"
  else
    echo "❌ WARNING: dist/aws-exports.js exists but may not be browser-compatible!"
    # Overwrite with the correct version
    cp public/aws-exports.js dist/aws-exports.js
    echo "✅ Fixed aws-exports.js in dist/ with browser-compatible version"
  fi
else
  echo "❌ WARNING: aws-exports.js missing from dist/! Copying now..."
  cp public/aws-exports.js dist/aws-exports.js
  echo "✅ aws-exports.js copied to dist/"
fi

# Step 1.5: Verify critical files in the build
echo "🔍 Verifying critical files in the build..."

# Check for authentication configuration in build files
if grep -q "aws-amplify" dist/assets/*.js; then
  echo "✅ Found AWS Amplify imports in build"
else
  echo "❌ WARNING: AWS Amplify imports may be missing from build"
fi

# Check for Cognito configuration
if grep -q "us-east-2_FyHLtOhiY" dist/assets/*.js; then
  echo "✅ Found Cognito User Pool ID in build"
else
  echo "❌ WARNING: Cognito User Pool ID not found in build"
fi

# Check for correct Cognito domain
if grep -q "us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com" dist/assets/*.js; then
  echo "✅ Found correct Cognito domain in build"
else
  echo "❌ WARNING: Correct Cognito domain not found in build"
fi

# Step 2: Sync to S3 bucket
echo "☁️ Uploading to S3 bucket..."
aws s3 sync dist/ s3://$S3_BUCKET --delete

# Step 3: Invalidate CloudFront cache
echo "🌐 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

# Step 4: Verify deployment (if curl is available)
if command -v curl &> /dev/null; then
  echo "🔍 Verifying deployment..."
  echo "→ Checking if site is accessible..."
  if curl -s -o /dev/null -w "%{http_code}" https://d7t9x3j66yd8k.cloudfront.net | grep -q "200"; then
    echo "✅ Site is accessible (HTTP 200)"
  else
    echo "⚠️ Site may not be accessible yet - CloudFront propagation can take a few minutes"
  fi
fi

# Step 5: Add reminder for manual verification
echo ""
echo "✅ Deployment complete! The changes should be visible at https://d7t9x3j66yd8k.cloudfront.net"
echo ""
echo "🧪 IMPORTANT: Please verify these manual test cases:"
echo "  1. Login with christian.valencia@ikusi.com / PdYb7TU7HvBhYP7\$!"
echo "  2. Check that 7 projects are loaded"
echo "  3. Select a project and verify all buttons work (Generate ACTA, PDF, DOCX, Send)"
echo "  4. Verify no 401 Unauthorized errors in console"
echo ""
echo "🔍 If you see authentication issues, try clearing your browser cache and cookies."
EOL

echo "✅ Updated deploy-production.sh to handle browser-compatible aws-exports.js"

chmod +x deploy-production.sh

echo "🔄 Making script executable..."
chmod +x "$0"

echo "✅ All fixes applied successfully!"
echo "🚀 Next steps:"
echo "  1. Run this script: ./fix-aws-exports-browser.sh"
echo "  2. Run the deployment script: ./deploy-production.sh"
echo "  3. Verify authentication works in the deployed application"
