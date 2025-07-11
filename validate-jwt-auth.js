// validate-jwt-auth.js
// Script to validate JWT token authentication with the API

import fetch from 'node-fetch';

// Test user credentials
const TEST_USER = {
  username: 'christian.valencia@ikusi.com',
  password: 'PdYb7TU7HvBhYP7$!'
};

// API endpoints
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
const HEALTH_ENDPOINT = `${API_BASE}/health`;
const EXTRACT_ENDPOINT = `${API_BASE}/extract-project-place/1000000049842296`;
const DOWNLOAD_ENDPOINT = `${API_BASE}/download-acta/1000000049842296?format=pdf`;

// Token storage
let token = null;

// Test different authorization header formats
async function testAuthorizationFormats() {
  if (!token) {
    console.error('❌ No token available. Please login first.');
    return;
  }

  console.log('🧪 Testing different authorization header formats...');

  // Test formats
  const formats = [
    { name: 'No prefix', header: token },
    { name: 'Bearer prefix', header: `Bearer ${token}` },
    { name: 'bearer lowercase', header: `bearer ${token}` },
    { name: 'JWT prefix', header: `JWT ${token}` }
  ];

  for (const format of formats) {
    console.log(`\n🧪 Testing format: ${format.name}`);
    
    try {
      const response = await fetch(EXTRACT_ENDPOINT, {
        headers: {
          'Authorization': format.header,
          'Content-Type': 'application/json',
          'Origin': 'https://d7t9x3j66yd8k.cloudfront.net'
        }
      });

      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      // Log response headers
      console.log('📡 Response headers:');
      for (const [key, value] of response.headers.entries()) {
        console.log(`   ${key}: ${value}`);
      }

      if (response.ok) {
        console.log('✅ Authorization successful with format:', format.name);
        console.log('🎉 This is the correct authorization format');
        
        // Try to parse response
        try {
          const data = await response.json();
          console.log('📄 Response data:', JSON.stringify(data).substring(0, 100) + '...');
        } catch (e) {
          console.log('⚠️ Could not parse response as JSON');
        }
        
        return format.name;
      } else {
        console.log('❌ Authorization failed with format:', format.name);
        
        // Try to parse error
        try {
          const errorData = await response.text();
          console.log('❌ Error response:', errorData);
        } catch (e) {
          console.log('⚠️ Could not parse error response');
        }
      }
    } catch (error) {
      console.log('❌ Fetch error with format:', format.name, error);
    }
  }

  console.log('\n❌ All authorization formats failed');
  return null;
}

// Test the health endpoint (public)
async function testHealthEndpoint() {
  console.log('\n🧪 Testing health endpoint (public)...');
  
  try {
    const response = await fetch(HEALTH_ENDPOINT);
    const data = await response.json();
    
    console.log('📡 Status:', response.status, response.statusText);
    console.log('📄 Response:', data);
    
    return response.ok;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting JWT authentication validation tests');
  
  // Test 1: Health endpoint
  await testHealthEndpoint();
  
  // Get a JWT token here (in a real app, you would use Cognito or a token provider)
  // For testing purposes, prompt the user to paste a valid token
  console.log('\n⚠️ Please provide a valid JWT token from your browser:');
  console.log('1. Go to https://d7t9x3j66yd8k.cloudfront.net and log in');
  console.log('2. Open browser DevTools (F12) and go to Application tab');
  console.log('3. Look in localStorage for "ikusi.jwt" or "amplify-signin-with-hostedUI-state" and copy the value');
  console.log('4. Paste the token below when prompted');
  
  // Use readline for interactive token input
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  token = await new Promise(resolve => {
    readline.question('Paste token here: ', (input) => {
      readline.close();
      return resolve(input);
    });
  });
  
  if (!token || token.trim() === '') {
    token = "PASTE_VALID_TOKEN_HERE";
    console.log('⚠️ No token provided. Using placeholder value.');
  } else {
    console.log('✅ Token received: ' + token.substring(0, 10) + '...');
  }
  
  // Test 2: Try different auth formats
  if (token && token !== "PASTE_VALID_TOKEN_HERE") {
    const workingFormat = await testAuthorizationFormats();
    
    if (workingFormat) {
      console.log('\n✅ Success! The API accepts the format:', workingFormat);
      console.log('👉 Update the fetchWrapper.ts file to use this format');
    } else {
      console.log('\n❌ All authentication formats failed. Check token validity.');
    }
  } else {
    console.log('\n❌ No valid token provided. Cannot test authentication.');
  }
}

// Run the tests
runTests().catch(console.error);
