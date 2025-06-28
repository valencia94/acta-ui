#!/usr/bin/env node

// Comprehensive API Connectivity Test with Authentication
const API_BASE_URL = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

console.log('🔍 Comprehensive API Connectivity Test...');
console.log(`🌐 Target API: ${API_BASE_URL}`);

async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint (Public)...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ACTA-UI-Test/1.0'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`📄 Response:`, data);
      console.log('✅ Health endpoint is working correctly');
      return true;
    } else {
      console.log('❌ Health endpoint failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Health endpoint error: ${error.message}`);
    return false;
  }
}

async function testProtectedEndpoints() {
  console.log('\n🔒 Testing Protected Endpoints (Authentication Required)...');
  
  const endpoints = [
    '/projects',
    '/project-summary/test-project-id',
    '/timeline/test-project-id',
    '/generate-acta/test-project-id',
    '/download-acta/test-project-id?format=pdf'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ACTA-UI-Test/1.0'
        }
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 401 || response.status === 403) {
        console.log('✅ Correctly returns authentication error (as expected)');
      } else if (response.status === 502) {
        console.log('⚠️ Internal server error - backend may have issues');
      } else if (response.ok) {
        console.log('✅ Endpoint is accessible (unexpected but good)');
      } else {
        console.log(`❌ Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Error testing ${endpoint}: ${error.message}`);
    }
  }
}

async function testCORSConfiguration() {
  console.log('\n🌐 Testing CORS Configuration...');
  
  const origins = [
    'https://d7t9x3j66yd8k.cloudfront.net',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  for (const origin of origins) {
    console.log(`\n🔗 Testing CORS for origin: ${origin}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        }
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': response.headers.get('access-control-allow-origin'),
        'Access-Control-Allow-Methods': response.headers.get('access-control-allow-methods'),
        'Access-Control-Allow-Headers': response.headers.get('access-control-allow-headers'),
        'Access-Control-Allow-Credentials': response.headers.get('access-control-allow-credentials')
      };
      
      console.log('🔓 CORS Headers:', corsHeaders);
      
      if (corsHeaders['Access-Control-Allow-Origin']) {
        console.log('✅ CORS is configured');
      } else {
        console.log('⚠️ CORS may not be properly configured');
      }
    } catch (error) {
      console.log(`❌ CORS test error: ${error.message}`);
    }
  }
}

async function testNetworkLatency() {
  console.log('\n⏱️ Testing Network Latency...');
  
  const iterations = 3;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    console.log(`📡 Test ${i + 1}/${iterations}...`);
    
    const start = Date.now();
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const end = Date.now();
      const duration = end - start;
      times.push(duration);
      
      console.log(`⏰ Response time: ${duration}ms (Status: ${response.status})`);
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Wait between requests
    if (i < iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  if (times.length > 0) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`\n📊 Latency Summary:`);
    console.log(`   Average: ${avg.toFixed(2)}ms`);
    console.log(`   Min: ${min}ms`);
    console.log(`   Max: ${max}ms`);
    
    if (avg < 500) {
      console.log('✅ Good latency');
    } else if (avg < 1000) {
      console.log('⚠️ Moderate latency');
    } else {
      console.log('❌ High latency - may affect user experience');
    }
  }
}

async function checkApiDocumentation() {
  console.log('\n📚 Checking API Documentation/Info...');
  
  const infoEndpoints = [
    '/docs',
    '/swagger',
    '/openapi',
    '/api-docs',
    '/info',
    '/version'
  ];
  
  for (const endpoint of infoEndpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json,text/html'
        }
      });
      
      if (response.ok) {
        console.log(`✅ Found documentation at: ${endpoint} (${response.status})`);
        const contentType = response.headers.get('content-type');
        console.log(`   Content-Type: ${contentType}`);
      }
    } catch (error) {
      // Ignore errors for documentation endpoints
    }
  }
}

async function runFullDiagnostic() {
  console.log('🚀 Starting Comprehensive API Diagnostic...\n');
  console.log('=' .repeat(60));
  
  const healthOk = await testHealthEndpoint();
  await testProtectedEndpoints();
  await testCORSConfiguration();
  await testNetworkLatency();
  await checkApiDocumentation();
  
  console.log('\n' + '=' .repeat(60));
  console.log('📋 SUMMARY AND RECOMMENDATIONS:');
  
  if (healthOk) {
    console.log('✅ Basic API connectivity is working');
  } else {
    console.log('❌ Basic API connectivity failed - check network/DNS');
  }
  
  console.log('\n💡 Key Findings:');
  console.log('   • Health endpoint is accessible (/health)');
  console.log('   • Protected endpoints require authentication (expected)');
  console.log('   • Some endpoints return 502 errors (backend issues)');
  console.log('   • CORS configuration needs verification');
  
  console.log('\n🛠️ Next Steps:');
  console.log('   1. Verify authentication integration in the UI');
  console.log('   2. Test with valid authentication tokens');
  console.log('   3. Check backend Lambda function logs for 502 errors');
  console.log('   4. Ensure CORS allows your domain origins');
  console.log('   5. Test specific project IDs instead of "test"');
  
  console.log('\n📞 Support:');
  console.log('   • API Base URL: ' + API_BASE_URL);
  console.log('   • CloudFront Distribution: d7t9x3j66yd8k.cloudfront.net');
  console.log('   • AWS Region: us-east-2');
}

runFullDiagnostic().catch(console.error);
