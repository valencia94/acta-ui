// test-api-auth.js
// Simple script to test API authentication in production

import { chromium } from 'playwright';

async function testAPIAuth() {
  console.log('Testing API authentication...');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console messages
  page.on('console', msg => {
    console.log('Browser:', msg.text());
  });

  // Navigate to the production site
  await page.goto('https://d7t9x3j66yd8k.cloudfront.net/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Test authentication and API calls
  const result = await page.evaluate(async () => {
    const results = {
      awsConfigLoaded: false,
      authTokenAvailable: false,
      apiCallResult: null,
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
      
      // Try to get authentication token
      if (window.getAuthToken) {
        const token = await window.getAuthToken();
        results.authTokenAvailable = !!token;
        console.log('Auth token available:', !!token);
        
        if (token) {
          console.log('Token preview:', token.substring(0, 20) + '...');
        }
      } else {
        results.errors.push('getAuthToken function not available');
      }
      
      // Try to make an API call
      if (window.getSummary) {
        try {
          const summary = await window.getSummary();
          results.apiCallResult = 'SUCCESS';
          console.log('✅ API call successful');
        } catch (error) {
          results.apiCallResult = 'FAILED: ' + error.message;
          console.log('❌ API call failed:', error.message);
        }
      } else {
        results.errors.push('getSummary function not available');
      }
      
    } catch (error) {
      results.errors.push('Evaluation error: ' + error.message);
    }
    
    return results;
  });

  console.log('\n=== API AUTH TEST RESULTS ===');
  console.log('AWS Config Loaded:', result.awsConfigLoaded ? '✅' : '❌');
  console.log('Auth Token Available:', result.authTokenAvailable ? '✅' : '❌');
  console.log('API Call Result:', result.apiCallResult || 'NOT TESTED');
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(error => console.log('❌', error));
  }

  // If no auth token, check if we need to login
  if (!result.authTokenAvailable) {
    console.log('\n⚠️ No auth token found. Checking login page...');
    
    // Try to navigate to login page
    await page.goto('https://d7t9x3j66yd8k.cloudfront.net/login');
    await page.waitForLoadState('networkidle');
    
    // Check if login form is present
    const loginForm = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passwordInput = document.querySelector('input[type="password"]');
      const submitButton = document.querySelector('button[type="submit"]');
      
      return {
        hasEmailInput: !!emailInput,
        hasPasswordInput: !!passwordInput,
        hasSubmitButton: !!submitButton,
        loginFormPresent: !!(emailInput && passwordInput && submitButton)
      };
    });
    
    console.log('Login form present:', loginForm.loginFormPresent ? '✅' : '❌');
    console.log('- Email input:', loginForm.hasEmailInput ? '✅' : '❌');
    console.log('- Password input:', loginForm.hasPasswordInput ? '✅' : '❌');
    console.log('- Submit button:', loginForm.hasSubmitButton ? '✅' : '❌');
  }

  await browser.close();
  console.log('\nTest completed');
}

testAPIAuth().catch(console.error);
