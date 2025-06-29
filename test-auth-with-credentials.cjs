#!/usr/bin/env node

/**
 * ACTA-UI Authentication Test with Real Credentials
 * 
 * Tests the complete authentication flow with real user credentials
 * to identify and fix authentication issues
 */

const https = require('https');
const puppeteer = require('puppeteer');

// Configuration
const FRONTEND_URL = 'https://d7t9x3j66yd8k.cloudfront.net';
const API_BASE = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

// Test credentials (to be read from environment)
const TEST_EMAIL = process.env.ACTA_UI_USER;
const TEST_PASSWORD = process.env.ACTA_UI_PW;

async function testAuthenticationFlow() {
  console.log('🔐 Starting Real Authentication Test...\n');
  
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.error('❌ Missing credentials: ACTA_UI_USER and ACTA_UI_PW environment variables required');
    return false;
  }
  
  console.log(`📧 Testing with email: ${TEST_EMAIL}`);
  
  let browser;
  try {
    // Launch browser in visible mode for debugging
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      devtools: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1200,800'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    // Enhanced console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`🚨 Browser Error: ${text}`);
      } else if (type === 'warn') {
        console.log(`⚠️  Browser Warning: ${text}`);
      } else if (text.includes('Auth') || text.includes('authentication') || text.includes('token')) {
        console.log(`🔐 Auth Log: ${text}`);
      }
    });
    
    // Capture network failures
    page.on('requestfailed', request => {
      console.log(`❌ Network Failed: ${request.url()} - ${request.failure().errorText}`);
    });
    
    // Navigate to the app
    console.log(`🌐 Navigating to ${FRONTEND_URL}...`);
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait a moment for the page to fully load
    await page.waitForTimeout(3000);
    
    // Check initial auth state
    console.log('\n🔍 Checking initial authentication state...');
    const initialAuthState = await page.evaluate(() => {
      // Check if there's any auth debug info
      const debugElement = document.querySelector('.fixed.bottom-4.right-4');
      return {
        hasDebugInfo: !!debugElement,
        debugText: debugElement ? debugElement.textContent : null,
        hasLoginForm: !!document.querySelector('form'),
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        currentUrl: window.location.href
      };
    });
    
    console.log('Initial State:', initialAuthState);
    
    if (initialAuthState.debugText) {
      console.log('🔍 Auth Debug Info:', initialAuthState.debugText);
    }
    
    // Look for login form
    if (!initialAuthState.hasLoginForm) {
      console.log('❌ No login form found. Checking for other auth elements...');
      
      // Check for Amplify Auth components
      const authComponents = await page.evaluate(() => {
        const selectors = [
          'amplify-authenticator',
          '[data-amplify-authenticator]',
          '.amplify-authenticator',
          'amplify-sign-in',
          '[data-amplify-sign-in]'
        ];
        
        return selectors.map(selector => ({
          selector,
          found: !!document.querySelector(selector)
        }));
      });
      
      console.log('Auth Components:', authComponents);
      
      // Take screenshot of current state
      await page.screenshot({ path: './auth-state-no-form.png' });
      console.log('📸 Screenshot saved: auth-state-no-form.png');
      
      return false;
    }
    
    // Fill in login credentials
    console.log('\n📝 Filling in login credentials...');
    
    // Wait for email input and fill it
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', TEST_EMAIL);
    console.log(`✅ Email entered: ${TEST_EMAIL}`);
    
    // Wait for password input and fill it
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    await page.type('input[type="password"]', TEST_PASSWORD);
    console.log(`✅ Password entered`);
    
    // Take screenshot before submitting
    await page.screenshot({ path: './auth-before-submit.png' });
    console.log('📸 Pre-submit screenshot saved');
    
    // Find and click submit button
    console.log('\n🚀 Submitting login form...');
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
      console.log('❌ Submit button not found. Looking for other buttons...');
      const allButtons = await page.$$('button');
      console.log(`Found ${allButtons.length} buttons`);
      
      // Try to find a button with login text
      const loginButton = await page.$('button:contains("Sign In"), button:contains("Login"), button:contains("Sign in")');
      if (loginButton) {
        await loginButton.click();
        console.log('✅ Clicked login button');
      } else {
        // Click the first button as fallback
        if (allButtons.length > 0) {
          await allButtons[0].click();
          console.log('✅ Clicked first available button');
        }
      }
    } else {
      await submitButton.click();
      console.log('✅ Clicked submit button');
    }
    
    // Wait for navigation or auth state change
    console.log('\n⏳ Waiting for authentication to complete...');
    await page.waitForTimeout(5000);
    
    // Check for navigation or auth state change
    const currentUrl = await page.url();
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Check post-login state
    const postLoginState = await page.evaluate(() => {
      const debugElement = document.querySelector('.fixed.bottom-4.right-4');
      return {
        hasDebugInfo: !!debugElement,
        debugText: debugElement ? debugElement.textContent : null,
        hasLoginForm: !!document.querySelector('form'),
        hasEmailInput: !!document.querySelector('input[type="email"]'),
        hasPasswordInput: !!document.querySelector('input[type="password"]'),
        currentUrl: window.location.href,
        bodyText: document.body.textContent.substring(0, 500)
      };
    });
    
    console.log('\n🔍 Post-login state:', postLoginState);
    
    if (postLoginState.debugText) {
      console.log('🔍 Updated Auth Debug Info:', postLoginState.debugText);
    }
    
    // Check if we're authenticated
    const isAuthenticated = !postLoginState.hasLoginForm || 
                          postLoginState.debugText?.includes('authenticated') ||
                          !postLoginState.hasEmailInput;
    
    console.log(`🔐 Authentication Status: ${isAuthenticated ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Take post-login screenshot
    await page.screenshot({ path: './auth-after-submit.png' });
    console.log('📸 Post-login screenshot saved');
    
    // If authenticated, test API calls
    if (isAuthenticated) {
      console.log('\n🧪 Testing authenticated API calls...');
      
      const apiTest = await page.evaluate(async (apiBase) => {
        try {
          // Test authenticated endpoint
          const response = await fetch(`${apiBase}/projects`);
          const data = await response.text();
          
          return {
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            data: data.substring(0, 200),
            headers: Object.fromEntries(response.headers.entries())
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      }, API_BASE);
      
      console.log('API Test Result:', apiTest);
      
      if (apiTest.success) {
        console.log('✅ Authenticated API call successful');
      } else {
        console.log('❌ Authenticated API call failed');
      }
    }
    
    // Keep browser open for manual inspection
    console.log('\n⏸️  Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    
    return isAuthenticated;
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function diagnoseAuthIssues() {
  console.log('\n🔍 Diagnosing Authentication Issues...\n');
  
  // Test 1: Check if Cognito is properly configured
  console.log('1. Testing Cognito Configuration...');
  // This would require testing the Cognito endpoints directly
  
  // Test 2: Check API Gateway CORS
  console.log('2. Testing API Gateway CORS...');
  const corsTest = await new Promise((resolve) => {
    const req = https.request(`${API_BASE}/health`, {
      method: 'OPTIONS',
      timeout: 5000
    }, (res) => {
      resolve({
        status: res.statusCode,
        headers: res.headers
      });
    });
    req.on('error', () => resolve({ error: true }));
    req.end();
  });
  
  console.log('CORS Test:', corsTest);
  
  // Test 3: Check if environment variables are being loaded
  console.log('3. Environment Variables Check...');
  console.log(`   ACTA_UI_USER: ${TEST_EMAIL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   ACTA_UI_PW: ${TEST_PASSWORD ? '✅ Set' : '❌ Missing'}`);
  
  return {
    corsSupported: corsTest.status === 200 || corsTest.status === 204,
    credentialsAvailable: !!(TEST_EMAIL && TEST_PASSWORD)
  };
}

// Main execution
async function main() {
  console.log('🚀 ACTA-UI Authentication Diagnostic Suite\n');
  console.log('=========================================\n');
  
  // First, run diagnostics
  const diagnostics = await diagnoseAuthIssues();
  
  if (!diagnostics.credentialsAvailable) {
    console.error('❌ Cannot proceed without credentials. Please set ACTA_UI_USER and ACTA_UI_PW environment variables.');
    process.exit(1);
  }
  
  // Run authentication test
  const authSuccess = await testAuthenticationFlow();
  
  console.log('\n📊 Final Test Results:');
  console.log('======================');
  console.log(`Authentication Flow: ${authSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CORS Support: ${diagnostics.corsSupported ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Credentials Available: ${diagnostics.credentialsAvailable ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!authSuccess) {
    console.log('\n🔧 Recommended Actions:');
    console.log('1. Check browser console for JavaScript errors');
    console.log('2. Verify Cognito configuration in aws-exports.js');
    console.log('3. Check if Amplify Auth is properly initialized');
    console.log('4. Verify CORS settings on API Gateway');
    console.log('5. Check CloudFront cache settings');
    console.log('\nScreenshots saved for visual debugging:');
    console.log('- auth-state-no-form.png (if no form found)');
    console.log('- auth-before-submit.png (before login attempt)');
    console.log('- auth-after-submit.png (after login attempt)');
  }
  
  process.exit(authSuccess ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { testAuthenticationFlow, diagnoseAuthIssues };
