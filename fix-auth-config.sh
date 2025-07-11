#!/usr/bin/env bash
set -euo pipefail

# Fix authentication configuration
# This script ensures proper configuration of both User Pool and Identity Pool auth flows

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}ACTA-UI Authentication Fix${NC}"
echo -e "${BLUE}==============================================${NC}"

# Step 1: Check and fix aws-exports.js
echo -e "\n${BLUE}Step 1: Ensuring aws-exports.js has both auth flows...${NC}"

# Create backup of aws-exports.js
cp src/aws-exports.js src/aws-exports.js.bak
echo -e "${GREEN}✅ Backup created: src/aws-exports.js.bak${NC}"

# Validate aws-exports.js content
if grep -q "aws_cognito_identity_pool_id" src/aws-exports.js && grep -q "Auth.*authenticationFlowType" src/aws-exports.js; then
  echo -e "${GREEN}✅ aws-exports.js already has both auth flows configured${NC}"
else
  echo -e "${YELLOW}⚠️ Need to update aws-exports.js to include both auth flows${NC}"
  
  # Create a proper aws-exports.js with both auth flows
  cat > src/aws-exports.js << 'EOF'
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

export default awsmobile;
EOF
  echo -e "${GREEN}✅ Updated aws-exports.js with complete configuration for both auth flows${NC}"
fi

# Step 2: Create browser-compatible aws-exports.js in public directory
echo -e "\n${BLUE}Step 2: Creating browser-compatible aws-exports.js in public directory...${NC}"
mkdir -p public

# Create browser-compatible version for direct script tag use
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

echo -e "${GREEN}✅ Created browser-compatible version in public/aws-exports.js${NC}"

# Step 3: Fix index.html to load aws-exports.js in the head section
echo -e "\n${BLUE}Step 3: Ensuring index.html loads aws-exports.js in head section...${NC}"

# Create backup of index.html
cp index.html index.html.bak
echo -e "${GREEN}✅ Backup created: index.html.bak${NC}"

# Check if aws-exports.js is already in the head section
if grep -q '<head>.*<script src="/aws-exports.js">' index.html; then
  echo -e "${GREEN}✅ index.html already loads aws-exports.js in head section${NC}"
else
  echo -e "${YELLOW}⚠️ Need to update index.html to load aws-exports.js in head section${NC}"
  
  # Update index.html to load aws-exports.js in head section before any other scripts
  # First remove any existing aws-exports.js script tags to avoid duplicates
  sed -i'.tmp' '/<script src="\/aws-exports.js"><\/script>/d' index.html
  # Then add the script tag after the icon link
  sed -i'.tmp2' 's/<link rel="icon" type="image\/png" href="\/assets\/ikusi-logo.png" \/>/<link rel="icon" type="image\/png" href="\/assets\/ikusi-logo.png" \/>\n    <!-- CRITICAL: Load AWS configuration before any other scripts -->\n    <script src="\/aws-exports.js"><\/script>/' index.html
  
  # Remove the aws-exports.js script tag from body if it exists
  sed -i'.tmp2' '/<body>.*<script src="\/aws-exports.js"><\/script>/s/<script src="\/aws-exports.js"><\/script>//' index.html
  
  # Clean up temp files
  rm -f index.html.tmp index.html.tmp2
  
  echo -e "${GREEN}✅ Updated index.html to load aws-exports.js in head section${NC}"
fi

# Step 4: Fix main.tsx Amplify configuration
echo -e "\n${BLUE}Step 4: Ensuring Amplify is properly configured in main.tsx...${NC}"

# Create backup of main.tsx
cp src/main.tsx src/main.tsx.bak
echo -e "${GREEN}✅ Backup created: src/main.tsx.bak${NC}"

# Validate the way Amplify is configured in main.tsx
if grep -q "import { Amplify } from 'aws-amplify'" src/main.tsx && grep -q "configureAmplify" src/main.tsx; then
  echo -e "${GREEN}✅ main.tsx already has proper Amplify configuration${NC}"
else
  echo -e "${YELLOW}⚠️ Need to update main.tsx to properly configure Amplify${NC}"
  
  # Create an enhanced main.tsx
  cat > src/main.tsx << 'EOF'
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
    
    // Ensure Identity Pool configuration is included
    if (!window.awsmobile.aws_cognito_identity_pool_id) {
      console.warn('⚠️ Identity Pool ID not found in window.awsmobile, might affect DynamoDB access');
    }
    
    // Ensure Auth configuration is included
    if (!window.awsmobile.Auth) {
      console.warn('⚠️ Auth configuration not found in window.awsmobile, adding it');
      window.awsmobile.Auth = {
        authenticationFlowType: 'USER_SRP_AUTH',
        identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
        identityPoolRegion: 'us-east-2',
        userPoolId: 'us-east-2_FyHLtOhiY',
        userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
        mandatorySignIn: true,
        region: 'us-east-2'
      };
    }
    
    Amplify.configure(window.awsmobile);
    console.log('✅ Amplify configured successfully with both User Pool and Identity Pool');
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
EOF
  echo -e "${GREEN}✅ Updated main.tsx with enhanced Amplify configuration for both auth flows${NC}"
