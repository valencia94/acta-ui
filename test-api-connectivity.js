#!/usr/bin/env node

// API Connectivity Test Script - CORRECTED VERSION
const API_BASE_URL = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

console.log('🔍 Testing API Connectivity (Corrected)...');
console.log(`🌐 Target API: ${API_BASE_URL}`);
console.log('🔧 Fixed: Authentication headers, endpoint paths, and error handling');

async function testApiEndpoint(endpoint, description, options = {}) {
  console.log(`\n📡 Testing ${description}...`);
  console.log(`🔗 URL: ${endpoint}`);
  
  const { 
    expectAuth = false, 
    method = 'GET', 
    body = null,
    customHeaders = {} 
  } = options;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'ACTA-UI-Test/1.0',
      'Origin': 'https://d7t9x3j66yd8k.cloudfront.net',
      ...customHeaders
    };
    
    // Add Content-Type for POST requests
    if (method === 'POST') {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(endpoint, {
      method,
      signal: controller.signal,
      headers,
      body: body ? JSON.stringify(body) : null,
      credentials: 'include' // Include cookies for session auth
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    // Show relevant headers
    const relevantHeaders = {};
    response.headers.forEach((value, key) => {
      if (key.startsWith('access-control-') || key.startsWith('x-amz') || 
          key === 'content-type' || key === 'content-length' || key === 'location') {
        relevantHeaders[key] = value;
      }
    });
    console.log(`📋 Headers:`, relevantHeaders);
    
    // Handle different response scenarios
    if (response.status === 403 && expectAuth) {
      console.log(`🔐 Expected: Authentication required (403 is normal)`);
      console.log(`✅ ${description} - AUTH PROTECTION WORKING`);
      return 'auth_required';
    } else if (response.status === 502) {
      console.log(`⚠️ Backend Lambda error (502) - Check CloudWatch logs`);
      console.log(`❌ ${description} - BACKEND ERROR`);
      return false;
    } else if (response.status === 404) {
      console.log(`❓ Endpoint not found (404) - Check API Gateway routes`);
      console.log(`❌ ${description} - NOT FOUND`);
      return false;
    } else if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json();
          console.log(`📄 Response:`, JSON.stringify(data, null, 2));
        } catch (e) {
          console.log(`📄 Response: (invalid JSON)`);
        }
      } else {
        const text = await response.text();
        console.log(`📄 Response (text):`, text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      }
      console.log(`✅ ${description} - SUCCESS`);
      return true;
    } else {
      console.log(`❌ ${description} - FAILED (${response.status})`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`⏰ ${description} - TIMEOUT (15s)`);
    } else {
      console.log(`❌ ${description} - ERROR: ${error.message}`);
    }
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Corrected API Connectivity Tests...\n');
  
  // Test health endpoint first
  const healthResult = await testApiEndpoint(`${API_BASE_URL}/health`, 'Health Check', { expectAuth: false });
  
  if (!healthResult) {
    console.log('\n🚨 Basic connectivity failed. Cannot proceed with other tests.');
    return;
  }
  
  console.log('\n✅ Basic connectivity confirmed. Testing other endpoints...');
  
  // Test all endpoints with proper configurations
  const tests = [
    // Public endpoints
    [`${API_BASE_URL}/health`, 'Health Check (verify)', { expectAuth: false }],
    
    // Protected endpoints (expect 403)
    [`${API_BASE_URL}/projects`, 'Projects List', { expectAuth: true }],
    [`${API_BASE_URL}/generate-acta/test`, 'Generate ACTA (test)', { expectAuth: true, method: 'POST', body: {} }],
    
    // Backend endpoints (may have Lambda issues)
    [`${API_BASE_URL}/project-summary/test`, 'Project Summary (test)', { expectAuth: true }],
    [`${API_BASE_URL}/timeline/test`, 'Timeline (test)', { expectAuth: true }],
    
    // Download endpoints (check correct paths)
    [`${API_BASE_URL}/download-acta/test?format=pdf`, 'Download ACTA PDF (test)', { expectAuth: true }],
    [`${API_BASE_URL}/download-acta/test?format=docx`, 'Download ACTA DOCX (test)', { expectAuth: true }],
    
    // Alternative endpoint patterns (in case API uses different paths)
    [`${API_BASE_URL}/extract-project-place/test`, 'Extract Project Data (test)', { expectAuth: true, method: 'POST', body: {} }],
    [`${API_BASE_URL}/check-document/test?format=pdf`, 'Check Document Status (test)', { expectAuth: true, method: 'HEAD' }]
  ];
  
  let working = 0;
  let authProtected = 0;
  let failed = 0;
  let total = tests.length;
  
  for (const [url, description, options] of tests) {
    const result = await testApiEndpoint(url, description, options);
    
    if (result === true) working++;
    else if (result === 'auth_required') authProtected++;
    else failed++;
    
    // Brief pause between requests
    await new Promise(resolve => setTimeout(resolve, 750));
  }
  
  console.log('\n📊 Corrected Test Results Summary:');
  console.log(`✅ Working Endpoints: ${working}`);
  console.log(`🔐 Auth-Protected Endpoints: ${authProtected}`);
  console.log(`❌ Failed Endpoints: ${failed}`);
  console.log(`📝 Total Tested: ${total}`);
  
  // Calculate health score
  const healthScore = Math.round(((working + authProtected) / total) * 100);
  console.log(`� API Health Score: ${healthScore}%`);
  
  if (working > 0 && authProtected > 0) {
    console.log('\n🎉 Good news: API infrastructure is working correctly!');
    console.log('� Authentication is properly protecting endpoints');
    if (failed > 0) {
      console.log('⚠️ Some backend Lambda functions need attention (502 errors)');
    }
  } else if (working === 1 && authProtected === 0) {
    console.log('\n⚠️ Only health endpoint working - authentication may be misconfigured');
  } else {
    console.log('\n🚨 Multiple issues detected - check API Gateway and Lambda configurations');
  }
  
  await testCORSAndConnectivity();
}

