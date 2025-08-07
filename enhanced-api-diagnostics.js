/**
 * Enhanced API Diagnostics Tool
 * Run this in the browser console to get detailed information about API connectivity issues
 */

const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

/**
 * Comprehensive API diagnostics
 */
async function runEnhancedAPIDiagnostics() {
  console.log('🚀 Enhanced API Diagnostics Starting...');
  console.log('=====================================');
  
  const results = {
    internetConnectivity: false,
    dnsResolution: false,
    apiGatewayReachable: false,
    corsConfigured: false,
    healthEndpoint: false,
    authenticationWorking: false,
    details: {}
  };

  // Test 1: Basic Internet Connectivity
  console.log('\n1️⃣ Testing basic internet connectivity...');
  try {
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      results.internetConnectivity = true;
      console.log('✅ Internet connectivity: OK');
    } else {
      console.log(`❌ Internet connectivity: Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`❌ Internet connectivity: Failed (${error.message})`);
    results.details.internetError = error.message;
  }

  // Test 2: DNS Resolution for API Gateway
  console.log('\n2️⃣ Testing DNS resolution for API Gateway...');
  try {
    const apiHost = new URL(API_BASE).hostname;
    console.log(`Testing DNS for: ${apiHost}`);
    
    // Try to resolve the domain by making a simple request
    const response = await fetch(`https://${apiHost}`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    results.dnsResolution = true;
    console.log('✅ DNS resolution: OK');
    console.log(`Response status: ${response.status}`);
  } catch (error) {
    console.log(`❌ DNS resolution: Failed (${error.message})`);
    results.details.dnsError = error.message;
  }

  // Test 3: API Gateway Base URL
  console.log('\n3️⃣ Testing API Gateway base URL...');
  try {
    const response = await fetch(API_BASE, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    
    results.apiGatewayReachable = true;
    console.log(`✅ API Gateway reachable: ${response.status}`);
    
    const responseText = await response.text();
    console.log('Response:', responseText.substring(0, 200) + '...');
    results.details.apiGatewayResponse = responseText;
  } catch (error) {
    console.log(`❌ API Gateway: Failed (${error.message})`);
    results.details.apiGatewayError = error.message;
    
    // Enhanced error analysis
    if (error.message.includes('Failed to fetch')) {
      console.log('🔍 "Failed to fetch" indicates:');
      console.log('   • CORS issue (most likely)');
      console.log('   • Network/firewall blocking');
      console.log('   • API Gateway not deployed');
      console.log('   • SSL/TLS certificate issues');
    }
  }

  // Test 4: CORS Configuration
  console.log('\n4️⃣ Testing CORS configuration...');
  try {
    const response = await fetch(API_BASE, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`CORS preflight status: ${response.status}`);
    
    const corsHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes('access-control')) {
        corsHeaders[key] = value;
      }
    }
    
    console.log('CORS headers:', corsHeaders);
    results.details.corsHeaders = corsHeaders;
    
    if (corsHeaders['access-control-allow-origin']) {
      results.corsConfigured = true;
      console.log('✅ CORS: Configured');
    } else {
      console.log('❌ CORS: Not properly configured');
    }
  } catch (error) {
    console.log(`❌ CORS test: Failed (${error.message})`);
    results.details.corsError = error.message;
  }

  // Test 5: Health Endpoint
  console.log('\n5️⃣ Testing health endpoint...');
  try {
    const response = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      results.healthEndpoint = true;
      console.log('✅ Health endpoint: OK');
      const healthData = await response.text();
      console.log('Health response:', healthData);
      results.details.healthResponse = healthData;
    } else {
      console.log(`❌ Health endpoint: Failed (${response.status})`);
      const errorData = await response.text();
      results.details.healthError = errorData;
    }
  } catch (error) {
    console.log(`❌ Health endpoint: Failed (${error.message})`);
    results.details.healthEndpointError = error.message;
  }

  // Test 6: Authentication Token
  console.log('\n6️⃣ Testing authentication...');
  try {
    // Get auth token
    let authToken = null;
    
    // Try Amplify storage
    const amplifyData = localStorage.getItem('amplify-auto-track-session');
    if (amplifyData) {
      const session = JSON.parse(amplifyData);
      authToken = session.idToken?.jwtToken || session.accessToken?.jwtToken;
    }
    
    // Try Cognito storage
    if (!authToken) {
      const keys = Object.keys(localStorage);
      const cognitoKeys = keys.filter(key => 
        key.includes('CognitoIdentityServiceProvider') && 
        key.includes('idToken')
      );
      
      if (cognitoKeys.length > 0) {
        authToken = localStorage.getItem(cognitoKeys[0]);
      }
    }
    
    if (authToken) {
      console.log('✅ Auth token found');
      
      // Test token validity
      try {
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        const exp = new Date(payload.exp * 1000);
        const now = new Date();
        
        if (now < exp) {
          console.log(`✅ Token is valid until: ${exp}`);
          results.authenticationWorking = true;
        } else {
          console.log(`❌ Token expired at: ${exp}`);
        }
        
        results.details.tokenExpiry = exp;
      } catch (e) {
        console.log('❌ Invalid token format');
      }
      
      // Test authenticated endpoint
      try {
        const response = await fetch(`${API_BASE}/project-summary/12345`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });
        
        console.log(`Authenticated request status: ${response.status}`);
        if (response.status === 404) {
          console.log('✅ Authentication working (404 expected for test project)');
        } else if (response.status === 401) {
          console.log('❌ Authentication failed (401 Unauthorized)');
        } else {
          console.log(`ℹ️ Unexpected status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Authenticated request failed: ${error.message}`);
      }
    } else {
      console.log('❌ No auth token found');
    }
  } catch (error) {
    console.log(`❌ Authentication test failed: ${error.message}`);
  }

  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('====================');
  console.log(`Internet Connectivity: ${results.internetConnectivity ? '✅' : '❌'}`);
  console.log(`DNS Resolution: ${results.dnsResolution ? '✅' : '❌'}`);
  console.log(`API Gateway Reachable: ${results.apiGatewayReachable ? '✅' : '❌'}`);
  console.log(`CORS Configured: ${results.corsConfigured ? '✅' : '❌'}`);
  console.log(`Health Endpoint: ${results.healthEndpoint ? '✅' : '❌'}`);
  console.log(`Authentication: ${results.authenticationWorking ? '✅' : '❌'}`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  if (!results.internetConnectivity) {
    console.log('🔧 Check your internet connection');
  }
  
  if (!results.dnsResolution) {
    console.log('🔧 DNS issue - check network settings or try different DNS');
  }
  
  if (!results.apiGatewayReachable) {
    console.log('🔧 API Gateway is not reachable:');
    console.log('   • Check if API Gateway is deployed');
    console.log('   • Verify the API Gateway URL');
    console.log('   • Check firewall/network restrictions');
  }
  
  if (!results.corsConfigured) {
    console.log('🔧 CORS not configured properly:');
    console.log('   • API Gateway needs CORS headers');
    console.log('   • Check Access-Control-Allow-Origin header');
  }
  
  if (!results.healthEndpoint) {
    console.log('🔧 Health endpoint not responding:');
    console.log('   • Lambda function may not be deployed');
    console.log('   • Check API Gateway route configuration');
  }
  
  if (!results.authenticationWorking) {
    console.log('🔧 Authentication issues:');
    console.log('   • Re-login to get fresh token');
    console.log('   • Check Cognito configuration');
  }

  return results;
}

// Make function available globally
window.runEnhancedAPIDiagnostics = runEnhancedAPIDiagnostics;

// Auto-run the diagnostics
console.log('🔧 Enhanced API Diagnostics Tool loaded');
console.log('📞 Run: window.runEnhancedAPIDiagnostics()');

// Optionally auto-run
// runEnhancedAPIDiagnostics();
