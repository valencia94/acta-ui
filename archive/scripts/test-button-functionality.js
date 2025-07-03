// Button Functionality Test After Auth Fix
console.log('🧪 Testing Button Functionality After Auth Fix...');

// Test 1: Check current environment
console.log('📋 Environment Configuration:');
console.log(
  '- API Base URL:',
  import.meta?.env?.VITE_API_BASE_URL || 'Not defined'
);
console.log(
  '- Cognito Region:',
  import.meta?.env?.VITE_COGNITO_REGION || 'Not defined'
);
console.log(
  '- Cognito Pool ID:',
  import.meta?.env?.VITE_COGNITO_POOL_ID || 'Not defined'
);
console.log(
  '- Cognito Client ID:',
  import.meta?.env?.VITE_COGNITO_WEB_CLIENT_ID || 'Not defined'
);
console.log('- Skip Auth:', import.meta?.env?.VITE_SKIP_AUTH || 'Not defined');

// Test 2: Check if Amplify is configured
import { Amplify } from 'aws-amplify';
try {
  const config = Amplify.getConfig();
  console.log('✅ Amplify is configured');
  console.log('- Auth Config Present:', !!config.Auth);
  console.log('- Cognito Pool ID:', config.Auth?.Cognito?.userPoolId);
  console.log('- Cognito Client ID:', config.Auth?.Cognito?.userPoolClientId);
} catch (error) {
  console.log('❌ Amplify configuration error:', error);
}

// Test 3: Check auth status
import { fetchAuthSession } from 'aws-amplify/auth';
async function checkAuthStatus() {
  try {
    const session = await fetchAuthSession();
    console.log('✅ Auth session retrieved');
    console.log('- Has tokens:', !!session.tokens);
    console.log('- ID Token present:', !!session.tokens?.idToken);
    console.log('- Access Token present:', !!session.tokens?.accessToken);

    const token = session.tokens?.idToken?.toString();
    if (token) {
      console.log('✅ JWT Token available (length:', token.length, ')');
      localStorage.setItem('ikusi.jwt', token);
      console.log('✅ Token saved to localStorage');
    } else {
      console.log('❌ No JWT token in session');
    }
  } catch (error) {
    console.log('❌ Auth session error:', error);
  }
}

// Test 4: Test API connectivity with auth headers
async function testAPIWithAuth() {
  console.log('🔗 Testing API connectivity with auth headers...');

  const token = localStorage.getItem('ikusi.jwt');
  if (!token) {
    console.log('❌ No auth token available for API test');
    return;
  }

  const apiUrl =
    import.meta?.env?.VITE_API_BASE_URL ||
    'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

  try {
    // Test health endpoint (no auth required)
    const healthResponse = await fetch(`${apiUrl}/health`);
    console.log(
      '- Health endpoint:',
      healthResponse.status,
      healthResponse.statusText
    );

    // Test protected endpoint with auth
    const projectsResponse = await fetch(`${apiUrl}/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log(
      '- Projects endpoint (with auth):',
      projectsResponse.status,
      projectsResponse.statusText
    );

    if (projectsResponse.ok) {
      console.log('✅ API calls with auth headers are working!');
    } else {
      console.log('❌ API calls still failing with auth headers');
    }
  } catch (error) {
    console.log('❌ API test error:', error);
  }
}

// Run tests
checkAuthStatus().then(() => {
  testAPIWithAuth();
});

export { checkAuthStatus, testAPIWithAuth };
