#!/usr/bin/env node

// AWS Configuration Validation Script
// This script validates API Gateway, Cognito, and Lambda configurations

const jwt = require('jsonwebtoken');

const API_BASE_URL = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
const USER_POOL_ID = 'us-east-2_FyHLtOhiY';
const CLIENT_ID = 'dshos5iou44tuach7ta3ici5m';

console.log('🔍 Starting AWS Configuration Validation...');
console.log(`🌐 API Base URL: ${API_BASE_URL}`);
console.log(`👥 User Pool ID: ${USER_POOL_ID}`);
console.log(`📱 Client ID: ${CLIENT_ID}`);

// Get token from command line
const tokenArg = process.argv.find(arg => arg.startsWith('--token='));
const token = tokenArg ? tokenArg.replace('--token=', '') : null;

if (!token) {
  console.log('❌ No token provided. Usage: node validate-aws-config.js --token=YOUR_JWT_TOKEN');
  process.exit(1);
}

async function validateJWTToken(token) {
  console.log('\n🔐 Validating JWT Token...');
  
  try {
    // Decode without verification to inspect claims
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      console.log('❌ Invalid JWT format');
      return false;
    }
    
    console.log('📋 Token Header:', JSON.stringify(decoded.header, null, 2));
    console.log('📋 Token Payload:', JSON.stringify(decoded.payload, null, 2));
    
    const payload = decoded.payload;
    
    // Check token type
    if (payload.token_use === 'access') {
      console.log('✅ Token Type: Access Token');
    } else if (payload.token_use === 'id') {
      console.log('✅ Token Type: ID Token');
    } else {
      console.log('⚠️ Unknown token type:', payload.token_use);
    }
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.log('❌ Token is EXPIRED');
      console.log(`   Expired at: ${new Date(payload.exp * 1000).toISOString()}`);
      console.log(`   Current time: ${new Date(now * 1000).toISOString()}`);
      return false;
    } else if (payload.exp) {
      console.log('✅ Token is valid (not expired)');
      console.log(`   Expires at: ${new Date(payload.exp * 1000).toISOString()}`);
    }
    
    // Check issuer
    const expectedIssuer = `https://cognito-idp.us-east-2.amazonaws.com/${USER_POOL_ID}`;
    if (payload.iss === expectedIssuer) {
      console.log('✅ Issuer matches expected User Pool');
    } else {
      console.log('❌ Issuer mismatch');
      console.log(`   Expected: ${expectedIssuer}`);
      console.log(`   Found: ${payload.iss}`);
      return false;
    }
    
    // Check client ID
    if (payload.client_id === CLIENT_ID || payload.aud === CLIENT_ID) {
      console.log('✅ Client ID matches');
    } else {
      console.log('❌ Client ID mismatch');
      console.log(`   Expected: ${CLIENT_ID}`);
      console.log(`   Found: ${payload.client_id || payload.aud}`);
      return false;
    }
    
    // Check user groups
    if (payload['cognito:groups']) {
      console.log('👥 User Groups:', payload['cognito:groups']);
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ JWT validation error:', error.message);
    return false;
  }
}

async function testAPIGatewayEndpoint(endpoint, method = 'GET', useAuth = true) {
  console.log(`\n📡 Testing ${method} ${endpoint}...`);
  
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'AWS-Config-Validator/1.0',
    'Origin': 'https://d7t9x3j66yd8k.cloudfront.net'
  };
  
  if (useAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(endpoint, {
      method,
      headers,
      credentials: 'include'
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    // Log all response headers for debugging
    console.log('📋 Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }
    
    // Try to get response body
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json();
        console.log('📄 Response Body:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('⚠️ Could not parse JSON response');
      }
    } else {
      const text = await response.text();
      if (text) {
        console.log('📄 Response Body (text):', text.substring(0, 500));
      }
    }
    
    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    };
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return { error: error.message };
  }
}

