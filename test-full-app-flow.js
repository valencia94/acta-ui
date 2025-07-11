// test-full-app-flow.js
// Comprehensive test of the full application flow in production

import { chromium } from 'playwright';

async function testFullAppFlow() {
  console.log('🚀 COMPREHENSIVE PRODUCTION APP FLOW TEST');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 100
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track network requests
  const apiRequests = [];
  const failedRequests = [];
  
  page.on('request', request => {
    if (request.url().includes('execute-api') || request.url().includes('api')) {
      apiRequests.push({
        url: request.url(),
        method: request.method()
      });
    }
  });
  
  page.on('requestfailed', request => {
    failedRequests.push(request.url());
  });
  
  // Track console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Component') || text.includes('API') || text.includes('Error') || text.includes('Auth')) {
      console.log(`🔍 Console: ${text}`);
    }
  });

  try {
    // Step 1: Navigate to the site
    console.log('\n📍 STEP 1: Navigate to site');
    await page.goto('https://d7t9x3j66yd8k.cloudfront.net/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check what page we're on
    const currentState = await page.evaluate(() => ({
      url: window.location.href,
      title: document.title,
      hasLoginForm: !!document.querySelector('input[type="email"]'),
      hasDashboard: document.body.textContent.toLowerCase().includes('dashboard'),
      awsConfigExists: !!window.awsmobile
    }));
    
    console.log(`  Current URL: ${currentState.url}`);
    console.log(`  Page title: ${currentState.title}`);
    console.log(`  Has login form: ${currentState.hasLoginForm ? '✅' : '❌'}`);
    console.log(`  AWS config loaded: ${currentState.awsConfigExists ? '✅' : '❌'}`);
    
    // Step 2: Check available components/functions
    console.log('\n📍 STEP 2: Check available components and functions');
    
    const availableFunctions = await page.evaluate(() => {
      const globalFunctions = {};
      
      // Check for API functions
      const apiFunctions = ['getSummary', 'getTimeline', 'getDownloadUrl', 'sendApprovalEmail'];
      apiFunctions.forEach(func => {
        globalFunctions[func] = typeof window[func] === 'function';
      });
      
      // Check for utility functions  
      const utilFunctions = ['fetchWrapper', 'getAuthToken'];
      utilFunctions.forEach(func => {
        globalFunctions[func] = typeof window[func] === 'function';
      });
      
      return globalFunctions;
    });
    
    console.log('  Available Functions:');
    Object.entries(availableFunctions).forEach(([func, available]) => {
      console.log(`    ${func}: ${available ? '✅' : '❌'}`);
    });
    
    // Step 3: If on login page, try to proceed
    if (currentState.hasLoginForm) {
      console.log('\n📍 STEP 3: On login page - checking form functionality');
      
      // Check if form is interactive
      try {
        await page.fill('input[type="email"]', 'test@example.com');
        await page.fill('input[type="password"]', 'testpassword123');
        console.log('  ✅ Form fields can be filled');
        
        // Check if sign-in button becomes active
        const signInButton = page.locator('button:has-text("Sign In"), button[type="submit"]');
        const isEnabled = await signInButton.isEnabled();
        console.log(`  Sign In button enabled: ${isEnabled ? '✅' : '❌'}`);
        
        // NOTE: We won't actually submit since we don't have valid credentials
        console.log('  ℹ️ Skipping actual login (no valid credentials)');
        
      } catch (error) {
        console.log(`  ❌ Form interaction failed: ${error.message}`);
      }
    }
    
    // Step 4: Try to access protected routes directly (will redirect to login if not authed)
    console.log('\n📍 STEP 4: Test route accessibility');
    
    const routesToTest = ['/dashboard', '/admin'];
    
    for (const route of routesToTest) {
      try {
        console.log(`  Testing route: ${route}`);
        await page.goto(`https://d7t9x3j66yd8k.cloudfront.net${route}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        const routeState = await page.evaluate(() => ({
          currentPath: window.location.pathname,
          pageText: document.body.textContent.toLowerCase(),
          hasComponents: {
            dashboard: document.body.textContent.toLowerCase().includes('dashboard'),
            projects: document.body.textContent.toLowerCase().includes('project'),
            admin: document.body.textContent.toLowerCase().includes('admin'),
            table: !!document.querySelector('table, [role="table"]'),
            buttons: document.querySelectorAll('button').length > 0
          }
        }));
        
        console.log(`    Current path: ${routeState.currentPath}`);
        console.log(`    Components detected:`);
        Object.entries(routeState.hasComponents).forEach(([comp, present]) => {
          console.log(`      ${comp}: ${present ? '✅' : '❌'}`);
        });
        
      } catch (error) {
        console.log(`    ❌ Failed to test route ${route}: ${error.message}`);
      }
    }
    
    // Step 5: Network analysis
    console.log('\n📍 STEP 5: Network activity analysis');
    console.log(`  API requests made: ${apiRequests.length}`);
    if (apiRequests.length > 0) {
      apiRequests.forEach(req => {
        console.log(`    ${req.method} ${req.url}`);
      });
    }
    
    console.log(`  Failed requests: ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      failedRequests.forEach(url => {
        console.log(`    ❌ ${url}`);
      });
    }
    
    // Step 6: Bundle analysis
    console.log('\n📍 STEP 6: Runtime bundle analysis');
    
    const bundleAnalysis = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      const mainScript = scripts.find(s => s.src && s.src.includes('index-'));
      
      return {
        totalScripts: scripts.length,
        mainScriptSrc: mainScript?.src || 'Not found',
        scriptSizes: scripts.map(s => ({ src: s.src, hasContent: !!s.textContent })),
        windowObjectKeys: Object.keys(window).filter(key => 
          key.includes('react') || 
          key.includes('React') || 
          key.includes('aws') || 
          key.includes('AWS') ||
          key.includes('amplify') ||
          key.toLowerCase().includes('component')
        ).slice(0, 10) // First 10 relevant keys
      };
    });
    
    console.log(`  Total scripts loaded: ${bundleAnalysis.totalScripts}`);
    console.log(`  Main script: ${bundleAnalysis.mainScriptSrc}`);
    console.log(`  Relevant window keys: ${bundleAnalysis.windowObjectKeys.join(', ')}`);
    
    // Step 7: Final assessment
    console.log('\n📍 STEP 7: Final assessment');
    
    const finalAssessment = {
      siteLoads: true,
      awsConfigured: currentState.awsConfigExists,
      functionsAvailable: Object.values(availableFunctions).filter(Boolean).length,
      formsInteractive: currentState.hasLoginForm,
      networkRequestsWorking: apiRequests.length > 0 || failedRequests.length === 0,
      bundleLoaded: bundleAnalysis.totalScripts > 0
    };
    
    console.log('\n🎯 FINAL RESULTS:');
    console.log('=' .repeat(60));
    Object.entries(finalAssessment).forEach(([check, result]) => {
      const status = typeof result === 'boolean' ? (result ? '✅' : '❌') : `✅ (${result})`;
      console.log(`  ${check}: ${status}`);
    });
    
    // Calculate overall health score
    const healthChecks = [
      finalAssessment.siteLoads,
      finalAssessment.awsConfigured,
      finalAssessment.functionsAvailable > 4,
      finalAssessment.formsInteractive,
      finalAssessment.networkRequestsWorking,
      finalAssessment.bundleLoaded
    ];
    
    const healthScore = (healthChecks.filter(Boolean).length / healthChecks.length) * 100;
    
    console.log(`\n💚 OVERALL HEALTH SCORE: ${healthScore.toFixed(1)}%`);
    
    if (healthScore >= 90) {
      console.log('🎉 EXCELLENT: Production app is fully functional!');
    } else if (healthScore >= 70) {
      console.log('✅ GOOD: Production app is mostly working with minor issues.');
    } else if (healthScore >= 50) {
      console.log('⚠️ WARNING: Production app has significant issues.');
    } else {
      console.log('❌ CRITICAL: Production app has major problems.');
    }
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
  } finally {
    await browser.close();
  }
}

testFullAppFlow().catch(console.error);
