// quick-auth-test.js
// Quick test to verify the Amplify configuration fix

import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Quick authentication test after Amplify fix...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen for console messages to see if Amplify is configured
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Amplify') || text.includes('configured') || text.includes('auth')) {
      console.log('🔧 Amplify:', text);
    }
    if (text.includes('error') || text.includes('❌')) {
      console.log('❌ Error:', text);
    }
  });
  
  console.log('🌐 Navigating to production...');
  await page.goto('https://d7t9x3j66yd8k.cloudfront.net');
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Check if we're on login page
  const hasLogin = await page.$('input[type="email"]') && await page.$('input[type="password"]');
  
  if (hasLogin) {
    console.log('✅ Login page detected');
    
    // Check Amplify configuration in browser
    const amplifyStatus = await page.evaluate(() => {
      return {
        hasAwsmobile: !!window.awsmobile,
        amplifyConfigured: typeof window.AWS !== 'undefined' || typeof window.Amplify !== 'undefined'
      };
    });
    
    console.log('📊 Amplify Status:', amplifyStatus);
    
    // Try a quick login test
    console.log('🧪 Testing authentication...');
    await page.fill('input[type="email"]', 'christian.valencia@ikusi.com');
    await page.fill('input[type="password"]', 'PdYb7TU7HvBhYP7$!');
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait a bit to see what happens
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log('📍 After login attempt:', currentUrl);
    
    // Check for any success indicators
    const hasSuccess = await page.$('text=Dashboard') || 
                      await page.$('text=Projects for') ||
                      currentUrl.includes('/dashboard');
    
    if (hasSuccess) {
      console.log('🎉 LOGIN SUCCESS! Authentication is working!');
    } else {
      console.log('❌ Login still failing - checking for error messages...');
      
      // Check for specific error
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[role="alert"], .error, .error-message');
        return Array.from(errorElements).map(el => el.textContent).join(' ');
      });
      
      if (errorText) {
        console.log('🚨 Error message:', errorText);
      }
    }
    
  } else {
    console.log('❌ Login page not found');
  }
  
  // Keep browser open briefly for inspection
  await page.waitForTimeout(10000);
  await browser.close();
  
  console.log('🏁 Quick test completed');
  
})().catch(console.error);
