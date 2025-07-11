#!/usr/bin/env node

// Test to verify if the issue is related to the frontend fetch configuration
// We'll test with the exact same configuration as the frontend

const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
const TEST_PROJECT_ID = '1000000055914011';

async function testFrontendFetchConfiguration() {
  console.log('🧪 Testing frontend fetch configuration...');
  console.log(`🌐 URL: ${API_BASE}/extract-project-place/${TEST_PROJECT_ID}`);
  console.log('');

  // Test 1: Exact same configuration as frontend
  console.log('1️⃣ Testing exact frontend configuration...');
  
  const headers = new Headers();
  headers.set('Authorization', 'Bearer dummy-token-test');
  headers.set('Content-Type', 'application/json');
  
  const init = {
    method: 'POST',
    headers: headers,
    credentials: 'include'
  };
  
  console.log('📋 Request configuration:');
  console.log('  Method:', init.method);
  console.log('  Headers:', Object.fromEntries(headers.entries()));
  console.log('  Credentials:', init.credentials);
  console.log('');
  
  try {
    const response = await fetch(`${API_BASE}/extract-project-place/${TEST_PROJECT_ID}`, init);
    
    console.log(`✅ Fetch successful! Status: ${response.status} ${response.statusText}`);
    console.log('📋 Response headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    if (response.status === 401) {
      console.log('✅ Expected 401 - Authentication token is invalid (expected)');
    } else {
      console.log('⚠️ Unexpected status code');
    }
    
  } catch (error) {
    console.error('❌ Fetch failed with error:', error.message);
    console.error('❌ Error type:', error.name);
    console.error('❌ Full error:', error);
    
    // Check if it's a network error
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.log('');
      console.log('🔍 ANALYSIS: This is a "Failed to fetch" error.');
      console.log('This typically means:');
      console.log('  1. Network connectivity issue');
      console.log('  2. CORS preflight failure');
      console.log('  3. SSL/TLS certificate issue');
      console.log('  4. DNS resolution failure');
      console.log('  5. Request timeout');
      console.log('');
      
      // Test basic connectivity
      console.log('2️⃣ Testing basic connectivity...');
      try {
        const basicResponse = await fetch(`${API_BASE}/health`);
        console.log(`✅ Basic connectivity OK: ${basicResponse.status} ${basicResponse.statusText}`);
      } catch (basicError) {
        console.error('❌ Basic connectivity failed:', basicError.message);
      }
    }
  }
  
  console.log('');
  console.log('3️⃣ Testing without credentials...');
  try {
    const response = await fetch(`${API_BASE}/extract-project-place/${TEST_PROJECT_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dummy-token-test',
        'Content-Type': 'application/json'
      }
      // No credentials: 'include'
    });
    
    console.log(`✅ Fetch without credentials successful! Status: ${response.status} ${response.statusText}`);
    
  } catch (error) {
    console.error('❌ Fetch without credentials failed:', error.message);
  }
  
  console.log('');
  console.log('4️⃣ Testing with Origin header...');
  try {
    const response = await fetch(`${API_BASE}/extract-project-place/${TEST_PROJECT_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer dummy-token-test',
        'Content-Type': 'application/json',
        'Origin': 'https://d7t9x3j66yd8k.cloudfront.net'
      },
      credentials: 'include'
    });
    
    console.log(`✅ Fetch with Origin header successful! Status: ${response.status} ${response.statusText}`);
    
  } catch (error) {
    console.error('❌ Fetch with Origin header failed:', error.message);
  }
}

// Run the test
testFrontendFetchConfiguration().catch(console.error);
