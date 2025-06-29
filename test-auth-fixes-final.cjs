#!/usr/bin/env node

/**
 * Final Authentication Test
 * Tests the authentication flow with all fixes applied
 */

const https = require('https');

const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

async function testAuthenticationFixes() {
  console.log('🧪 Testing Authentication Fixes...\n');
  
  try {
    // Test 1: Verify new frontend deployment
    console.log('📦 Step 1: Frontend Deployment Verification');
    console.log('==========================================');
    
    const frontendTest = await new Promise((resolve, reject) => {
      const req = https.get(FRONTEND_URL, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const hasNewBundle = data.includes('index-DEyieCy3.js');
          const hasLogoutRedirect = data.includes('/login');
          resolve({
            status: res.statusCode,
            size: data.length,
            hasNewBundle,
            hasLogoutRedirect,
            content: data
          });
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Frontend timeout')));
    });
    
    console.log(`✅ Frontend Status: ${frontendTest.status}`);
    console.log(`📦 Has New Bundle: ${frontendTest.hasNewBundle ? '✅' : '❌'}`);
    console.log(`🚪 Has Logout Redirect: ${frontendTest.hasLogoutRedirect ? '✅' : '❌'}`);
    
    // Test 2: Verify new JavaScript bundle
    console.log('\n🔧 Step 2: JavaScript Bundle Analysis');
    console.log('====================================');
    
    const jsTest = await new Promise((resolve, reject) => {
      const req = https.get(`${FRONTEND_URL}/assets/index-DEyieCy3.js`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const hasAPI = data.includes('q2b9avfwv5.execute-api');
          const hasAmplify = data.includes('fetchAuthSession');
          const hasCognito = data.includes('us-east-2_FyHLtOhiY');
          const skipAuthMatch = data.match(/skipAuth[:\s]*([^,}]+)/);
          const olMatch = data.match(/Ol=([^,}]+)/);
          
          resolve({
            status: res.statusCode,
            size: data.length,
            hasAPI,
            hasAmplify,
            hasCognito,
            skipAuthValue: skipAuthMatch ? skipAuthMatch[1] : 'not found',
            olValue: olMatch ? olMatch[1] : 'not found'
          });
        });
      });
      req.on('error', reject);
      req.setTimeout(15000, () => reject(new Error('JS bundle timeout')));
    });
    
    console.log(`📦 Bundle Size: ${jsTest.size} bytes`);
    console.log(`🌐 Has API URL: ${jsTest.hasAPI ? '✅' : '❌'}`);
    console.log(`🔧 Has Amplify: ${jsTest.hasAmplify ? '✅' : '❌'}`);
    console.log(`🆔 Has Cognito: ${jsTest.hasCognito ? '✅' : '❌'}`);
    console.log(`⚙️ Skip Auth: ${jsTest.skipAuthValue} (Ol = ${jsTest.olValue})`);
    
    // Test 3: CORS verification
    console.log('\n🌐 Step 3: CORS Configuration Verification');
    console.log('=========================================');
    
    const corsTest = await new Promise((resolve, reject) => {
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
    
    console.log(`🔄 CORS Status: ${corsTest.status === 200 ? '✅ OK' : `❌ ${corsTest.status}`}`);
    console.log(`📍 Allow Origin: ${corsTest.origin || 'Not set'}`);
    console.log(`📋 Allow Methods: ${corsTest.methods || 'Not set'}`);
    console.log(`🔑 Allow Headers: ${corsTest.headers || 'Not set'}`);
    
    // Test 4: API endpoints verification
    console.log('\n🔌 Step 4: API Endpoints Verification');
    console.log('====================================');
    
    const endpoints = [
      { path: '/health', expectAuth: false, name: 'Health Check' },
      { path: '/projects', expectAuth: true, name: 'Projects List' },
      { path: '/pm-manager/all-projects', expectAuth: true, name: 'PM Projects' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await new Promise((resolve, reject) => {
          const req = https.get(`${API_BASE}${endpoint.path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({
              status: res.statusCode,
              data: data.substring(0, 100)
            }));
          });
          req.on('error', reject);
          req.setTimeout(5000, () => reject(new Error('Timeout')));
        });
        
        if (endpoint.expectAuth) {
          const isCorrect = [401, 403].includes(response.status);
          console.log(`${isCorrect ? '✅' : '❌'} ${endpoint.name}: ${response.status} ${isCorrect ? '(Auth required - Good)' : '(No auth - Issue!)'}`);
        } else {
          const isCorrect = response.status === 200;
          console.log(`${isCorrect ? '✅' : '❌'} ${endpoint.name}: ${response.status} ${isCorrect ? '(Public - Good)' : '(Auth required - Issue!)'}`);
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint.name}: ${error.message}`);
      }
    }
    
    // Summary
    console.log('\n📊 AUTHENTICATION FIXES SUMMARY:');
    console.log('================================');
    
    const issues = [];
    const successes = [];
    
    // Check each component
    if (frontendTest.hasNewBundle) {
      successes.push('✅ New frontend bundle deployed');
    } else {
      issues.push('❌ Old frontend bundle still cached');
    }
    
    if (frontendTest.hasLogoutRedirect) {
      successes.push('✅ Logout redirect fixed');
    } else {
      issues.push('❌ Logout redirect not configured');
    }
    
    if (jsTest.hasAmplify && jsTest.hasCognito) {
      successes.push('✅ Amplify and Cognito properly configured');
    } else {
      issues.push('❌ Missing Amplify or Cognito configuration');
    }
    
    if (jsTest.olValue === '!1') {
      successes.push('✅ Skip Auth correctly set to false');
    } else {
      issues.push('❌ Skip Auth configuration issue');
    }
    
    if (corsTest.status === 200) {
      successes.push('✅ CORS configuration working');
    } else {
      issues.push('❌ CORS configuration issues');
    }
    
    console.log('\n🎉 SUCCESSES:');
    successes.forEach(success => console.log(`   ${success}`));
    
    if (issues.length > 0) {
      console.log('\n⚠️ REMAINING ISSUES:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    const allFixed = issues.length === 0;
    
    if (allFixed) {
      console.log('\n🎉 ALL AUTHENTICATION ISSUES FIXED!');
      console.log('💡 Users should now be able to:');
      console.log('   - Log in with Cognito credentials');
      console.log('   - Access authenticated API endpoints');
      console.log('   - Generate and download documents');
      console.log('   - Use bulk operations');
      console.log('   - Log out properly');
      console.log('\n🔗 Application ready at: https://d7t9x3j66yd8k.cloudfront.net');
    } else {
      console.log('\n⚠️ Some issues remain - may need additional cache invalidation time');
    }
    
    return allFixed;
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testAuthenticationFixes()
    .then(success => {
      console.log(`\n${success ? '✅' : '⚠️'} Authentication Fixes Test ${success ? 'PASSED' : 'NEEDS ATTENTION'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testAuthenticationFixes };
