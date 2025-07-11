// test-cognito-auth.js
// Comprehensive test for Cognito authentication integration

import { chromium } from 'playwright';

async function testCognitoAuth() {
  console.log('🧪 Testing Cognito authentication integration...');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🔐') || text.includes('Cognito') || text.includes('Authentication')) {
      console.log('🔐 Auth:', text);
    } else if (text.includes('❌') || text.includes('Failed') || text.includes('error')) {
      console.log('❌ Error:', text);
    }
  });

  // Navigate to the production site
  await page.goto('https://d7t9x3j66yd8k.cloudfront.net/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(5000);

  // Test the enhanced authentication flow
  const result = await page.evaluate(async () => {
    const results = {
      awsConfigLoaded: false,
      cognitoUserLoaded: false,
      apiAuthenticationWorking: false,
      authTokenAvailable: false,
      apiCallResults: [],
      errors: []
    };
    
    try {
      // Check if AWS config is loaded
      if (typeof window.awsmobile !== 'undefined') {
        results.awsConfigLoaded = true;
        console.log('✅ AWS config loaded');
      } else {
        results.errors.push('AWS config not loaded');
      }
      
      // Test getCurrentUser (new Cognito function)
      if (window.getCurrentUser) {
        try {
          const user = await window.getCurrentUser();
          results.cognitoUserLoaded = !!user;
          console.log('Cognito user:', user);
        } catch (error) {
          results.errors.push('getCurrentUser failed: ' + error.message);
        }
      } else {
        results.errors.push('getCurrentUser function not available');
      }
      
      // Test authentication token
      if (window.getAuthToken) {
        try {
          const token = await window.getAuthToken();
          results.authTokenAvailable = !!token;
          console.log('Auth token available:', !!token);
        } catch (error) {
          results.errors.push('getAuthToken failed: ' + error.message);
        }
      } else {
        results.errors.push('getAuthToken function not available');
      }
      
      // Test API calls with Cognito authentication
      const testEndpoints = [
        { name: 'getSummary', func: window.getSummary, params: ['1000000064013473'] },
        { name: 'getTimeline', func: window.getTimeline, params: ['1000000064013473'] },
        { name: 'fetchWrapper', func: window.fetchWrapper, params: ['/health'] }
      ];
      
      for (const endpoint of testEndpoints) {
        if (endpoint.func) {
          try {
            const result = await endpoint.func(...endpoint.params);
            results.apiCallResults.push({
              endpoint: endpoint.name,
              status: 'SUCCESS',
              hasData: !!result
            });
            console.log(`✅ ${endpoint.name} successful`);
          } catch (error) {
            results.apiCallResults.push({
              endpoint: endpoint.name,
              status: 'FAILED',
              error: error.message
            });
            console.log(`❌ ${endpoint.name} failed:`, error.message);
          }
        } else {
          results.errors.push(`${endpoint.name} function not available`);
        }
      }
      
      // Check if any API call succeeded (indicates authentication is working)
      results.apiAuthenticationWorking = results.apiCallResults.some(r => r.status === 'SUCCESS');
      
    } catch (error) {
      results.errors.push('Evaluation error: ' + error.message);
    }
    
    return results;
  });

  console.log('\n=== COGNITO AUTH TEST RESULTS ===');
  console.log('AWS Config Loaded:', result.awsConfigLoaded ? '✅' : '❌');
  console.log('Cognito User Loaded:', result.cognitoUserLoaded ? '✅' : '❌');
  console.log('Auth Token Available:', result.authTokenAvailable ? '✅' : '❌');
  console.log('API Authentication Working:', result.apiAuthenticationWorking ? '✅' : '❌');
  
  console.log('\n=== API CALL RESULTS ===');
  result.apiCallResults.forEach(api => {
    console.log(`${api.endpoint}: ${api.status === 'SUCCESS' ? '✅' : '❌'} ${api.status}`);
    if (api.error) {
      console.log(`  Error: ${api.error}`);
    }
  });
  
  if (result.errors.length > 0) {
    console.log('\n=== ERRORS ===');
    result.errors.forEach(error => console.log('❌', error));
  }

  // Overall assessment
  const authWorking = result.awsConfigLoaded && result.apiAuthenticationWorking;
  console.log('\n=== ASSESSMENT ===');
  if (authWorking) {
    console.log('✅ SUCCESS: Cognito authentication is working properly!');
    console.log('   - AWS config loaded');
    console.log('   - API calls are authenticated');
    console.log('   - Dashboard should now work correctly');
  } else {
    console.log('❌ ISSUES: Cognito authentication needs attention');
    console.log('   - Check if user is signed in');
    console.log('   - Verify Cognito configuration');
    console.log('   - Check API Gateway permissions');
  }

  // Keep browser open for manual testing
  console.log('\n⏳ Browser will remain open for manual testing...');
  console.log('   - Try signing in if not already signed in');
  console.log('   - Test the dashboard features');
  console.log('   - Check browser console for auth messages');
  
  await page.waitForTimeout(60000); // Wait 60 seconds for manual testing
  await browser.close();
  console.log('\nTest completed');
}

testCognitoAuth().catch(console.error);
