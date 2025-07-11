// test-auth-flow.js
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Check if a JWT token is expired
 */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const isExpired = now >= exp;

    if (isExpired) {
      console.log(
        '⏰ Token is expired:',
        new Date(exp),
        'vs now:',
        new Date(now)
      );
    } else {
      console.log('✅ Token is valid until:', new Date(exp));
    }

    return isExpired;
  } catch (error) {
    console.error('❌ Failed to parse token:', error);
    return true; // Assume expired if can't parse
  }
}

/**
 * Refreshes the token in the background without blocking
 * Helps ensure we always have a fresh token
 */
async function refreshTokenInBackground() {
  try {
    console.log('🔄 Background token refresh started');
    const session = await fetchAuthSession({ forceRefresh: true });
    if (session.tokens?.idToken) {
      const token = session.tokens.idToken.toString();
      localStorage.setItem('ikusi.jwt', token);
      console.log('✅ Background token refresh succeeded');
    }
  } catch (error) {
    console.log('⚠️ Background token refresh failed:', error);
  }
}

/**
 * Get the current authentication token with retry logic
 */
async function getAuthToken() {
  try {
    console.log('🔍 Getting auth token...');

    // Step 1: Try to get token from localStorage first for debugging
    const localToken = localStorage.getItem('ikusi.jwt');
    if (localToken) {
      console.log('🔄 Found token in localStorage, checking validity...');
      if (!isTokenExpired(localToken)) {
        console.log('✅ Local token is still valid, using it');
        // Still get a fresh token in the background for future use
        refreshTokenInBackground();
        return localToken;
      } else {
        console.log('⚠️ Local token expired, getting fresh one...');
      }
    } else {
      console.log('⚠️ No token in localStorage');
    }

    // Step 2: Always get fresh token from Amplify session when needed
    console.log('🔄 Fetching fresh token from Amplify...');
    const session = await fetchAuthSession({ forceRefresh: true });
    console.log('📋 Auth session:', {
      hasTokens: !!session.tokens,
      hasIdToken: !!session.tokens?.idToken,
      hasAccessToken: !!session.tokens?.accessToken,
    });

    if (!session.tokens?.idToken) {
      console.warn(
        '❌ No ID token available in session - user may need to re-login'
      );
      return null;
    }

    const token = session.tokens.idToken.toString();
    console.log('✅ Fresh token retrieved from Amplify, length:', token.length);
    
    // Debug token parts
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      try {
        const header = JSON.parse(atob(tokenParts[0]));
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('🔍 Token header:', header);
        console.log('🔍 Token payload:', {
          sub: payload.sub,
          email: payload.email,
          exp: new Date(payload.exp * 1000).toISOString(),
        });
      } catch (e) {
        console.log('⚠️ Could not parse token parts');
      }
    }

    // Update localStorage with fresh token
    localStorage.setItem('ikusi.jwt', token);

    return token;
  } catch (error) {
    console.error('❌ Failed to get auth token:', error);
    console.error('🔧 User may need to re-login');
    return null;
  }
}

/**
 * Core fetch wrapper that throws on non-OK and parses JSON.
 * Automatically includes authentication headers when available.
 */
