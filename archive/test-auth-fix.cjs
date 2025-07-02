#!/usr/bin/env node

/**
 * Quick Authentication Fix Verification
 * Tests if the corrected environment variables are now working
 */

const https = require('https');

const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

async function testAuthFix() {
  console.log('🔧 Testing Authentication Fix...\n');

  try {
    // Test if frontend loads
    console.log('🌐 Testing frontend accessibility...');
    const frontendTest = await new Promise((resolve, reject) => {
      const req = https.get(FRONTEND_URL, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            size: data.length,
            hasAmplify: data.includes('aws-amplify'),
            hasCognito: data.includes('cognito'),
            hasViteConfig: data.includes('VITE_'),
          })
        );
      });
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Frontend timeout')));
    });

    console.log(`✅ Frontend Status: ${frontendTest.status}`);
    console.log(`📦 Response Size: ${frontendTest.size} bytes`);
    console.log(`🔐 Has Amplify: ${frontendTest.hasAmplify ? 'Yes' : 'No'}`);
    console.log(`🆔 Has Cognito: ${frontendTest.hasCognito ? 'Yes' : 'No'}`);
    console.log(
      `⚙️ Has Vite Config: ${frontendTest.hasViteConfig ? 'Yes' : 'No'}`
    );

    // Test API health
    console.log('\n🏥 Testing API health...');
    const apiHealth = await new Promise((resolve, reject) => {
      const req = https.get(`${API_BASE}/health`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            data: data,
          })
        );
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('API timeout')));
    });

    console.log(`✅ API Health: ${apiHealth.status} - ${apiHealth.data}`);

    // Test protected endpoint (should return 401/403)
    console.log('\n🔒 Testing protected endpoint...');
    const protectedTest = await new Promise((resolve, reject) => {
      const req = https.get(`${API_BASE}/projects`, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            data: data.substring(0, 200),
          })
        );
      });
      req.on('error', reject);
      req.setTimeout(5000, () =>
        reject(new Error('Protected endpoint timeout'))
      );
    });

    const isAuthRequired = [401, 403].includes(protectedTest.status);
    console.log(
      `${isAuthRequired ? '✅' : '❌'} Protected Endpoint: ${protectedTest.status} ${isAuthRequired ? '(Auth required - Good!)' : '(No auth required - Issue!)'}`
    );

    // Summary
    console.log('\n📊 Authentication Fix Summary:');
    console.log(
      `Frontend Deployment: ${frontendTest.status === 200 ? '✅ SUCCESS' : '❌ FAILED'}`
    );
    console.log(
      `API Connectivity: ${apiHealth.status === 200 ? '✅ SUCCESS' : '❌ FAILED'}`
    );
    console.log(
      `Authentication Required: ${isAuthRequired ? '✅ SUCCESS' : '❌ FAILED'}`
    );
    console.log(
      `Amplify Integration: ${frontendTest.hasAmplify ? '✅ SUCCESS' : '❌ FAILED'}`
    );

    if (
      frontendTest.status === 200 &&
      apiHealth.status === 200 &&
      isAuthRequired &&
      frontendTest.hasAmplify
    ) {
      console.log('\n🎉 Authentication fix appears successful!');
      console.log('💡 Next step: Test with real user credentials in browser');
      return true;
    } else {
      console.log('\n⚠️ Some issues still present. Check above details.');
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication fix test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testAuthFix()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAuthFix };
