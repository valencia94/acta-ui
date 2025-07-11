// test-components-production.js
// Quick test to verify specific components are working in production

import { chromium } from 'playwright';

async function testComponentsInProduction() {
  console.log('🧪 TESTING COMPONENTS IN PRODUCTION');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 50
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Add console listeners
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('aws-exports') || text.includes('Critical functions found')) {
      console.log('ℹ️', text);
    }
  });

  try {
    // Navigate to the site
    console.log('🌐 Navigating to production site...');
    await page.goto('https://d7t9x3j66yd8k.cloudfront.net/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check for critical components in the page
    const componentCheck = await page.evaluate(() => {
      const results = {
        uiElements: {},
        criticalFunctions: {},
        reactComponents: {}
      };
      
      // Check for UI elements that indicate components are rendered
      results.uiElements = {
        loginForm: !!document.querySelector('form input[type="email"]'),
        passwordField: !!document.querySelector('input[type="password"]'),
        signInButton: !!document.querySelector('button[type="submit"]') || !!document.querySelector('button'),
        logo: !!document.querySelector('img[alt*="logo"]') || !!document.querySelector('img[src*="logo"]'),
        navigation: !!document.querySelector('nav') || !!document.querySelector('header')
      };
      
      // Check for critical functions in window
      results.criticalFunctions = {
        getSummary: typeof window.getSummary === 'function',
        getTimeline: typeof window.getTimeline === 'function',
        getDownloadUrl: typeof window.getDownloadUrl === 'function',
        sendApprovalEmail: typeof window.sendApprovalEmail === 'function',
        fetchWrapper: typeof window.fetchWrapper === 'function',
        getAuthToken: typeof window.getAuthToken === 'function'
      };
      
      // Check for React component indicators
      const allScripts = Array.from(document.scripts)
        .map(script => script.textContent)
        .join('');
      
      results.reactComponents = {
        reactPresent: allScripts.includes('React') || allScripts.includes('__react'),
        routerPresent: allScripts.includes('Router') || allScripts.includes('navigate'),
        amplifyPresent: allScripts.includes('Amplify') || allScripts.includes('aws-amplify'),
        framerMotionPresent: allScripts.includes('motion') || allScripts.includes('framer')
      };
      
      return results;
    });
    
    // Display results
    console.log('\n🎨 UI ELEMENTS CHECK:');
    Object.entries(componentCheck.uiElements).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value ? 'Present' : 'Missing'}`);
    });
    
    console.log('\n🔧 CRITICAL FUNCTIONS CHECK:');
    Object.entries(componentCheck.criticalFunctions).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value ? 'Available' : 'Missing'}`);
    });
    
    console.log('\n⚛️ REACT COMPONENTS CHECK:');
    Object.entries(componentCheck.reactComponents).forEach(([key, value]) => {
      console.log(`  ${value ? '✅' : '❌'} ${key}: ${value ? 'Present' : 'Missing'}`);
    });
    
    // Check AWS configuration
    const awsCheck = await page.evaluate(() => {
      return {
        awsmobileExists: typeof window.awsmobile !== 'undefined',
        userPoolId: window.awsmobile?.aws_user_pools_id,
        clientId: window.awsmobile?.aws_user_pools_web_client_id,
        apiEndpoint: window.awsmobile?.aws_cloud_logic_custom?.[0]?.endpoint
      };
    });
    
    console.log('\n🔐 AWS CONFIGURATION CHECK:');
    console.log(`  ${awsCheck.awsmobileExists ? '✅' : '❌'} awsmobile object: ${awsCheck.awsmobileExists ? 'Present' : 'Missing'}`);
    if (awsCheck.awsmobileExists) {
      console.log(`  ✅ User Pool ID: ${awsCheck.userPoolId}`);
      console.log(`  ✅ Client ID: ${awsCheck.clientId}`);
      console.log(`  ✅ API Endpoint: ${awsCheck.apiEndpoint}`);
    }
    
    // Check if we can interact with the login form
    console.log('\n🔄 INTERACTION TEST:');
    
    const isLoginPage = await page.isVisible('input[type="email"]') && 
                        await page.isVisible('input[type="password"]');
    
    if (isLoginPage) {
      console.log('  ✅ Login form is interactive');
      
      // Try filling the form
      try {
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'testpassword');
        console.log('  ✅ Form fields can be filled');
        
        // Check if button becomes enabled or shows sign-in capability
        const signInButton = await page.locator('button:has-text("Sign In"), button[type="submit"]');
        const isEnabled = await signInButton.isEnabled();
        console.log(`  ${isEnabled ? '✅' : '⚠️'} Sign In button: ${isEnabled ? 'Enabled' : 'Disabled'}`);
        
      } catch (error) {
        console.log('  ❌ Form interaction failed:', error.message);
      }
    } else {
      console.log('  ❌ Login form not detected');
    }
    
    // Summary
    const totalUIElements = Object.values(componentCheck.uiElements).filter(Boolean).length;
    const totalFunctions = Object.values(componentCheck.criticalFunctions).filter(Boolean).length;
    const totalReactComponents = Object.values(componentCheck.reactComponents).filter(Boolean).length;
    
    console.log('\n📊 SUMMARY:');
    console.log('=' .repeat(50));
    console.log(`UI Elements: ${totalUIElements}/${Object.keys(componentCheck.uiElements).length} working`);
    console.log(`Critical Functions: ${totalFunctions}/${Object.keys(componentCheck.criticalFunctions).length} available`);
    console.log(`React Components: ${totalReactComponents}/${Object.keys(componentCheck.reactComponents).length} present`);
    console.log(`AWS Configuration: ${awsCheck.awsmobileExists ? 'Working' : 'Failed'}`);
    
    const overallScore = (totalUIElements + totalFunctions + totalReactComponents + (awsCheck.awsmobileExists ? 1 : 0)) / 
                        (Object.keys(componentCheck.uiElements).length + Object.keys(componentCheck.criticalFunctions).length + Object.keys(componentCheck.reactComponents).length + 1);
    
    const grade = overallScore >= 0.9 ? 'A' : overallScore >= 0.8 ? 'B' : overallScore >= 0.7 ? 'C' : overallScore >= 0.6 ? 'D' : 'F';
    
    console.log(`\n🎯 OVERALL GRADE: ${grade} (${Math.round(overallScore * 100)}%)`);
    
    if (grade >= 'B') {
      console.log('🎉 SUCCESS: Components are working well in production!');
    } else {
      console.log('⚠️ WARNING: Some issues detected with components in production.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testComponentsInProduction().catch(console.error);