async function testCORSAndConnectivity() {
  console.log('\n🌐 Testing CORS and Advanced Connectivity...');
  
  const testOrigins = [
    'https://d7t9x3j66yd8k.cloudfront.net', // Production
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000'  // Alternative dev server
  ];
  
  for (const origin of testOrigins) {
    try {
      console.log(`\n🌍 Testing CORS for: ${origin}`);
      
      const response = await fetch(API_BASE_URL, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization,Content-Type'
        }
      });
      
      console.log(`📊 CORS Status: ${response.status}`);
      
      const corsHeaders = {};
      response.headers.forEach((value, key) => {
        if (key.startsWith('access-control-')) {
          corsHeaders[key] = value;
        }
      });
      
      if (Object.keys(corsHeaders).length > 0) {
        console.log(`🔓 CORS Headers:`, corsHeaders);
        console.log(`✅ CORS configured for ${origin}`);
      } else {
        console.log(`⚠️ No CORS headers found for ${origin}`);
      }
      
    } catch (error) {
      console.log(`❌ CORS test failed for ${origin}:`, error.message);
    }
  }
  
  // Test API Gateway base endpoint
  console.log('\n🔍 Testing API Gateway Base Endpoint...');
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ACTA-UI-Test/1.0'
      }
    });
    
    console.log(`📊 Base API Status: ${response.status}`);
    
    if (response.status === 403) {
      console.log('🔐 Base endpoint properly secured (403 expected)');
    } else if (response.ok) {
      const data = await response.text();
      console.log('📄 Base endpoint response:', data.substring(0, 100));
    }
    
  } catch (error) {
    console.log('❌ Base endpoint test failed:', error.message);
  }
  
  console.log('\n🎯 Recommendations:');
  console.log('1. 🔐 For 403 errors: Set up authentication in your app first');
  console.log('2. 🔧 For 502 errors: Check CloudWatch logs for Lambda functions');
  console.log('3. 🌐 For CORS issues: Verify API Gateway CORS configuration');
  console.log('4. 📱 Test with authenticated requests from your React app');
}

runTests().catch(console.error);
