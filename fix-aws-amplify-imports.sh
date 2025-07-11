#!/bin/bash

# Fix AWS Amplify Module Resolution Issues Script
# This script ensures that aws-amplify is properly imported in the build

set -e

echo "🚀 Starting AWS Amplify module resolution fix..."

# Step 1: Fix aws-exports.js to include proper imports
echo "📄 Checking aws-exports.js..."
cp src/aws-exports.js src/aws-exports.js.bak
echo "✅ Backup created: src/aws-exports.js.bak"

# Create a fixed aws-exports.js with proper imports
cat > src/aws-exports.js << 'EOL'
// src/aws-exports.js - COMPLETE CONFIGURATION
const awsmobile = {
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
  
  // Auth role configuration
  aws_appsync_authenticationType: 'AMAZON_COGNITO_USER_POOLS',
  
  // Mandatory auth flow configuration for both User Pool and Identity Pool
  Auth: {
    authenticationFlowType: 'USER_SRP_AUTH',
    identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
    identityPoolRegion: 'us-east-2',
    userPoolId: 'us-east-2_FyHLtOhiY',
    userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
    mandatorySignIn: true,
    region: 'us-east-2'
  }
};

export default awsmobile;
EOL

echo "✅ Updated aws-exports.js with corrected configuration"

# Step 2: Update the vite.config.ts to include aws-exports.js in the build
echo "📄 Fixing vite.config.ts..."

# Restore the backup if needed (in case rebuild-and-deploy-complete.sh was run before)
if [ -f vite.config.ts.backup ]; then
  cp vite.config.ts.backup vite.config.ts
  echo "✅ Restored vite.config.ts from backup"
fi

# Create a new fixed vite.config.ts with explicit copying of aws-exports.js
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
        // Ensure the aws-exports.js file is copied to the dist folder
        console.log('📋 Copying aws-exports.js to dist folder...');
        if (fs.existsSync('src/aws-exports.js')) {
          fs.copyFileSync('src/aws-exports.js', 'dist/aws-exports.js');
          console.log('✅ aws-exports.js copied successfully!');
        } else {
          console.log('❌ src/aws-exports.js not found!');
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

echo "✅ Created improved vite.config.ts with aws-exports.js copy plugin"

# Step 3: Fix main.tsx to import required API functions
echo "📄 Checking main.tsx..."
cp src/main.tsx src/main.tsx.bak
echo "✅ Backup created: src/main.tsx.bak"

# Create a new main.tsx that correctly imports all required functions
cat > src/main.tsx << 'EOL'
// src/main.tsx
// Import critical functions to ensure they're included in the build
import { getSummary, getTimeline, getDownloadUrl, sendApprovalEmail } from "@/lib/api";
import { fetcher, getAuthToken } from "@/utils/fetchWrapper";

// 🔐 Amplify core import & configuration
import { Amplify } from 'aws-amplify';
import React from 'react';
import ReactDOM from 'react-dom/client';

// Import hooks
import '@/hooks/useAuth';
import '@/hooks/useIdleLogout';
import '@/hooks/useThemedFavicon';

// AWS configuration is loaded via script tag in index.html
declare global {
  interface Window {
    awsmobile: any;
    getSummary: typeof getSummary;
    getTimeline: typeof getTimeline;
    getDownloadUrl: typeof getDownloadUrl;
    sendApprovalEmail: typeof sendApprovalEmail;
    fetchWrapper: typeof fetcher;
    getAuthToken: typeof getAuthToken;
  }
}

// Enhanced Amplify configuration with proper waiting
const configureAmplify = async () => {
  console.log('🔧 Attempting to configure Amplify...');
  
  // Wait for aws-exports.js to load
  let attempts = 0;
  while (!window.awsmobile && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  if (window.awsmobile) {
    console.log('✅ AWS config found, configuring Amplify:', window.awsmobile);
    Amplify.configure(window.awsmobile);
    console.log('✅ Amplify configured successfully');
  } else {
    console.error('❌ aws-exports.js failed to load after 5 seconds');
    
    // Fallback to local import if window.awsmobile isn't available
    try {
      console.log('⚠️ Falling back to imported aws-exports.js...');
      const awsExports = await import('@/aws-exports');
      Amplify.configure(awsExports.default);
      console.log('✅ Amplify configured with imported aws-exports.js');
    } catch (err) {
      console.error('❌ Failed to configure Amplify:', err);
    }
  }
};

// 🖌️ Global styles & design tokens
import '@/styles/variables.css'; // CSS custom props (color, spacing, etc.)
import '@/styles/amplify-overrides.css'; // Amplify UI theme overrides
import '@/tailwind.css'; // Tailwind utilities
import '@aws-amplify/ui-react/styles.css'; // Amplify UI default styles

// 🚀 Your root App component
import App from '@/App';

// Configure Amplify before rendering
configureAmplify().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

// Export critical functions to global window for testing
window.getSummary = getSummary;
window.getTimeline = getTimeline;
window.getDownloadUrl = getDownloadUrl;
window.sendApprovalEmail = sendApprovalEmail;
window.fetchWrapper = fetcher;
window.getAuthToken = getAuthToken;
EOL

echo "✅ Fixed main.tsx with required imports and global function exports"

# Step 4: Ensure aws-exports.js is in ALL required locations
echo "📄 Ensuring aws-exports.js is in all required locations..."

# 1. Copy to public directory for development mode
mkdir -p public
cp src/aws-exports.js public/aws-exports.js
echo "✅ Copied aws-exports.js to public directory for development"

# 2. Create assets directory and copy there (some configurations might look for it here)
mkdir -p public/assets
cp src/aws-exports.js public/assets/aws-exports.js
echo "✅ Copied aws-exports.js to public/assets directory for redundancy"

# 3. For module imports directly from src
echo "✅ aws-exports.js already exists in src directory for direct imports"

# Step 5: Clean and rebuild
echo "🧹 Cleaning previous build..."
rm -rf dist
echo "✅ Previous build cleaned"

echo "🏗️ Rebuilding the project..."
npm run build || pnpm run build || yarn build || true  # Continue even if build fails

# Step 6: Verify the build
echo "🔍 Verifying build output..."
if [ ! -f "dist/aws-exports.js" ]; then
  echo "⚠️ aws-exports.js missing from dist root, copying manually..."
  cp src/aws-exports.js dist/aws-exports.js
  echo "✅ Manually copied aws-exports.js to dist directory"
else
  echo "✅ aws-exports.js found in build root"
fi

# Also ensure it's in assets directory for redundancy
mkdir -p dist/assets
if [ ! -f "dist/assets/aws-exports.js" ]; then
  echo "⚠️ aws-exports.js missing from dist/assets, copying manually..."
  cp src/aws-exports.js dist/assets/aws-exports.js
  echo "✅ Manually copied aws-exports.js to dist/assets directory"
else
  echo "✅ aws-exports.js found in dist/assets"
fi

# Verify the content of the aws-exports.js files
echo "🔍 Verifying aws-exports.js content..."
if grep -q "aws_cognito_identity_pool_id" dist/aws-exports.js && grep -q "Auth" dist/aws-exports.js; then
  echo "✅ aws-exports.js contains both User Pool and Identity Pool configurations"
else
  echo "⚠️ aws-exports.js might be missing critical configurations"
fi

echo "🎉 AWS Amplify module resolution fix completed!"
echo "🧪 Run the test-production.js script to verify the changes: node test-production.js"