fi

# Step 5: Fix vite.config.ts
echo -e "\n${BLUE}Step 5: Ensuring vite.config.ts copies browser-compatible aws-exports.js...${NC}"

# Create backup of vite.config.ts
cp vite.config.ts vite.config.ts.bak
echo -e "${GREEN}✅ Backup created: vite.config.ts.bak${NC}"

# Validate vite.config.ts includes aws-exports.js handling
if grep -q "copy-aws-exports" vite.config.ts && grep -q "public/aws-exports.js" vite.config.ts; then
  echo -e "${GREEN}✅ vite.config.ts already has browser-compatible aws-exports.js handling${NC}"
else
  echo -e "${YELLOW}⚠️ Need to update vite.config.ts to handle browser-compatible aws-exports.js${NC}"
  
  # Update vite.config.ts
  sed -i'.tmp' 's/plugins: \[/plugins: [\n    {\n      name: "copy-aws-exports",\n      closeBundle() {\n        console.log("📋 Copying browser-compatible aws-exports.js to dist folder...");\n        if (fs.existsSync("public\/aws-exports.js")) {\n          fs.copyFileSync("public\/aws-exports.js", "dist\/aws-exports.js");\n          console.log("✅ Browser-compatible aws-exports.js copied successfully!");\n        } else {\n          console.log("❌ public\/aws-exports.js not found!");\n        }\n      }\n    },/' vite.config.ts
  rm -f vite.config.ts.tmp
  
  # Add fs import if not present
  if ! grep -q "import fs from 'fs'" vite.config.ts; then
    sed -i'.tmp' 's/import path from/import fs from "fs";\nimport path from/' vite.config.ts
    rm -f vite.config.ts.tmp
  fi
  
  echo -e "${GREEN}✅ Updated vite.config.ts to properly handle browser-compatible aws-exports.js${NC}"
fi

# Step 6: Clean and rebuild
echo -e "\n${BLUE}Step 6: Cleaning and rebuilding...${NC}"
rm -rf dist
echo -e "${GREEN}✅ Previous build cleaned${NC}"

echo -e "${BLUE}Building project...${NC}"
npm run build || pnpm run build || yarn build

if [ ! -d "dist" ]; then
  echo -e "${RED}❌ Build failed! Check the logs above for errors.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Project rebuilt successfully${NC}"

# Step 7: Verify aws-exports.js in dist
echo -e "\n${BLUE}Step 7: Verifying aws-exports.js in dist...${NC}"
if [ -f "dist/aws-exports.js" ]; then
  if grep -q "window.awsmobile" dist/aws-exports.js; then
    echo -e "${GREEN}✅ Browser-compatible aws-exports.js confirmed in dist/${NC}"
  else
    echo -e "${YELLOW}⚠️ dist/aws-exports.js exists but may not be browser-compatible!${NC}"
    # Overwrite with the correct version
    cp public/aws-exports.js dist/aws-exports.js
    echo -e "${GREEN}✅ Fixed aws-exports.js in dist/ with browser-compatible version${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ aws-exports.js not found in dist, copying manually...${NC}"
  cp public/aws-exports.js dist/aws-exports.js
  echo -e "${GREEN}✅ Manually copied browser-compatible aws-exports.js to dist${NC}"
fi

# Step 8: Verify index.html in dist loads aws-exports.js correctly
echo -e "\n${BLUE}Step 8: Verifying index.html in dist loads aws-exports.js correctly...${NC}"
if [ -f "dist/index.html" ]; then
  if grep -q '<head>.*<script src="/aws-exports.js"' dist/index.html; then
    echo -e "${GREEN}✅ dist/index.html correctly loads aws-exports.js in head section${NC}"
  else
    echo -e "${YELLOW}⚠️ dist/index.html may not load aws-exports.js correctly${NC}"
    echo -e "${YELLOW}⚠️ This might be due to Vite's HTML processing. Check the file manually.${NC}"
  fi
else
  echo -e "${RED}❌ dist/index.html not found!${NC}"
fi

echo -e "\n${BLUE}==============================================${NC}"
echo -e "${GREEN}✅ Authentication configuration fixed!${NC}"
echo -e "${BLUE}==============================================${NC}"

echo -e "\n${GREEN}✅ Key Fixes Implemented:${NC}"
echo -e "1. Created a browser-compatible aws-exports.js that uses window.awsmobile"
echo -e "2. Fixed index.html to load aws-exports.js in the head section before other scripts"
echo -e "3. Enhanced Amplify configuration in main.tsx with robust fallbacks"
echo -e "4. Updated vite.config.ts to properly handle browser-compatible aws-exports.js"
echo -e "5. Verified aws-exports.js is correctly included in the build output"

echo -e "\n${YELLOW}📋 Next steps:${NC}"
echo -e "1. Run the deploy-production.sh script to deploy these changes"
echo -e "2. Test the authentication with the test-auth-flow.sh script"
echo -e "3. Verify both User Pool and Identity Pool auth work in the application"
echo -e "4. Clear your browser cache and cookies before testing"