async function validateCORSConfiguration() {
  console.log('\n🌐 Validating CORS Configuration...');
  
  const origins = [
    'https://d7t9x3j66yd8k.cloudfront.net',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  for (const origin of origins) {
    console.log(`\n🌍 Testing CORS for origin: ${origin}`);
    
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Authorization,Content-Type'
        }
      });
      
      console.log(`📊 CORS Status: ${response.status}`);
      
      const corsHeaders = {
        'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
        'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
        'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
        'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
      };
      
      console.log('🔓 CORS Headers:', corsHeaders);
      
      // Validate specific CORS requirements
      if (corsHeaders['access-control-allow-origin'] === origin || 
          corsHeaders['access-control-allow-origin'] === '*') {
        console.log('✅ Origin allowed');
      } else {
        console.log('❌ Origin not allowed');
      }
      
      if (corsHeaders['access-control-allow-headers']?.includes('Authorization')) {
        console.log('✅ Authorization header allowed');
      } else {
        console.log('❌ Authorization header not allowed');
      }
      
    } catch (error) {
      console.log(`❌ CORS test failed: ${error.message}`);
    }
  }
}

async function validateAPIGatewayConfiguration() {
  console.log('\n🚪 Validating API Gateway Configuration...');
  
  // Test health endpoint (no auth)
  const healthResult = await testAPIGatewayEndpoint(`${API_BASE_URL}/health`, 'GET', false);
  
  if (healthResult.ok) {
    console.log('✅ Health endpoint accessible');
  } else {
    console.log('❌ Health endpoint failed');
    return false;
  }
  
  // Test authenticated endpoints
  const endpoints = [
    '/pm-manager/test@example.com',
    '/extract-project-place',
    '/check-document/test-project-id',
    '/download-acta/test-project-id?format=pdf',
    '/send-approval-email'
  ];
  
  for (const endpoint of endpoints) {
    await testAPIGatewayEndpoint(`${API_BASE_URL}${endpoint}`, 'GET', true);
  }
  
  return true;
}

async function checkTokenPermissions() {
  console.log('\n🔑 Checking Token Permissions...');
  
  try {
    const decoded = jwt.decode(token);
    
    if (decoded['cognito:groups']) {
      console.log('👥 User belongs to groups:', decoded['cognito:groups']);
      
      const requiredGroups = ['ikusi-acta-ui', 'acta-ui-s3', 'acta-ui-ikusi'];
      const userGroups = decoded['cognito:groups'];
      
      for (const group of requiredGroups) {
        if (userGroups.includes(group)) {
          console.log(`✅ User is in required group: ${group}`);
        } else {
          console.log(`❌ User is NOT in required group: ${group}`);
        }
      }
    } else {
      console.log('⚠️ No groups found in token');
    }
    
    // Check scopes
    if (decoded.scope) {
      console.log('🔐 Token scopes:', decoded.scope);
    }
    
  } catch (error) {
    console.log('❌ Error checking permissions:', error.message);
  }
}

async function runValidation() {
  console.log('🚀 Starting comprehensive AWS validation...\n');
  
  // Step 1: Validate JWT token
  const tokenValid = await validateJWTToken(token);
  if (!tokenValid) {
    console.log('\n❌ Token validation failed. Cannot proceed with API tests.');
    return;
  }
  
  // Step 2: Check token permissions
  await checkTokenPermissions();
  
  // Step 3: Validate CORS configuration
  await validateCORSConfiguration();
  
  // Step 4: Validate API Gateway configuration
  await validateAPIGatewayConfiguration();
  
  console.log('\n📊 Validation Complete!');
  console.log('\n🎯 Summary & Recommendations:');
  console.log('1. If token is valid but API calls fail with 401/403:');
  console.log('   - Check API Gateway Cognito authorizer configuration');
  console.log('   - Verify User Pool and Client ID match in authorizer');
  console.log('   - Check Lambda execution role permissions');
  console.log('2. If CORS errors occur:');
  console.log('   - Ensure all API Gateway methods have proper CORS headers');
  console.log('   - Check CloudFront distribution for header forwarding');
  console.log('3. If 502 errors occur:');
  console.log('   - Check CloudWatch logs for Lambda function errors');
  console.log('   - Verify Lambda function code and dependencies');
}

// Run validation
runValidation().catch(error => {
  console.error('❌ Validation script error:', error);
  process.exit(1);
});
