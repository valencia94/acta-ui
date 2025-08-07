// 🔧 COMPREHENSIVE NETWORK & CORS DIAGNOSTIC SCRIPT
// Copy and paste this entire script into your browser console to run detailed diagnostics

console.log('🔧 Starting Comprehensive Network & CORS Diagnostics...');
console.log('📅 Run at:', new Date().toISOString());

const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
const TEST_PROJECT_ID = '1000000064013473';

// Helper function to test different request methods and configurations
async function testEndpoint(url, options = {}, description = '') {
  const startTime = Date.now();
  try {
    console.log(`🧪 Testing: ${description || url}`);
    console.log(`📤 Options:`, options);
    
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(15000) // 15 second timeout
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`✅ Success: ${response.status} ${response.statusText} (${responseTime}ms)`);
    console.log(`📥 Headers:`, Object.fromEntries(response.headers.entries()));
    
    // Try to read response body if possible
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.clone().json();
        console.log(`📋 Response Data:`, data);
      } else {
        const text = await response.clone().text();
        console.log(`📋 Response Text (first 200 chars):`, text.substring(0, 200));
      }
    } catch (e) {
      console.log(`📋 Could not read response body:`, e.message);
    }
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      responseTime,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`❌ Failed: ${error.message} (${responseTime}ms)`);
    console.log(`📋 Error details:`, error);
    
    return {
      success: false,
      error: error.message,
      responseTime,
      errorType: error.name
    };
  }
}

// Test 1: Basic connectivity
async function testBasicConnectivity() {
  console.log('\n🌐 === BASIC CONNECTIVITY TESTS ===');
  
  // Test external internet
  await testEndpoint('https://httpbin.org/get', {}, 'External Internet (httpbin.org)');
  
  // Test AWS services generally
  await testEndpoint('https://aws.amazon.com', {}, 'AWS Main Site');
  
  // Test our specific API Gateway domain
  await testEndpoint('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com', {}, 'API Gateway Base Domain');
}

// Test 2: CORS Configuration
async function testCORS() {
  console.log('\n🔄 === CORS CONFIGURATION TESTS ===');
  
  const corsTestUrls = [
    `${API_BASE}`,
    `${API_BASE}/health`,
    `${API_BASE}/project-summary/${TEST_PROJECT_ID}`,
    `${API_BASE}/extract-project-place/${TEST_PROJECT_ID}`
  ];
  
  for (const url of corsTestUrls) {
    console.log(`\n🔍 Testing CORS for: ${url}`);
    
    // Test simple request first
    await testEndpoint(url, { method: 'GET' }, `Simple GET request`);
    
    // Test CORS preflight
    await testEndpoint(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    }, `CORS Preflight (OPTIONS)`);
  }
}

// Test 3: Different request methods and headers
async function testRequestVariations() {
  console.log('\n📤 === REQUEST VARIATION TESTS ===');
  
  const testUrl = `${API_BASE}/health`;
  
  // Test different methods
  const methods = ['GET', 'POST', 'PUT'];
  for (const method of methods) {
    await testEndpoint(testUrl, { method }, `${method} request`);
  }
  
  // Test with different headers
  await testEndpoint(testUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }, 'GET with Content-Type header');
  
  await testEndpoint(testUrl, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token',
      'Content-Type': 'application/json'
    }
  }, 'GET with Authorization header');
}

// Test 4: Browser-specific tests
async function testBrowserSpecific() {
  console.log('\n🌍 === BROWSER-SPECIFIC TESTS ===');
  
  // Check for ad blockers or security extensions
  console.log('🔍 Browser environment:');
  console.log(`- User Agent: ${navigator.userAgent}`);
  console.log(`- Online: ${navigator.onLine}`);
  console.log(`- Cookies enabled: ${navigator.cookieEnabled}`);
  console.log(`- Current origin: ${window.location.origin}`);
  console.log(`- Protocol: ${window.location.protocol}`);
  
  // Check for common blocking patterns
  const blockedRequests = [];
  try {
    await fetch('https://doubleclick.net/test');
  } catch (e) {
    if (e.message.includes('blocked')) {
      blockedRequests.push('Ad blocker detected');
    }
  }
  
  if (blockedRequests.length > 0) {
    console.log('🚫 Potential blocking detected:', blockedRequests);
  }
}

