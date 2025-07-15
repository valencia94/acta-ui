// 🧪 AWS Live API Testing Suite
// This will test actual API calls with real authentication tokens

console.log('🚀 Starting AWS Live API Testing...');
console.log('=' .repeat(50));

// Test configuration
const CONFIG = {
  apiBase: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
  testProjectId: '1000000064013473', // Use a real project ID for testing
  s3Bucket: 'projectplace-dv-2025-x9a7b',
  region: 'us-east-2'
};

// Helper function to get auth token from current session
function getAuthToken() {
  // Try to get from Amplify session
  try {
    const authData = localStorage.getItem('amplify-auto-track-session');
    if (authData) {
      const session = JSON.parse(authData);
      console.log('📋 Found Amplify session data');
      return session.idToken?.jwtToken || session.accessToken?.jwtToken;
    }
  } catch (e) {
    console.warn('⚠️ Could not parse Amplify session');
  }

  // Try to get from other common storage locations
  const keys = Object.keys(localStorage);
  const cognitoKeys = keys.filter(key => 
    key.includes('cognito') || 
    key.includes('CognitoIdentityServiceProvider') ||
    key.includes('amplify')
  );
  
  console.log('🔍 Found Cognito-related storage keys:', cognitoKeys);
  
  // Try to extract token from any cognito storage
  for (const key of cognitoKeys) {
    try {
      const data = localStorage.getItem(key);
      if (data && data.includes('eyJ')) { // JWT tokens start with 'eyJ'
        console.log('🎯 Found potential token in:', key);
        return data;
      }
    } catch (e) {
      continue;
    }
  }
  
  return null;
}

// Test function with real authentication
async function testApiEndpoint(endpoint, method = 'GET', payload = null) {
  const token = getAuthToken();
  
  if (!token) {
    console.error('❌ No authentication token found. Please log in first.');
    return null;
  }

  const url = `${CONFIG.apiBase}${endpoint}`;
  console.log(`🔄 Testing ${method} ${url}`);
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  if (payload && method !== 'GET') {
    options.body = JSON.stringify(payload);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
  }

  try {
    const startTime = Date.now();
    const response = await fetch(url, options);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`📊 Response: ${response.status} ${response.statusText} (${duration}ms)`);
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Response data:', data);
      return { success: true, data, status: response.status, duration };
    } else {
      const errorText = await response.text();
      console.error(`❌ Error: ${response.status} - ${errorText}`);
      return { success: false, error: errorText, status: response.status, duration };
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return { success: false, error: error.message, status: 0, duration: 0 };
  }
}

// Test suite
async function runFullTestSuite() {
  console.log('🎯 Running Full AWS API Test Suite...');
  console.log('');

  const results = {};

  // 1. Test Health Endpoint (Public)
  console.log('1️⃣ Testing Health Endpoint (Public)...');
  results.health = await testApiEndpoint('/health');
  console.log('');

  // 2. Test Project Summary
  console.log('2️⃣ Testing Project Summary...');
  results.summary = await testApiEndpoint(`/project-summary/${CONFIG.testProjectId}`);
  console.log('');

  // 3. Test Timeline
  console.log('3️⃣ Testing Timeline...');
  results.timeline = await testApiEndpoint(`/timeline/${CONFIG.testProjectId}`);
  console.log('');

  // 4. Test Generate ACTA (Main Function)
  console.log('4️⃣ Testing Generate ACTA (Main Function)...');
  const generatePayload = {
    projectId: CONFIG.testProjectId,
    pmEmail: 'test@example.com',
    userRole: 'pm',
    s3Bucket: CONFIG.s3Bucket,
    s3Region: CONFIG.region,
    cloudfrontDistributionId: 'D7T9X3J66YD8K',
    cloudfrontUrl: 'https://d7t9x3j66yd8k.cloudfront.net',
    requestSource: 'acta-ui',
    generateDocuments: true,
    extractMetadata: true,
    timestamp: new Date().toISOString()
  };
  results.generate = await testApiEndpoint(`/extract-project-place/${CONFIG.testProjectId}`, 'POST', generatePayload);
  console.log('');

  // 5. Test Document Download
  console.log('5️⃣ Testing Document Download...');
  results.download = await testApiEndpoint(`/download-acta/${CONFIG.testProjectId}?format=pdf`);
  console.log('');

  // 6. Test Document Check
  console.log('6️⃣ Testing Document Check...');
  results.check = await testApiEndpoint(`/check-document/${CONFIG.testProjectId}?format=pdf`);
  console.log('');

  // 7. Test Send Approval Email
  console.log('7️⃣ Testing Send Approval Email...');
  const emailPayload = {
    actaId: CONFIG.testProjectId,
    clientEmail: 'test.client@example.com'
  };
  results.approval = await testApiEndpoint('/send-approval-email', 'POST', emailPayload);
  console.log('');

  // Results Summary
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result?.success ? '✅ PASS' : '❌ FAIL';
    const duration = result?.duration || 0;
    const httpStatus = result?.status || 'N/A';
    console.log(`${status} ${test.toUpperCase()}: ${httpStatus} (${duration}ms)`);
  });

  console.log('');
  console.log('🎯 Key Insights:');
  
  // Check authentication
  const authTests = ['summary', 'timeline', 'generate', 'approval'];
  const authPassing = authTests.filter(test => results[test]?.success).length;
  console.log(`🔐 Authentication: ${authPassing}/${authTests.length} endpoints working`);
  
  // Check main functionality
  if (results.generate?.success) {
    console.log('✅ Generate ACTA: Working correctly!');
  } else if (results.generate?.status === 401) {
    console.log('🔑 Generate ACTA: Authentication issue - check Cognito token');
  } else if (results.generate?.status === 404) {
    console.log('📝 Generate ACTA: Project not found - try different Project ID');
  } else {
    console.log('❌ Generate ACTA: Technical issue - check Lambda function');
  }

  return results;
}

// Quick authentication test
async function testAuthentication() {
  const token = getAuthToken();
  
  console.log('🔐 Authentication Test');
  console.log('=' .repeat(30));
  
  if (!token) {
    console.error('❌ No authentication token found');
    console.log('💡 Please log in to the application first');
    return false;
  }
  
  console.log('✅ Authentication token found');
  console.log('🔑 Token preview:', token.substring(0, 50) + '...');
  
  // Try to decode JWT header
  try {
    const header = JSON.parse(atob(token.split('.')[0]));
    console.log('📋 JWT Header:', header);
  } catch (e) {
    console.log('⚠️ Could not decode JWT header');
  }
  
  // Test with a simple authenticated endpoint
  const testResult = await testApiEndpoint('/health');
  return testResult?.success || false;
}

// Export functions for manual testing
window.testAWSAPIs = {
  runFullTestSuite,
  testAuthentication,
  testApiEndpoint,
  getAuthToken,
  CONFIG
};

console.log('');
console.log('🚀 AWS API Testing Suite Loaded!');
console.log('');
console.log('📋 Available Commands:');
console.log('  testAWSAPIs.testAuthentication() - Check auth token');
console.log('  testAWSAPIs.runFullTestSuite() - Run all tests');
console.log('  testAWSAPIs.testApiEndpoint(endpoint, method, payload) - Test specific endpoint');
console.log('');
console.log('💡 Quick Start: testAWSAPIs.runFullTestSuite()');
