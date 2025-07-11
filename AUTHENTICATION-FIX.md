# Authentication Fix Documentation for ACTA-UI

**Date:** July 9, 2025

## Problem Overview

The ACTA-UI application was experiencing authentication issues in production, preventing users from successfully logging in and accessing resources. The primary symptoms were:

1. "Auth UserPool not configured" errors
2. "aws-exports.js is NOT loaded!" errors in console
3. "Unexpected token 'export'" errors when loading aws-exports.js
4. 401 Unauthorized errors when accessing backend APIs
5. Identity Pool credentials not being properly obtained

## Root Cause Analysis

After thorough investigation, we identified several root causes:

1. **ES Module Syntax in Browser Context**: The aws-exports.js file was using ES module syntax (`export default awsmobile`), but was being loaded directly via a script tag in index.html. In a direct script tag context, ES module syntax is not supported, causing the "Unexpected token 'export'" error.

2. **Script Loading Order**: The aws-exports.js script was loaded in the body of index.html, after the React bundle had begun initialization, causing race conditions.

3. **Incomplete Configuration**: The aws-exports.js file did not include the complete configuration needed for both User Pool and Identity Pool authentication flows.

4. **Build Process Issues**: The Vite build process wasn't properly including aws-exports.js in the final build output, or was placing it in an incorrect location.

## Implemented Fixes

### 1. Browser-Compatible aws-exports.js

Created a browser-compatible version of aws-exports.js that directly assigns to window.awsmobile instead of using ES module exports:

```javascript
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
```

### 2. Fixed Script Loading Order

Modified index.html to load aws-exports.js in the head section, before any other scripts:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Ikusi · Acta Platform</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/assets/ikusi-logo.png" />
    <!-- CRITICAL: Load AWS configuration before any other scripts -->
    <script src="/aws-exports.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 3. Enhanced Amplify Configuration in main.tsx

Added a more robust Amplify configuration in main.tsx with fallback mechanisms and proper error handling:

```typescript
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
```

### 4. Modified Vite Build Configuration

Updated vite.config.ts to ensure aws-exports.js is properly copied to the dist folder:

```typescript
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
```

### 5. Enhanced Deployment Script

Added verification steps to the deployment script to ensure aws-exports.js is present and properly formatted:

```bash
# Step 0: Ensure browser-compatible aws-exports.js is in public/ folder
echo "🔒 Ensuring browser-compatible aws-exports.js exists..."
if [ ! -f public/aws-exports.js ] || ! grep -q "window.awsmobile" public/aws-exports.js; then
  echo "Creating browser-compatible aws-exports.js..."
  # Create browser-compatible version here...
  echo "✅ Created browser-compatible aws-exports.js"
else
  echo "✅ Browser-compatible aws-exports.js already exists"
fi

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
```

### 6. Created fix-aws-exports-browser.sh Script

Developed a dedicated script to create the browser-compatible version of aws-exports.js and update related configuration:

```bash
#!/bin/bash
# fix-aws-exports-browser.sh
# Script to create a browser-compatible version of aws-exports.js for direct script tag use

echo "🔧 Creating browser-compatible aws-exports.js..."

# Create browser-compatible version for public/aws-exports.js
cat > public/aws-exports.js << 'EOL'
// aws-exports.js - Browser compatible version for <script> tag
// This version assigns directly to window.awsmobile instead of using module exports
window.awsmobile = {
  // Configuration details...
};

console.log('✅ AWS Cognito config loaded successfully!');
EOL

echo "✅ Created browser-compatible version in public/aws-exports.js"
```

## Verification Process

A comprehensive verification process was implemented through the `test-auth-flow.sh` script, which checks:

1. The format of aws-exports.js in both public/ and dist/ directories
2. The presence of authentication-related imports in the built files
3. The correct inclusion of User Pool and Identity Pool IDs in the built files
4. The proper loading order of aws-exports.js in index.html
5. The accessibility of aws-exports.js from the production URL

## Results

After implementing these fixes:

1. The "Auth UserPool not configured" error was resolved
2. The "Unexpected token 'export'" error was eliminated
3. window.awsmobile was properly set in the browser
4. Both User Pool and Identity Pool authentication flows were successfully functioning
5. The application could successfully authenticate users and access DynamoDB resources

## Key Lessons Learned

1. **Browser vs. Module Context**: ES module syntax (`export default`) should not be used in files loaded directly via script tags. For browser-direct files, use global assignments (`window.varName = value`).

2. **Script Loading Order**: Authentication configuration scripts must be loaded before any scripts that might use them, preferably in the head section.

3. **Dual Authentication Flows**: When using both User Pool and Identity Pool, both configurations must be explicitly included and properly structured.

4. **Build Process Verification**: The build process should be verified to ensure critical files are included and properly formatted in the output.

5. **Cross-Environment Compatibility**: Maintain distinct versions of configuration files for different contexts (module import vs. browser script tag).

## Ongoing Maintenance

To maintain proper authentication functionality:

1. Always use the browser-compatible version of aws-exports.js in the public/ directory
2. Keep the ES module version in src/ for imports within the application
3. Ensure the build process copies the browser-compatible version to the dist/ folder
4. Test both User Pool and Identity Pool authentication flows after any changes
5. Monitor authentication-related errors in production logs

## Implementation Scripts

The complete fix has been implemented through the following scripts:

1. `fix-aws-exports-browser.sh`: Creates browser-compatible aws-exports.js
2. `fix-auth-config.sh`: Ensures proper authentication configuration
3. `deploy-production.sh`: Deploys the application with proper verification
4. `test-auth-flow.sh`: Validates the authentication configuration

These scripts and configurations now serve as the canonical solution for managing authentication in the ACTA-UI application.
