// api-connectivity-test.js
// Comprehensive API and Hooks Testing Script
// Run this with: node api-connectivity-test.js

import { chromium } from 'playwright';

async function testAPIConnectivity() {
  console.log('🔌 Starting API Connectivity & Hooks Testing...');
  console.log('='.repeat(60));
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 200
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enhanced logging for API calls
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('execute-api')) {
      console.log(`🌐 API Response: ${status} ${response.statusText()} - ${url}`);
      if (status >= 400) {
        console.log(`🚨 API ERROR: ${status} for ${url}`);
      }
    }
  });
  
  page.on('requestfailed', request => {
    if (request.url().includes('execute-api')) {
      console.log(`🚨 API REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
    }
  });
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('API') || text.includes('fetch') || text.includes('token') || text.includes('auth')) {
      console.log(`📋 Console: ${text}`);
    }
  });

  try {
    // Step 1: Navigate and login
    console.log('🌐 Navigating to production site...');
    await page.goto('https://d7t9x3j66yd8k.cloudfront.net/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"]', 'christian.valencia@ikusi.com');
    await page.fill('input[type="password"]', 'PdYb7TU7HvBhYP7$!');
    await page.click('button:has-text("Sign In")');
    
    // Wait for dashboard to load
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForTimeout(15000); // Longer wait for proper initialization
    
    console.log('\n🧪 COMPREHENSIVE API TESTING');
    console.log('='.repeat(40));
    
    // Test 1: Check Authentication Token
    console.log('\n1️⃣ Testing Authentication Token...');
    const tokenTest = await page.evaluate(async () => {
      try {
        // Check if we have a token in localStorage
        const localToken = localStorage.getItem('ikusi.jwt');
        console.log('🔍 Local token exists:', !!localToken);
        console.log('🔍 Local token length:', localToken ? localToken.length : 0);
        
        // Try to get fresh token from AWS Amplify
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession();
        const awsToken = session.tokens?.idToken?.toString();
        
        return {
          hasLocalToken: !!localToken,
          localTokenLength: localToken ? localToken.length : 0,
          hasAWSToken: !!awsToken,
          awsTokenLength: awsToken ? awsToken.length : 0,
          tokensMatch: localToken === awsToken
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 Token Test Results:', tokenTest);
    
    // Test 2: Test API Health Endpoint
    console.log('\n2️⃣ Testing API Health Endpoint...');
    const healthTest = await page.evaluate(async () => {
      try {
        const response = await fetch('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health');
        const data = await response.json();
        return {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 Health Test Results:', healthTest);
    
    // Test 3: Test Authenticated API Call
    console.log('\n3️⃣ Testing Authenticated API Call...');
    const authAPITest = await page.evaluate(async () => {
      try {
        const token = localStorage.getItem('ikusi.jwt');
        if (!token) {
          return { error: 'No token available' };
        }
        
        const response = await fetch('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/pm-manager/all-projects', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = await response.text();
        }
        
        return {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 Authenticated API Test Results:', authAPITest);
    
    // Test 4: Test API Hooks (if available)
    console.log('\n4️⃣ Testing API Hooks Integration...');
    const hooksTest = await page.evaluate(async () => {
      try {
        // Check if the API functions are available in the global scope
        const results = {
          apiHelpers: {},
          fetchWrapper: false,
          authToken: false
        };
        
        // Check for common API functions
        const apiFunctions = [
          'getProjectsByPM',
          'generateActaDocument', 
          'getS3DownloadUrl',
          'sendApprovalEmail',
          'checkDocumentInS3'
        ];
        
        for (const funcName of apiFunctions) {
          if (window[funcName]) {
            results.apiHelpers[funcName] = 'Available in global scope';
          } else {
            results.apiHelpers[funcName] = 'Not in global scope';
          }
        }
        
        // Check for fetch wrapper
        if (window.fetchWrapper || window.fetch) {
          results.fetchWrapper = true;
        }
        
        // Check for auth token helper
        if (window.getAuthToken) {
          results.authToken = 'Available';
          try {
            const token = await window.getAuthToken();
            results.authTokenResult = !!token;
          } catch (e) {
            results.authTokenResult = e.message;
          }
        }
        
        return results;
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 Hooks Test Results:', hooksTest);
    
    // Test 5: Test Project Loading Function
    console.log('\n5️⃣ Testing Project Loading Function...');
    const projectTest = await page.evaluate(async () => {
      try {
        // Try to call the project loading directly if available
        const userEmail = 'christian.valencia@ikusi.com';
        const isAdmin = true;
        
        // Test with manual API call
        const token = localStorage.getItem('ikusi.jwt');
        const apiUrl = `https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/pm-projects/${encodeURIComponent(userEmail)}`;
        
        console.log('🔍 Testing URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = await response.text();
        }
        
        return {
          status: response.status,
          dataType: typeof data,
          dataLength: Array.isArray(data) ? data.length : 'not array',
          data: Array.isArray(data) ? data.slice(0, 2) : data, // First 2 items for inspection
          url: apiUrl
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 Project Loading Test Results:', projectTest);
    
    // Test 6: Check Dashboard Component State
    console.log('\n6️⃣ Testing Dashboard Component State...');
    const dashboardTest = await page.evaluate(() => {
      const results = {
        projectCount: 0,
        hasProjectTable: false,
        hasActionButtons: false,
        buttonTypes: []
      };
      
      // Count project rows
      const projectRows = document.querySelectorAll('table tbody tr');
      results.projectCount = projectRows.length;
      
      // Check for project table
      results.hasProjectTable = !!document.querySelector('table');
      
      // Check for action buttons
      const buttons = document.querySelectorAll('button');
      results.hasActionButtons = buttons.length > 0;
      results.buttonTypes = Array.from(buttons).map(btn => btn.textContent?.trim()).filter(Boolean);
      
      return results;
    });
    
    console.log('📊 Dashboard State Test Results:', dashboardTest);
    
    // Test 7: CORS and Headers Check
    console.log('\n7️⃣ Testing CORS and Headers...');
    const corsTest = await page.evaluate(async () => {
      try {
        // Test a simple OPTIONS request to check CORS
        const response = await fetch('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health', {
          method: 'OPTIONS'
        });
        
        return {
          status: response.status,
          corsHeaders: {
            'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
            'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
            'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
            'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
          }
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📊 CORS Test Results:', corsTest);
    
    // Test 8: Network Performance
    console.log('\n8️⃣ Testing Network Performance...');
    const performanceTest = await page.evaluate(() => {
      const entries = performance.getEntries();
      const apiRequests = entries.filter(entry => 
        entry.name.includes('execute-api') && entry.entryType === 'resource'
      );
      
      return {
        totalNetworkRequests: entries.length,
        apiRequestCount: apiRequests.length,
        apiRequests: apiRequests.map(req => ({
          url: req.name,
          duration: Math.round(req.duration),
          size: req.transferSize || 0,
          status: req.responseStatus || 'unknown'
        }))
      };
    });
    
    console.log('📊 Performance Test Results:', performanceTest);
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
  } finally {
    // Take screenshot for review
    await page.screenshot({ path: 'api-connectivity-test.png', fullPage: true });
    
    console.log('\n📊 FINAL API CONNECTIVITY ASSESSMENT');
    console.log('='.repeat(50));
    
    // Generate final assessment
    const finalAssessment = await page.evaluate(() => {
      return {
        currentUrl: window.location.href,
        hasToken: !!localStorage.getItem('ikusi.jwt'),
        dashboardLoaded: window.location.pathname === '/dashboard',
        projectTablePresent: !!document.querySelector('table'),
        actionButtonsPresent: document.querySelectorAll('button').length > 5,
        awsConfigLoaded: typeof window.awsmobile !== 'undefined'
      };
    });
    
    console.log('🔍 Final System State:', finalAssessment);
    
    // Grade the system
    let score = 0;
    const criteria = [
      finalAssessment.hasToken,
      finalAssessment.dashboardLoaded,
      finalAssessment.awsConfigLoaded
    ];
    
    score = criteria.filter(Boolean).length;
    
    const grade = score === 3 ? 'A+ (Excellent)' :
                  score === 2 ? 'B+ (Good)' :
                  score === 1 ? 'C+ (Needs Work)' : 'F (Critical Issues)';
                  
    console.log(`\n📊 OVERALL API CONNECTIVITY GRADE: ${grade}`);
    console.log(`📊 Score: ${score}/3 criteria met`);
    
    await browser.close();
    console.log('\n✅ API Connectivity Testing Complete!');
  }
}

// Run the test
testAPIConnectivity().catch(console.error);
