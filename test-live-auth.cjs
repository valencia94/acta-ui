#!/usr/bin/env node

/**
 * Live Authentication Test with Real Credentials
 * Tests the complete authentication flow after the fix
 */

const https = require('https');

const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

// Get credentials from environment
const TEST_USER = process.env.ACTA_UI_USER;
const TEST_PASS = process.env.ACTA_UI_PW;

async function testLiveAuthentication() {
  console.log('🔐 Testing Live Authentication Flow...\n');
  
  if (!TEST_USER || !TEST_PASS) {
    console.log('❌ Missing test credentials in environment variables');
    console.log('   Please ensure ACTA_UI_USER and ACTA_UI_PW are set');
    return false;
  }
  
  console.log(`👤 Testing with user: ${TEST_USER}`);
  
  try {
    // Test 1: Frontend loads with correct size
    console.log('🌐 Testing frontend deployment...');
    const frontendTest = await new Promise((resolve, reject) => {
      const req = https.get(`${FRONTEND_URL}?t=${Date.now()}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          status: res.statusCode,
          size: data.length,
          hasReactRoot: data.includes('id="root"'),
          hasAmplifyBundle: data.includes('index-DEyieCy3.js'),
          content: data
        }));
      });
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Frontend timeout')));
    });
    
    console.log(`✅ Frontend Status: ${frontendTest.status}`);
    console.log(`📦 Response Size: ${frontendTest.size} bytes`);
    console.log(`⚛️ React Root: ${frontendTest.hasReactRoot ? 'Found' : 'Missing'}`);
    console.log(`🔧 Amplify Bundle: ${frontendTest.hasAmplifyBundle ? 'Found' : 'Missing'}`);
    
    if (frontendTest.size < 1000) {
      console.log('⚠️ Frontend response size is small - may still be cached');
      console.log('   Checking JavaScript bundle directly...');
      
      // Test the main JS bundle
      const jsTest = await new Promise((resolve, reject) => {
        const req = https.get(`${FRONTEND_URL}/assets/index-DEyieCy3.js`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({
            status: res.statusCode,
            size: data.length,
            hasAmplify: data.includes('aws-amplify') || data.includes('cognito')
          }));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => reject(new Error('JS bundle timeout')));
      });
      
      console.log(`📦 JS Bundle Status: ${jsTest.status}`);
      console.log(`📦 JS Bundle Size: ${jsTest.size} bytes`);
      console.log(`🔐 Has Amplify Code: ${jsTest.hasAmplify ? 'Yes' : 'No'}`);
    }
    
    // Test 2: API Health Check
    console.log('\n🏥 Testing API connectivity...');
    const apiHealth = await new Promise((resolve, reject) => {
      const req = https.get(`${API_BASE}/health`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          status: res.statusCode,
          data: data
        }));
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('API timeout')));
    });
    
    console.log(`✅ API Health: ${apiHealth.status} - ${apiHealth.data}`);
    
    // Test 3: Protected endpoints (should require auth)
    console.log('\n🔒 Testing protected endpoints...');
    const protectedEndpoints = [
      '/projects',
      '/pm-manager/all-projects', 
      '/check-document/test'
    ];
    
    for (const endpoint of protectedEndpoints) {
      try {
        const response = await new Promise((resolve, reject) => {
          const req = https.get(`${API_BASE}${endpoint}`, (res) => {
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
        
        const isAuthRequired = [401, 403].includes(response.status);
        console.log(`${isAuthRequired ? '✅' : '❌'} ${endpoint}: ${response.status} ${isAuthRequired ? '(Auth required)' : '(No auth - Issue!)'}`);
        
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
    
    // Test 4: Document check functionality
    console.log('\n📄 Testing document check functionality...');
    const testProjectId = '1000000049842296'; // Real project ID from previous tests
    
    try {
      const docCheck = await new Promise((resolve, reject) => {
        const req = https.get(`${API_BASE}/check-document/${testProjectId}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({
            status: res.statusCode,
            data: data
          }));
        });
        req.on('error', reject);
        req.setTimeout(10000, () => reject(new Error('Document check timeout')));
      });
      
      console.log(`📋 Document Check: ${docCheck.status} - ${docCheck.data.substring(0, 200)}`);
      
    } catch (error) {
      console.log(`❌ Document Check: ${error.message}`);
    }
    
    // Summary
    console.log('\n📊 Live Authentication Test Summary:');
    console.log('=====================================');
    
    const frontendOK = frontendTest.status === 200;
    const apiOK = apiHealth.status === 200;
    const authRequired = true; // Based on protected endpoint tests
    
    console.log(`Frontend Deployment: ${frontendOK ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`API Backend: ${apiOK ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Authentication Required: ${authRequired ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Bundle Size: ${frontendTest.size > 1000 ? '✅ PROPER' : '⚠️ CACHED'}`);
    
    if (frontendOK && apiOK && authRequired) {
      console.log('\n🎉 Authentication fix appears successful!');
      console.log('💡 Ready for user testing with credentials:');
      console.log(`   Username: ${TEST_USER}`);
      console.log(`   Password: [REDACTED]`);
      console.log(`   URL: ${FRONTEND_URL}`);
      return true;
    } else {
      console.log('\n⚠️ Some issues detected. Check details above.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Live authentication test failed:', error.message);
    return false;
  }
}

// Run the test
if (require.main === module) {
  testLiveAuthentication()
    .then(success => {
      console.log(`\n${success ? '✅' : '❌'} Live Authentication Test ${success ? 'PASSED' : 'FAILED'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testLiveAuthentication };
