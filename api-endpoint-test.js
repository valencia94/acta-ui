/**
 * Comprehensive API Endpoint Testing Script
 * Run this in the browser console while logged in to test all API endpoints
 */

const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

// Test project ID
const TEST_PROJECT_ID = '12345';

/**
 * Get auth token from Amplify
 */
async function getAuthToken() {
  try {
    // Try to get from current Amplify session
    if (window.amplify && window.amplify.auth && window.amplify.auth.currentSession) {
      const session = await window.amplify.auth.currentSession();
      return session.getIdToken().getJwtToken();
    }
    
    // Try to get from localStorage
    const storedToken = localStorage.getItem('ikusi.jwt');
    if (storedToken) {
      console.log('Using token from localStorage');
      return storedToken;
    }
    
    // Try different localStorage keys
    const altKeys = ['aws.cognito.idToken', 'cognito-idtoken', 'authToken'];
    for (const key of altKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        console.log(`Using token from localStorage key: ${key}`);
        return token;
      }
    }
    
    console.warn('No auth token found in any location');
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Test basic connectivity to API Gateway
 */
async function testConnectivity() {
  console.log('\n🌐 Testing API Gateway Connectivity...');
  
  try {
    // Test with basic OPTIONS request (should not require auth)
    const response = await fetch(API_BASE, {
      method: 'OPTIONS',
      mode: 'cors'
    });
    
    console.log('✅ OPTIONS request successful:', response.status);
    console.log('📋 CORS headers:', Object.fromEntries(response.headers.entries()));
    
    return true;
  } catch (error) {
    console.error('❌ Basic connectivity failed:', error);
    return false;
  }
}

/**
 * Test endpoint availability without authentication
 */
async function testEndpointAvailability() {
  console.log('\n🔍 Testing Endpoint Availability...');
  
  const endpoints = [
    `/project-summary/${TEST_PROJECT_ID}`,
    `/timeline/${TEST_PROJECT_ID}`,
    `/extract-project-place/${TEST_PROJECT_ID}`,
    `/download-acta/${TEST_PROJECT_ID}`,
    `/send-approval-email`,
    `/check-document/${TEST_PROJECT_ID}`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const url = `${API_BASE}${endpoint}`;
      console.log(`Testing: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (response.status === 401) {
        console.log(`✅ Endpoint exists (requires auth): ${endpoint}`);
      } else if (response.status === 404) {
        console.log(`❌ Endpoint not found: ${endpoint}`);
      } else {
        console.log(`✅ Endpoint available: ${endpoint} (${response.status})`);
      }
    } catch (error) {
      if (error.message.includes('fetch')) {
        console.error(`❌ Network error for ${endpoint}:`, error.message);
      } else {
        console.log(`⚠️ Error testing ${endpoint}:`, error.message);
      }
    }
  }
}

/**
 * Test authenticated endpoints
 */
async function testAuthenticatedEndpoints() {
  console.log('\n🔐 Testing Authenticated Endpoints...');
  
  const token = await getAuthToken();
  if (!token) {
    console.error('❌ No auth token available - cannot test authenticated endpoints');
    return;
  }
  
  console.log('✅ Auth token found, length:', token.length);
  
  // Test token validity
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = new Date(payload.exp * 1000);
    const now = new Date();
    
    if (now > exp) {
      console.error('❌ Token is expired:', exp);
      return;
    } else {
      console.log('✅ Token is valid until:', exp);
    }
  } catch (error) {
    console.error('❌ Invalid token format:', error);
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Test GET endpoints
  const getEndpoints = [
    `/project-summary/${TEST_PROJECT_ID}`,
    `/timeline/${TEST_PROJECT_ID}`
  ];
  
  for (const endpoint of getEndpoints) {
    try {
      const url = `${API_BASE}${endpoint}`;
      console.log(`GET ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        mode: 'cors'
      });
      
      console.log(`Response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Data received:', data);
      } else {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error(`❌ Network error for ${endpoint}:`, error);
    }
  }
  
  // Test POST endpoints
  console.log('\n📤 Testing POST endpoints...');
  
  try {
    const url = `${API_BASE}/extract-project-place/${TEST_PROJECT_ID}`;
    console.log(`POST ${url}`);
    
    const payload = {
      projectId: TEST_PROJECT_ID,
      pmEmail: 'test@example.com',
      userRole: 'pm',
      s3Bucket: 'projectplace-dv-2025-x9a7b',
      s3Region: 'us-east-2',
      requestSource: 'acta-ui-test',
      generateDocuments: true,
      extractMetadata: true,
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      mode: 'cors'
    });
    
    console.log(`Response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ POST successful:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ POST error:', errorText);
    }
  } catch (error) {
    console.error('❌ POST request failed:', error);
  }
}

/**
 * Test CORS configuration
 */
async function testCORS() {
  console.log('\n🌍 Testing CORS Configuration...');
  
  try {
    const response = await fetch(API_BASE, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      },
      mode: 'cors'
    });
    
    console.log('CORS preflight response:', response.status);
    console.log('CORS headers:');
    
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-allow-credentials'
    ];
    
    for (const header of corsHeaders) {
      const value = response.headers.get(header);
      console.log(`  ${header}: ${value}`);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ CORS test failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Tests');
  console.log('API Base URL:', API_BASE);
  console.log('Current Origin:', window.location.origin);
  
  await testConnectivity();
  await testCORS();
  await testEndpointAvailability();
  await testAuthenticatedEndpoints();
  
  console.log('\n✅ Test suite completed');
}

// Export functions for manual testing
window.apiTests = {
  runAllTests,
  testConnectivity,
  testCORS,
  testEndpointAvailability,
  testAuthenticatedEndpoints,
  getAuthToken
};

// Auto-run tests
runAllTests();