async function fetcher(input, init = {}) {
  console.log('🌐 Starting API call to:', input);
  const url = typeof input === 'string' ? input : input.url;
  console.log('🌐 URL:', url);

  // Get authentication token - force refresh for protected API calls
  const token = await getAuthToken();

  // Prepare headers
  const headers = new Headers(init?.headers);

  // Add authentication header if token is available
  if (token) {
    // Always include 'Bearer' prefix for API Gateway requests
    // API Gateway expects this format with Cognito authorizers
    headers.set('Authorization', `Bearer ${token}`);
    console.log('✅ Auth header added with Bearer prefix');
    
    // Debug the Authorization header
    console.log('📡 Making request with headers:', {
      'Authorization': `Bearer ${token.substring(0, 20)}...`,
      'Content-Type': headers.get('Content-Type'),
      'Accept': headers.get('Accept')
    });
  } else {
    console.warn('❌ No auth token available - API call will likely fail with 401');
  }

  // Add default headers
  if (!headers.has('Content-Type') && init?.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const enhancedInit = {
    ...init,
    headers,
    // Always use 'include' for AWS services to ensure cookies are sent
    // This is required for API Gateway with Cognito authorizers
    credentials: 'include',
  };

  // Debug the full request
  console.log('📝 Request details:', {
    url,
    method: enhancedInit.method || 'GET',
    headers: Object.fromEntries(headers.entries()),
    credentials: enhancedInit.credentials,
    hasBody: !!enhancedInit.body,
  });

  try {
    const res = await fetch(input, enhancedInit);
    
    // Log response headers for debugging
    const responseHeaders = {};
    res.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    console.log('📥 Response:', {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders
    });

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      let errorBody = null;

      try {
        // Try to parse as JSON first
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // Clone the response before reading it
          const clonedRes = res.clone();
          errorBody = await clonedRes.json();
          errorMessage += ` - ${JSON.stringify(errorBody)}`;
        } else {
          const errorText = await res.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
            try {
              // Try to parse the text as JSON anyway
              errorBody = JSON.parse(errorText);
            } catch (e) {
              // Not JSON, keep as text
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }

      // Add context for common error scenarios
      if (res.status === 401) {
        console.error('🚨 401 Unauthorized - token issue detected');
        console.log('🔄 Attempting token refresh...');
        
        // Try to refresh the token
        await getAuthToken();
        
        errorMessage += ' (Authentication expired - please retry after page refresh)';
      } else if (res.status === 403) {
        errorMessage += ' (Insufficient permissions - check role/claims in token)';
      } else if (res.status === 502) {
        errorMessage += ' (Backend Lambda function error)';
      } else if (res.status === 404) {
        errorMessage += ' (Endpoint not found)';
      }

      console.error('❌ API call failed:', errorMessage);
      throw new Error(errorMessage);
    }

    const data = await res.json();
    console.log('✅ API call successful, data:', data);

    return data;
  } catch (error) {
    console.error('❌ Network or fetch error:', error);
    throw error;
  }
}

/**
 * Convenience function for GET requests
 */
async function get(url) {
  return fetcher(url, { method: 'GET' });
}

/**
 * Convenience function for POST requests
 */
async function post(url, data) {
  return fetcher(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Test the auth flow in a browser environment
import { chromium } from 'playwright';

async function testAuthFlow() {
  console.log('Starting auth flow test...');
  
  // Launch the browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Add console event listeners
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Failed to fetch')) {
      console.log('🚨 FETCH ERROR DETECTED:', text);
    } else if (text.includes('error') || text.includes('❌')) {
      console.log('⚠️ Console error:', text);
    } else if (text.includes('aws-exports') || text.includes('cognito')) {
      console.log('ℹ️ Auth related:', text);
    }
  });
  
  try {
    // Navigate to the site
    console.log('Navigating to production site...');
    await page.goto('https://d7t9x3j66yd8k.cloudfront.net/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if we're at the login page
    const isLoginPage = await page.isVisible('input[type="email"]') && 
                        await page.isVisible('input[type="password"]') && 
                        await page.isVisible('button:has-text("Sign In")');
    
    if (isLoginPage) {
      console.log('✅ Login page detected, testing authentication flow...');
      
      // Inject the auth flow test code
      await page.evaluate(() => {
        window.testAuthFlowResults = {
          awsExportsPresent: typeof awsmobile !== 'undefined',
          amplifyPresent: typeof Amplify !== 'undefined',
          fetchAuthSessionPresent: typeof fetchAuthSession === 'function',
          errors: []
        };
        
        try {
          console.log('🔍 Testing if aws-exports.js is loaded');
          if (typeof awsmobile !== 'undefined') {
            console.log('✅ aws-exports.js is loaded:', JSON.stringify({
              region: awsmobile.aws_project_region,
              userPoolId: awsmobile.aws_user_pools_id,
              webClientId: awsmobile.aws_user_pools_web_client_id
            }));
          } else {
            console.log('❌ aws-exports.js is NOT loaded');
            window.testAuthFlowResults.errors.push('aws-exports.js not loaded');
          }
        } catch (e) {
          console.log('❌ Error checking aws-exports.js:', e);
          window.testAuthFlowResults.errors.push('Error checking aws-exports: ' + e.message);
        }
        
        try {
          console.log('🔍 Testing if Amplify is configured');
          if (typeof Amplify !== 'undefined') {
            console.log('✅ Amplify is available');
          } else {
            console.log('❌ Amplify is NOT available');
            window.testAuthFlowResults.errors.push('Amplify not available');
          }
        } catch (e) {
          console.log('❌ Error checking Amplify:', e);
          window.testAuthFlowResults.errors.push('Error checking Amplify: ' + e.message);
        }
        
        try {
          console.log('🔍 Testing if fetchAuthSession is available');
          if (typeof fetchAuthSession === 'function') {
            console.log('✅ fetchAuthSession function is available');
          } else {
            console.log('❌ fetchAuthSession function is NOT available');
            window.testAuthFlowResults.errors.push('fetchAuthSession not available');
          }
        } catch (e) {
          console.log('❌ Error checking fetchAuthSession:', e);
          window.testAuthFlowResults.errors.push('Error checking fetchAuthSession: ' + e.message);
        }
      });
      
      // Get the test results
      const testResults = await page.evaluate(() => window.testAuthFlowResults);
      
      console.log('\n🔍 Auth Flow Test Results:');
      console.log('------------------------');
      console.log('AWS Exports Present:', testResults.awsExportsPresent ? '✅ YES' : '❌ NO');
      console.log('Amplify Present:', testResults.amplifyPresent ? '✅ YES' : '❌ NO');
      console.log('fetchAuthSession Present:', testResults.fetchAuthSessionPresent ? '✅ YES' : '❌ NO');
      
      if (testResults.errors.length > 0) {
        console.log('\n❌ Errors found:');
        testResults.errors.forEach((err, i) => console.log(`${i+1}. ${err}`));
      }
      
      // Try the login process
      console.log('\nAttempting login...');
      await page.fill('input[type="email"]', 'christian.valencia@ikusi.com');
      await page.fill('input[type="password"]', 'PdYb7TU7HvBhYP7$!');
      
      try {
        await Promise.all([
          page.waitForResponse(
            response => response.url().includes('cognito') && response.status() === 200, 
            { timeout: 30000 }
          ),
          page.click('button:has-text("Sign In")')
        ]);
        
        console.log('✅ Sign-in button clicked, waiting for response...');
        
        // Wait for dashboard to load
        await page.waitForTimeout(5000);
        
        // Check if login was successful
        const dashboardLoaded = await page.isVisible('text=Dashboard') || 
                               await page.isVisible('text=Projects for') ||
                               await page.isVisible('button:has-text("Generate ACTA")');
        
        if (dashboardLoaded) {
          console.log('✅ Login successful! Dashboard loaded.');
          
          // Test fetching protected API
          await page.evaluate(async () => {
            try {
              console.log('🌐 Testing API call...');
              // Use the injected fetchWrapper
              const response = await fetch('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health', {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('ikusi.jwt')}`
                },
                credentials: 'include'
              });
              
              console.log('📥 API Response status:', response.status);
              const data = await response.json();
              console.log('📥 API Response data:', data);
              
              return { success: response.ok, status: response.status, data };
            } catch (error) {
              console.error('❌ API call failed:', error);
              return { success: false, error: error.toString() };
            }
          });
        } else {
          console.log('❌ Login failed. Dashboard not loaded.');
          
          // Check for error messages
          const errorElements = await page.$$eval('.error-message, .alert-error, [role="alert"]', 
            elements => elements.map(el => el.textContent));
            
          if (errorElements.length > 0) {
            console.log('🚨 Error messages found:');
            errorElements.forEach(msg => console.log(`  - ${msg}`));
          }
        }
      } catch (error) {
        console.log('❌ Login process failed:', error.message);
      }
    } else {
      console.log('❌ Login page not detected!');
    }
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Take a screenshot for review
    await page.screenshot({ path: 'auth-flow-test.png' });
    
    // Close the browser
    await browser.close();
    console.log('Auth flow testing completed');
  }
}

// Run the auth flow test
testAuthFlow().catch(console.error);
