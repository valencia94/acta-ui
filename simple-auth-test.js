// simple-auth-test.js
// Run this script with: node simple-auth-test.js
// It will open a browser and test authentication

import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Starting authentication diagnosis...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to production
  console.log('🌐 Navigating to production site...');
  await page.goto('https://d7t9x3j66yd8k.cloudfront.net');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check what page we're on
  const title = await page.title();
  const url = page.url();
  console.log('📄 Page title:', title);
  console.log('🌐 Current URL:', url);
  
  // Check for AWS configuration
  const awsConfig = await page.evaluate(() => {
    return {
      hasAwsmobile: !!window.awsmobile,
      userPoolId: window.awsmobile?.aws_user_pools_id,
      clientId: window.awsmobile?.aws_user_pools_web_client_id,
      region: window.awsmobile?.aws_project_region,
      oauth: window.awsmobile?.oauth
    };
  });
  
  console.log('⚙️ AWS Configuration status:');
  console.log('  - Has awsmobile:', awsConfig.hasAwsmobile ? '✅' : '❌');
  console.log('  - User Pool ID:', awsConfig.userPoolId || '❌ Missing');
  console.log('  - Client ID:', awsConfig.clientId || '❌ Missing');
  console.log('  - Region:', awsConfig.region || '❌ Missing');
  console.log('  - OAuth domain:', awsConfig.oauth?.domain || '❌ Missing');
  
  // Check for login form elements
  const hasEmailInput = await page.$('input[type="email"], input[placeholder*="email" i]') !== null;
  const hasPasswordInput = await page.$('input[type="password"]') !== null;
  const hasSignInButton = await page.$('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]') !== null;
  
  console.log('\n🔐 Login form elements:');
  console.log('  - Email input:', hasEmailInput ? '✅' : '❌');
  console.log('  - Password input:', hasPasswordInput ? '✅' : '❌');
  console.log('  - Sign in button:', hasSignInButton ? '✅' : '❌');
  
  // Check for any immediate console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  if (hasEmailInput && hasPasswordInput && hasSignInButton) {
    console.log('\n🧪 Testing authentication with demo credentials...');
    
    // Use test credentials (create a test account if needed)
    await page.fill('input[type="email"], input[placeholder*="email" i]', 'test@ikusi.com');
    await page.fill('input[type="password"]', 'TestPassword123!');
    
    console.log('🔘 Clicking sign in button...');
    
    // Click sign in and wait for response
    await page.click('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]');
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    const newUrl = page.url();
    const newTitle = await page.title();
    
    console.log('\n📍 After login attempt:');
    console.log('  - New URL:', newUrl);
    console.log('  - New title:', newTitle);
    
    // Check for error messages
    const errorElement = await page.$('.error, [class*="error"], [data-testid*="error"], [role="alert"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error displayed:', errorText);
    }
    
    // Check localStorage for auth tokens
    const authInfo = await page.evaluate(() => {
      return {
        jwtToken: localStorage.getItem('ikusi.jwt'),
        cognitoTokens: Object.keys(localStorage).filter(key => key.includes('CognitoIdentityServiceProvider')),
        hasAmplifyTokens: Object.keys(localStorage).some(key => key.includes('amplify'))
      };
    });
    
    console.log('\n🔑 Authentication tokens:');
    console.log('  - JWT token:', authInfo.jwtToken ? '✅ Present' : '❌ Missing');
    console.log('  - Cognito tokens:', authInfo.cognitoTokens.length);
    console.log('  - Amplify tokens:', authInfo.hasAmplifyTokens ? '✅' : '❌');
    
  } else {
    console.log('\n❌ Login form incomplete - cannot test authentication');
  }
  
  // Print any console errors
  if (errors.length > 0) {
    console.log('\n🔴 Console Errors:');
    errors.forEach(error => console.log('  ❌', error));
  } else {
    console.log('\n✅ No console errors detected');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'auth-diagnosis.png', fullPage: true });
  console.log('\n📸 Screenshot saved as auth-diagnosis.png');
  
  console.log('\n🏁 Authentication diagnosis complete');
  console.log('💡 Keep browser open to investigate further...');
  
  // Keep browser open for manual inspection
  await page.waitForTimeout(30000);
  
  await browser.close();
})().catch(console.error);
