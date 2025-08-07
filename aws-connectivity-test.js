// AWS API Connectivity Test Script
// Run this in your browser console to test direct connectivity

console.log('🔧 AWS API Gateway Connectivity Test');

const apiGatewayId = 'q2b9avfwv5';
const region = 'us-east-2';
const baseUrl = `https://${apiGatewayId}.execute-api.${region}.amazonaws.com/prod`;

// Test 1: Basic connectivity to API Gateway
async function testBasicConnectivity() {
  console.log('🌐 Testing basic API Gateway connectivity...');
  
  try {
    // Test with a simple fetch (no auth) to see if we get CORS or connection error
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      mode: 'cors'
    });
    
    console.log('✅ Basic connectivity test:');
    console.log('  - Status:', response.status);
    console.log('  - Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 200) {
      const data = await response.text();
      console.log('  - Response:', data);
    }
    
  } catch (error) {
    console.log('❌ Basic connectivity failed:', error.message);
    
    if (error.message.includes('CORS')) {
      console.log('🚨 CORS Issue detected - API Gateway CORS not configured properly');
    } else if (error.message.includes('Failed to fetch')) {
      console.log('🚨 Network issue - API Gateway may not be accessible');
    }
  }
}

// Test 2: Check if API Gateway exists
async function testAPIGatewayExists() {
  console.log('🔍 Testing if API Gateway exists...');
  
  try {
    // Try a HEAD request to see if the gateway responds at all
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      mode: 'no-cors'  // This bypasses CORS to test basic connectivity
    });
    
    console.log('✅ API Gateway responds to requests');
    
  } catch (error) {
    console.log('❌ API Gateway not accessible:', error.message);
  }
}

// Test 3: CORS Pre-flight test
async function testCORSPreflight() {
  console.log('🔍 Testing CORS preflight...');
  
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'OPTIONS'
    });
    
    console.log('✅ CORS preflight response:');
    console.log('  - Status:', response.status);
    console.log('  - CORS headers:');
    console.log('    - Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('    - Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
    console.log('    - Access-Control-Allow-Headers:', response.headers.get('Access-Control-Allow-Headers'));
    
  } catch (error) {
    console.log('❌ CORS preflight failed:', error.message);
  }
}

// Run all tests
async function runConnectivityTests() {
  console.log('🚀 Starting AWS API Gateway Connectivity Tests...');
  console.log('📍 Target:', baseUrl);
  console.log('=' .repeat(60));
  
  await testBasicConnectivity();
  console.log('');
  
  await testAPIGatewayExists();
  console.log('');
  
  await testCORSPreflight();
  console.log('');
  
  console.log('🏁 Connectivity tests complete!');
  console.log('💡 Check the results above to identify the issue');
}

// Auto-run the tests
runConnectivityTests();