// Test 5: DNS and network routing
async function testDNSAndRouting() {
  console.log('\n🌐 === DNS & ROUTING TESTS ===');
  
  // Test DNS resolution by hitting different AWS regions
  const awsRegions = [
    'https://q2b9avfwv5.execute-api.us-east-1.amazonaws.com',
    'https://q2b9avfwv5.execute-api.us-west-2.amazonaws.com',
    'https://q2b9avfwv5.execute-api.eu-west-1.amazonaws.com'
  ];
  
  for (const url of awsRegions) {
    await testEndpoint(url, { method: 'GET' }, `DNS test: ${url}`);
  }
}

// Test 6: Authentication token tests
async function testAuthenticationTokens() {
  console.log('\n🔐 === AUTHENTICATION TOKEN TESTS ===');
  
  // Check localStorage for tokens
  console.log('🔍 Checking localStorage for authentication tokens...');
  
  const relevantKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('Cognito') || key.includes('amplify') || key.includes('token'))) {
      relevantKeys.push(key);
    }
  }
  
  console.log(`Found ${relevantKeys.length} potentially relevant keys:`, relevantKeys);
  
  // Try to extract and validate tokens
  let foundTokens = [];
  
  // Check Amplify storage
  try {
    const amplifyData = localStorage.getItem('amplify-auto-track-session');
    if (amplifyData) {
      const session = JSON.parse(amplifyData);
      if (session.idToken?.jwtToken) {
        foundTokens.push({ type: 'Amplify ID Token', token: session.idToken.jwtToken });
      }
      if (session.accessToken?.jwtToken) {
        foundTokens.push({ type: 'Amplify Access Token', token: session.accessToken.jwtToken });
      }
    }
  } catch (e) {
    console.log('❌ Error reading Amplify tokens:', e.message);
  }
  
  // Check Cognito storage
  try {
    const cognitoKeys = relevantKeys.filter(key => 
      key.includes('CognitoIdentityServiceProvider') && 
      (key.includes('idToken') || key.includes('accessToken'))
    );
    
    for (const key of cognitoKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        foundTokens.push({ type: `Cognito Token (${key})`, token });
      }
    }
  } catch (e) {
    console.log('❌ Error reading Cognito tokens:', e.message);
  }
  
  console.log(`🔑 Found ${foundTokens.length} tokens`);
  
  // Validate and test tokens
  for (const { type, token } of foundTokens) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = new Date(payload.exp * 1000);
      const isValid = new Date() < exp;
      
      console.log(`${type}: ${isValid ? '✅ Valid' : '❌ Expired'} (expires: ${exp.toISOString()})`);
      
      if (isValid) {
        // Test API call with this token
        await testEndpoint(`${API_BASE}/health`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }, `Health check with ${type}`);
      }
    } catch (e) {
      console.log(`❌ Error validating ${type}:`, e.message);
    }
  }
}

// Main diagnostic function
async function runComprehensiveDiagnostics() {
  console.log('🚀 Starting comprehensive diagnostics...');
  console.log('⏱️ This may take 1-2 minutes to complete');
  
  const startTime = Date.now();
  
  try {
    await testBasicConnectivity();
    await testCORS();
    await testRequestVariations();
    await testBrowserSpecific();
    await testDNSAndRouting();
    await testAuthenticationTokens();
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    console.log(`\n✅ Comprehensive diagnostics completed in ${totalTime}ms`);
    console.log('📋 Check the detailed output above for specific issues');
    
    // Summary of potential solutions
    console.log('\n🔧 === POTENTIAL SOLUTIONS ===');
    console.log('1. If all API Gateway requests fail with "Failed to fetch":');
    console.log('   - API Gateway may not be deployed or configured correctly');
    console.log('   - CORS settings may be missing or incorrect');
    console.log('   - API Gateway endpoint may be in wrong region or stage');
    
    console.log('\n2. If CORS preflight fails:');
    console.log('   - Add OPTIONS method to API Gateway endpoints');
    console.log('   - Configure proper CORS headers (Access-Control-Allow-Origin, etc.)');
    console.log('   - Ensure all required headers are in Access-Control-Allow-Headers');
    
    console.log('\n3. If authentication fails:');
    console.log('   - Check Cognito User Pool and Identity Pool configuration');
    console.log('   - Verify API Gateway authorizer is correctly configured');
    console.log('   - Ensure tokens are being sent in correct format');
    
    console.log('\n4. If DNS/routing fails:');
    console.log('   - Check if API Gateway endpoint exists in correct region');
    console.log('   - Verify API Gateway stage (prod) is deployed');
    console.log('   - Check for network-level blocking (firewall, corporate proxy)');
    
  } catch (error) {
    console.error('❌ Diagnostic script failed:', error);
  }
}

// Auto-run the diagnostics
runComprehensiveDiagnostics();
