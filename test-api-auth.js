#!/usr/bin/env node

// Enhanced API Connectivity Test with Authentication
const API_BASE_URL = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

console.log('🔍 Testing API Connectivity with Authentication...');
console.log(`🌐 Target API: ${API_BASE_URL}`);
console.log('🔒 Authentication: AWS Cognito required for most endpoints');

async function testApiEndpoint(endpoint, description, requiresAuth = true) {
  console.log(`\n📡 Testing ${description}...`);
  console.log(`🔗 URL: ${endpoint}`);
  console.log(`🔐 Auth Required: ${requiresAuth ? 'YES' : 'NO'}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'ACTA-UI-Test/1.0',
      'Origin': 'https://d7t9x3j66yd8k.cloudfront.net'
    };
    
    // Add CORS headers for preflight
    if (requiresAuth) {
      headers['Access-Control-Request-Method'] = 'GET';
      headers['Access-Control-Request-Headers'] = 'Authorization,Content-Type';
    }
    
    const response = await fetch(endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers,
      credentials: 'include'
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    // Log relevant headers
    const relevantHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      if (key.startsWith('access-control-') || key.startsWith('x-amz') || 
          key === 'content-type' || key === 'content-length') {
        relevantHeaders[key] = value;
      }
    }
    console.log(`📋 Headers:`, relevantHeaders);
    
    // Handle different response types
    if (response.status === 403 && requiresAuth) {
      console.log(`🔐 Expected result: Authentication required (403)`);
      console.log(`✅ ${description} - AUTH REQUIRED (as expected)`);
      return 'auth_required';
    } else if (response.status === 502) {
      console.log(`⚠️ Backend error: Lambda function may have issues`);
      console.log(`❌ ${description} - BACKEND ERROR (502)`);
      return false;
    } else if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`📄 Response:`, JSON.stringify(data, null, 2));
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
      console.log(`⏰ ${description} - TIMEOUT`);
    } else {
      console.log(`❌ ${description} - ERROR: ${error.message}`);
    }
    return false;
  }
}

async function testCORSConfiguration() {
  console.log('\n🌐 Testing CORS Configuration...');
  
  const testOrigins = [
    'https://d7t9x3j66yd8k.cloudfront.net',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  for (const origin of testOrigins) {
    try {
      console.log(`\n🌍 Testing CORS for origin: ${origin}`);
      
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
      for (const [key, value] of response.headers.entries()) {
        if (key.startsWith('access-control-')) {
          corsHeaders[key] = value;
        }
      }
      
      console.log(`🔓 CORS Headers:`, corsHeaders);
      
      if (Object.keys(corsHeaders).length > 0) {
        console.log(`✅ CORS configured for ${origin}`);
      } else {
        console.log(`⚠️ Limited CORS support for ${origin}`);
      }
      
    } catch (error) {
      console.log(`❌ CORS test failed for ${origin}:`, error.message);
    }
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting Enhanced API Diagnostics...\n');
  
  // Test basic connectivity
  const healthResult = await testApiEndpoint(`${API_BASE_URL}/health`, 'Health Check', false);
  
  if (!healthResult) {
    console.log('\n🚨 Basic connectivity failed. Check network and API URL.');
    return;
  }
  
  console.log('\n✅ Basic connectivity working. Testing authenticated endpoints...');
  
  const tests = [
    [`${API_BASE_URL}/projects`, 'Projects List', true],
    [`${API_BASE_URL}/project-summary/test`, 'Project Summary (test)', true],
    [`${API_BASE_URL}/timeline/test`, 'Timeline (test)', true], 
    [`${API_BASE_URL}/generate-acta/test`, 'Generate ACTA (test)', true],
    [`${API_BASE_URL}/download-acta/test?format=pdf`, 'Download ACTA PDF (test)', true],
    [`${API_BASE_URL}/download-acta/test?format=docx`, 'Download ACTA DOCX (test)', true]
  ];
  
  let working = 0;
  let authRequired = 0;
  let failed = 0;
  
  for (const [url, description, needsAuth] of tests) {
    const result = await testApiEndpoint(url, description, needsAuth);
    
    if (result === true) working++;
    else if (result === 'auth_required') authRequired++;
    else failed++;
    
    // Brief pause between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Test CORS
  await testCORSConfiguration();
  
  // Summary
  console.log('\n📊 Diagnostic Results Summary:');
  console.log(`🌐 Basic Connectivity: ${healthResult ? '✅ Working' : '❌ Failed'}`);
  console.log(`✅ Working Endpoints: ${working}`);
  console.log(`🔐 Auth Required Endpoints: ${authRequired}`);
  console.log(`❌ Failed Endpoints: ${failed}`);
  
  console.log('\n🔍 Analysis:');
  if (authRequired > 0) {
    console.log('🔐 Most endpoints require AWS Cognito authentication');
    console.log('💡 To test authenticated endpoints, you need to:');
    console.log('   1. Sign in through the UI first');
    console.log('   2. Get the JWT token from browser localStorage');
    console.log('   3. Include Authorization header in API calls');
  }
  
  if (failed > 0) {
    console.log('⚠️ Some endpoints returned 502 errors - Backend Lambda issues possible');
    console.log('🔧 Check CloudWatch logs for Lambda function errors');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Deploy/start your frontend application');
  console.log('2. Sign in with valid credentials');
  console.log('3. Test API calls from the authenticated application');
  console.log('4. Check CloudWatch logs if 502 errors persist');
}

runDiagnostics().catch(console.error);
