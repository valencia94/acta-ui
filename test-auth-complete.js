#!/usr/bin/env node
// 🧪 Complete Authentication Test for ACTA-UI
// Test authentication with provided credentials: christian.valencia@ikusi.com / PdYb7TU7HvBhYP7$!

import { Amplify } from 'aws-amplify';
import { signIn, signOut, fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

// Import AWS configuration
const awsConfig = {
  aws_project_region: "us-east-2",
  aws_cognito_region: "us-east-2",
  aws_user_pools_id: "us-east-2_FyHLtOhiY",
  aws_user_pools_web_client_id: "dshos5iou44tuach7ta3ici5m",
  aws_cognito_identity_pool_id: "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",
  oauth: {
    domain: "us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com",
    scope: ["email", "openid", "profile"],
    redirectSignIn: "https://d7t9x3j66yd8k.cloudfront.net/",
    redirectSignOut: "https://d7t9x3j66yd8k.cloudfront.net/login",
    responseType: "code"
  },
  API: {
    REST: {
      ActaAPI: {
        endpoint: "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod",
        region: "us-east-2"
      }
    }
  },
  Storage: {
    S3: { bucket: "projectplace-dv-2025-x9a7b", region: "us-east-2" }
  }
};

// Test credentials from problem statement
const TEST_EMAIL = 'christian.valencia@ikusi.com';
const TEST_PASSWORD = 'PdYb7TU7HvBhYP7$!';

async function testAuthentication() {
  console.log('🧪 Starting Complete Authentication Test');
  console.log('=' .repeat(60));
  
  try {
    // Configure Amplify
    console.log('1️⃣ Configuring Amplify...');
    Amplify.configure(awsConfig);
    console.log('✅ Amplify configured successfully');
    
    // Sign out first to ensure clean state
    console.log('\n2️⃣ Ensuring clean authentication state...');
    try {
      await signOut();
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.log('ℹ️ No existing session to sign out');
    }
    
    // Test sign in
    console.log('\n3️⃣ Testing sign in with provided credentials...');
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`🔑 Password: ${TEST_PASSWORD.substring(0, 3)}***`);
    
    const signInResult = await signIn({
      username: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log('✅ Sign in successful!');
    console.log('📊 Sign in result:', {
      isSignedIn: signInResult.isSignedIn,
      nextStep: signInResult.nextStep
    });
    
    // Fetch authentication session
    console.log('\n4️⃣ Fetching authentication session...');
    const session = await fetchAuthSession();
    
    console.log('✅ Session fetched successfully!');
    console.log('📊 Session details:', {
      hasTokens: !!session.tokens,
      hasIdToken: !!session.tokens?.idToken,
      hasAccessToken: !!session.tokens?.accessToken,
      hasCredentials: !!session.credentials,
      tokenExpiry: session.tokens?.idToken?.payload?.exp ? new Date(session.tokens.idToken.payload.exp * 1000).toISOString() : 'N/A'
    });
    
    // Get current user
    console.log('\n5️⃣ Getting current user information...');
    const user = await getCurrentUser();
    
    console.log('✅ User information retrieved!');
    console.log('👤 User details:', {
      username: user.username,
      email: user.signInDetails?.loginId || 'N/A',
      userId: user.userId
    });
    
    // Extract JWT token
    console.log('\n6️⃣ Extracting JWT token...');
    const idToken = session.tokens?.idToken?.toString();
    if (idToken) {
      console.log('✅ JWT token extracted successfully');
      console.log('🔍 Token preview:', idToken.substring(0, 50) + '...');
      
      // Decode token payload (basic decode, not verification)
      try {
        const base64Payload = idToken.split('.')[1];
        const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
        console.log('📋 Token payload:', {
          email: payload.email,
          sub: payload.sub,
          exp: new Date(payload.exp * 1000).toISOString(),
          iat: new Date(payload.iat * 1000).toISOString(),
          aud: payload.aud
        });
      } catch (decodeError) {
        console.warn('⚠️ Could not decode token payload:', decodeError.message);
      }
    } else {
      console.error('❌ No JWT token found in session');
    }
    
    console.log('\n🎉 Authentication test completed successfully!');
    console.log('=' .repeat(60));
    
    return {
      success: true,
      user: user,
      session: session,
      token: idToken
    };
    
  } catch (error) {
    console.error('\n❌ Authentication test failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code || 'N/A'
    });
    
    console.log('\n🔍 Troubleshooting suggestions:');
    console.log('- Verify the credentials are correct');
    console.log('- Check if the user account exists in Cognito');
    console.log('- Verify the Cognito pool configuration');
    console.log('- Check network connectivity');
    
    return {
      success: false,
      error: error
    };
  }
}

// Test API connectivity with authenticated token
async function testAPIConnectivity(token) {
  console.log('\n🌐 Testing API Connectivity...');
  console.log('=' .repeat(60));
  
  const baseUrl = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
  
  const endpoints = [
    { path: '/health', auth: false, description: 'Health check (no auth)' },
    { path: '/projects-for-pm?email=' + encodeURIComponent(TEST_EMAIL) + '&admin=false', auth: true, description: 'PM Projects' },
    { path: '/all-projects', auth: true, description: 'All Projects' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint.description}`);
      console.log(`📍 URL: ${baseUrl}${endpoint.path}`);
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (endpoint.auth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: 'GET',
        headers: headers
      });
      
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.text();
        console.log('✅ Response received');
        console.log(`📄 Response preview: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
      } else {
        console.log('❌ Request failed');
        const errorText = await response.text();
        console.log(`🚨 Error: ${errorText.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.error(`❌ Network error for ${endpoint.description}:`, error.message);
    }
  }
}

// Main execution
async function main() {
  const authResult = await testAuthentication();
  
  if (authResult.success && authResult.token) {
    await testAPIConnectivity(authResult.token);
  }
  
  console.log('\n📋 Test Summary');
  console.log('=' .repeat(60));
  console.log(`✅ Authentication: ${authResult.success ? 'PASS' : 'FAIL'}`);
  console.log(`🔑 JWT Token: ${authResult.token ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
  
  if (authResult.success) {
    console.log('\n🎯 Next Steps:');
    console.log('- Test dashboard functionality');
    console.log('- Verify button actions');
    console.log('- Test document generation');
    console.log('- Validate email sending');
  }
}

main().catch(console.error);

export { testAuthentication, testAPIConnectivity };