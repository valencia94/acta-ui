#!/usr/bin/env node

/**
 * ACTA-UI Authentication Configuration Fixer
 * 
 * This script fixes the authentication configuration by:
 * 1. Setting up the correct OAuth domain format
 * 2. Configuring proper redirect URLs
 * 3. Testing the authentication endpoints
 */

const fs = require('fs');
const https = require('https');

// Configuration
const COGNITO_USER_POOL_ID = 'us-east-2_FyHLtOhiY';
const COGNITO_CLIENT_ID = 'dshos5iou44tuach7ta3ici5m';
const COGNITO_REGION = 'us-east-2';
const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';

// Test if a URL is accessible
function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => {
      resolve({ accessible: true, status: res.statusCode });
    });
    req.on('error', () => {
      resolve({ accessible: false, error: 'Connection failed' });
    });
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ accessible: false, error: 'Timeout' });
    });
    req.end();
  });
}

async function fixAuthConfiguration() {
  console.log('🔐 ACTA-UI Authentication Configuration Fixer');
  console.log('==============================================\n');

  // Test different domain formats
  const domainOptions = [
    `us-east-2fyhltohiy.auth.${COGNITO_REGION}.amazoncognito.com`,
    `${COGNITO_REGION.toLowerCase()}-${COGNITO_USER_POOL_ID.toLowerCase()}.auth.${COGNITO_REGION}.amazoncognito.com`,
    `${COGNITO_USER_POOL_ID.toLowerCase()}.auth.${COGNITO_REGION}.amazoncognito.com`
  ];

  console.log('📋 Testing OAuth domain formats...');
  let workingDomain = null;

  for (const domain of domainOptions) {
    const testUrl = `https://${domain}/.well-known/openid_configuration`;
    console.log(`   Testing: ${domain}`);
    
    const result = await testUrl(testUrl);
    if (result.accessible && result.status === 200) {
      console.log(`   ✅ Working: ${domain}`);
      workingDomain = domain;
      break;
    } else {
      console.log(`   ❌ Failed: ${domain} (${result.error || result.status})`);
    }
  }

  // If no domain works, use the default format without OAuth
  if (!workingDomain) {
    console.log('\n⚠️  No working OAuth domain found. Using configuration without custom domain.');
    console.log('   This will use the default Cognito hosted UI.\n');
  }

  // Generate the new aws-exports.js configuration
  const awsExportsConfig = {
    aws_project_region: COGNITO_REGION,
    aws_user_pools_id: COGNITO_USER_POOL_ID,
    aws_user_pools_web_client_id: COGNITO_CLIENT_ID,
  };

  // Add OAuth configuration if we have a working domain
  if (workingDomain) {
    awsExportsConfig.oauth = {
      domain: workingDomain,
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: `${FRONTEND_URL}/`,
      redirectSignOut: `${FRONTEND_URL}/login`,
      responseType: 'code'
    };
  }

  // Write the new configuration
  const awsExportsContent = `// src/aws-exports.js
const awsmobile = ${JSON.stringify(awsExportsConfig, null, 2)};

export default awsmobile;
`;

  try {
    fs.writeFileSync('./src/aws-exports.js', awsExportsContent);
    console.log('✅ Updated src/aws-exports.js');
  } catch (error) {
    console.log('❌ Failed to update aws-exports.js:', error.message);
    return;
  }

  // Update .env file if needed
  try {
    let envContent = fs.readFileSync('./.env', 'utf8');
    
    // Update or add the necessary environment variables
    const envUpdates = {
      'VITE_COGNITO_REGION': COGNITO_REGION,
      'VITE_COGNITO_POOL_ID': COGNITO_USER_POOL_ID,
      'VITE_COGNITO_WEB_CLIENT': COGNITO_CLIENT_ID,
      'VITE_SKIP_AUTH': 'false'
    };

    Object.entries(envUpdates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    });

    fs.writeFileSync('./.env', envContent);
    console.log('✅ Updated .env file');
  } catch (error) {
    console.log('⚠️  Could not update .env file:', error.message);
  }

  // Generate summary
  console.log('\n🎯 Configuration Summary');
  console.log('========================');
  console.log(`User Pool ID: ${COGNITO_USER_POOL_ID}`);
  console.log(`Client ID: ${COGNITO_CLIENT_ID}`);
  console.log(`Region: ${COGNITO_REGION}`);
  
  if (workingDomain) {
    console.log(`OAuth Domain: ${workingDomain}`);
    console.log(`Login URL: https://${workingDomain}/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=email+openid+profile&redirect_uri=${encodeURIComponent(FRONTEND_URL + '/')}`);
  } else {
    console.log('OAuth Domain: Not configured (using default Cognito hosted UI)');
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Test the authentication flow in your application');
  console.log('2. If login still fails, check the Cognito User Pool configuration in AWS Console');
  console.log('3. Verify that the client ID has the correct redirect URLs configured');
  
  if (!workingDomain) {
    console.log('4. Consider setting up a custom domain in the AWS Cognito console');
  }
}

// Run the configuration fixer
if (require.main === module) {
  fixAuthConfiguration().catch(console.error);
}

module.exports = { fixAuthConfiguration };
