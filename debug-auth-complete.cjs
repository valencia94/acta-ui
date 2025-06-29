#!/usr/bin/env node

/**
 * Advanced Authentication Debug Tool
 * Tests the complete authentication flow step by step
 */

const https = require('https');

const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

// Get credentials from environment
const TEST_USER = process.env.ACTA_UI_USER;
const TEST_PASS = process.env.ACTA_UI_PW;

async function debugAuthenticationFlow() {
  console.log('🔍 Advanced Authentication Debug...\n');
  
  if (!TEST_USER || !TEST_PASS) {
    console.log('❌ Missing test credentials');
    return false;
  }
  
  console.log(`👤 Test User: ${TEST_USER}`);
  
  try {
    // Step 1: Check Cognito configuration
    console.log('\n🔧 Step 1: Checking Cognito Configuration');
    console.log('========================================');
    
    const cognitoConfig = {
      userPoolId: 'us-east-2_FyHLtOhiY',
      clientId: '1hdn8b19ub2kmfkuse8rsjpv8e',
      region: 'us-east-2',
      domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com'
    };
    
    console.log('Cognito Configuration:');
    Object.entries(cognitoConfig).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    
    // Step 2: Test Cognito endpoints
    console.log('\n🔐 Step 2: Testing Cognito Endpoints');
    console.log('====================================');
    
    // Test Cognito well-known endpoint
    const wellKnownTest = await new Promise((resolve, reject) => {
      const req = https.get(`https://cognito-idp.us-east-2.amazonaws.com/us-east-2_FyHLtOhiY/.well-known/jwks.json`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          status: res.statusCode,
          valid: res.statusCode === 200 && data.includes('keys')
        }));
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Cognito timeout')));
    });
    
    console.log(`✅ Cognito JWKS: ${wellKnownTest.status} ${wellKnownTest.valid ? '(Valid)' : '(Invalid)'}`);
    
    // Step 3: Test API Gateway authentication
    console.log('\n🌐 Step 3: API Gateway Authentication Test');
    console.log('=========================================');
    
    // Test with empty auth header
    const emptyAuthTest = await testAPICall('/projects', null);
    console.log(`📊 No Auth Header: ${emptyAuthTest.status} - Expected 401/403`);
    
    // Test with invalid auth header
    const invalidAuthTest = await testAPICall('/projects', 'Bearer invalid-token');
    console.log(`📊 Invalid Token: ${invalidAuthTest.status} - Expected 401/403`);
    
    // Step 4: Test environment variables in frontend
    console.log('\n⚙️ Step 4: Frontend Environment Analysis');
    console.log('=======================================');
    
    const envTest = await new Promise((resolve, reject) => {
      const req = https.get(`${FRONTEND_URL}/assets/index-B5NTLSft.js`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const hasAPI = data.includes('q2b9avfwv5.execute-api');
          const hasSkipAuth = data.includes('skipAuth');
          const skipAuthValue = data.match(/skipAuth[:\s]*([^,}]+)/);
          const hasCognito = data.includes('us-east-2_FyHLtOhiY');
          const hasAmplify = data.includes('fetchAuthSession');
          
          resolve({
            hasAPI,
            hasSkipAuth,
            skipAuthValue: skipAuthValue ? skipAuthValue[1] : 'not found',
            hasCognito,
            hasAmplify,
            size: data.length
          });
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Frontend timeout')));
    });
    
    console.log('Frontend Analysis:');
    console.log(`  Bundle Size: ${envTest.size} bytes`);
    console.log(`  Has API URL: ${envTest.hasAPI ? '✅' : '❌'}`);
    console.log(`  Has Skip Auth: ${envTest.hasSkipAuth ? '✅' : '❌'}`);
    console.log(`  Skip Auth Value: ${envTest.skipAuthValue}`);
    console.log(`  Has Cognito Config: ${envTest.hasCognito ? '✅' : '❌'}`);
    console.log(`  Has Amplify Auth: ${envTest.hasAmplify ? '✅' : '❌'}`);
    
    // Step 5: Test CORS configuration
    console.log('\n🌐 Step 5: CORS Configuration Test');
    console.log('==================================');
    
    const corsTest = await testCORS();
    console.log(`CORS Origin: ${corsTest.origin || 'Not set'}`);
    console.log(`CORS Methods: ${corsTest.methods || 'Not set'}`);
    console.log(`CORS Headers: ${corsTest.headers || 'Not set'}`);
    console.log(`CORS Status: ${corsTest.status === 200 ? '✅ OK' : `❌ ${corsTest.status}`}`);
    
    // Step 6: Test authentication flow simulation
    console.log('\n🔐 Step 6: Authentication Flow Simulation');
    console.log('=========================================');
    
    console.log('This would require a real login flow...');
    console.log('Issues likely found:');
    
    const issues = [];
    const fixes = [];
    
    if (!envTest.hasAmplify) {
      issues.push('Amplify authentication not properly bundled');
      fixes.push('Rebuild frontend with proper Amplify configuration');
    }
    
    if (!envTest.hasCognito) {
      issues.push('Cognito configuration missing from bundle');
      fixes.push('Verify aws-exports.js is properly imported');
    }
    
    if (envTest.skipAuthValue !== '!1' && envTest.skipAuthValue !== 'false') {
      issues.push('Skip auth may be enabled');
      fixes.push('Verify VITE_SKIP_AUTH=false in environment');
    }
    
    if (corsTest.status !== 200) {
      issues.push('CORS configuration issues');
      fixes.push('Update API Gateway CORS settings');
    }
    
    if (!wellKnownTest.valid) {
      issues.push('Cognito configuration invalid');
      fixes.push('Verify Cognito User Pool and Client settings');
    }
    
    console.log('\n📋 AUTHENTICATION DIAGNOSIS:');
    console.log('============================');
    
    if (issues.length === 0) {
      console.log('✅ No obvious configuration issues found');
      console.log('💡 The issue may be in the user authentication session');
      console.log('🔧 Try: Clear browser cache/localStorage and re-login');
    } else {
      console.log('🔍 Issues Found:');
      issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
      console.log('\n🔧 Recommended Fixes:');
      fixes.forEach((fix, i) => console.log(`${i + 1}. ${fix}`));
    }
    
    return issues.length === 0;
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return false;
  }
}

async function testAPICall(endpoint, authHeader) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'q2b9avfwv5.execute-api.us-east-2.amazonaws.com',
      port: 443,
      path: `/prod${endpoint}`,
      method: 'GET',
      headers: {}
    };
    
    if (authHeader) {
      options.headers['Authorization'] = authHeader;
    }
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        status: res.statusCode,
        data: data.substring(0, 100)
      }));
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('API timeout')));
    req.end();
  });
}

async function testCORS() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'q2b9avfwv5.execute-api.us-east-2.amazonaws.com',
      port: 443,
      path: '/prod/health',
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization'
      }
    }, (res) => {
      resolve({
        status: res.statusCode,
        origin: res.headers['access-control-allow-origin'],
        methods: res.headers['access-control-allow-methods'],
        headers: res.headers['access-control-allow-headers']
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => reject(new Error('CORS timeout')));
    req.end();
  });
}

// Run the debug
if (require.main === module) {
  debugAuthenticationFlow()
    .then(success => {
      console.log(`\n${success ? '✅' : '❌'} Authentication Debug ${success ? 'COMPLETED' : 'FOUND ISSUES'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Debug failed:', error);
      process.exit(1);
    });
}

module.exports = { debugAuthenticationFlow };
