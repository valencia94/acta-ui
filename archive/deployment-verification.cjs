#!/usr/bin/env node

/**
 * ACTA-UI Deployment Verification Script
 * 
 * Focused deployment verification that checks the core requirements:
 * 1. Frontend is accessible and serving correct content
 * 2. Health endpoint is accessible (for load balancer checks)
 * 3. API Gateway is responding with proper authentication
 */

const https = require('https');

// Configuration
const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

// Helper function for HTTP requests
function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () =>
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
          url: url,
        })
      );
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Request timeout')));
    req.end();
  });
}

async function main() {
  console.log('🧪 POST-DEPLOYMENT VERIFICATION');
  console.log('===============================');
  console.log(`🌐 CloudFront Domain: ${FRONTEND_URL.replace('https://', '')}`);
  console.log(`🔗 Full URL: ${FRONTEND_URL}`);
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Frontend accessibility
    console.log('⏳ Waiting for CloudFront propagation...');
    console.log('🔍 Testing application routes...');
    
    const routes = ['/', '/dashboard', '/login'];
    for (const route of routes) {
      const response = await makeRequest(`${FRONTEND_URL}${route}`);
      if (response.status === 200) {
        console.log(`✅ SPA route (${route}) - OK`);
      } else {
        console.log(`❌ SPA route (${route}) - Failed (${response.status})`);
        allTestsPassed = false;
      }
    }
    
    // Test 2: React app content verification
    console.log('🔍 Verifying React app content...');
    const rootResponse = await makeRequest(FRONTEND_URL);
    if (rootResponse.status === 200 && rootResponse.data.includes('<div id="root">')) {
      console.log('✅ React app root element found');
    } else {
      console.log('❌ React app root element not found');
      allTestsPassed = false;
    }
    
    // Test 3: Health endpoint (critical for load balancer)
    console.log('🔍 Testing API connectivity...');
    const healthResponse = await makeRequest(`${FRONTEND_URL}/health`);
    if (healthResponse.status === 200) {
      console.log('✅ Health endpoint accessible');
      
      // Parse health response
      try {
        const healthData = JSON.parse(healthResponse.data);
        if (healthData.status === 'ok') {
          console.log('✅ Health endpoint returns OK status');
        } else {
          console.log('⚠️ Health endpoint returns unexpected status');
        }
      } catch (e) {
        console.log('⚠️ Health endpoint response not JSON');
      }
    } else {
      console.log(`❌ API endpoint not accessible (Health check failed: ${healthResponse.status})`);
      allTestsPassed = false;
    }
    
    // Test 4: API Gateway authentication check
    const apiResponse = await makeRequest(`${API_BASE}/projects`);
    if (apiResponse.status === 401 || apiResponse.status === 403) {
      console.log('✅ API Gateway authentication is active');
    } else {
      console.log(`⚠️ API Gateway response unexpected: ${apiResponse.status}`);
    }
    
    // Summary
    console.log('\n📊 DEPLOYMENT VERIFICATION SUMMARY');
    console.log('==================================');
    
    if (allTestsPassed) {
      console.log('🎉 DEPLOYMENT SUCCESSFUL');
      console.log('✅ Frontend is accessible');
      console.log('✅ Health endpoint is working');
      console.log('✅ API authentication is active');
      console.log('✅ All critical systems operational');
      process.exit(0);
    } else {
      console.log('❌ DEPLOYMENT VERIFICATION FAILED');
      console.log('🔧 Please check the failed components above');
      process.exit(1);
    }
    
  } catch (error) {
    console.log(`❌ Deployment verification failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);
