// test-api-direct.js
// Direct test of API endpoints with authentication

import { chromium } from 'playwright';

async function testAPIDirect() {
  console.log('Testing API endpoints directly...');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to production and login
  await page.goto('https://d7t9x3j66yd8k.cloudfront.net/login');
  await page.waitForLoadState('networkidle');
  
  // Fill in credentials
  await page.fill('input[type="email"]', 'christian.valencia@ikusi.com');
  await page.fill('input[type="password"]', 'PdYb7TU7HvBhYP7$!');
  
  // Submit login
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  
  // Wait for dashboard to load
  await page.waitForTimeout(5000);
  
  // Test API calls directly in browser
  const apiTest = await page.evaluate(async () => {
    const results = {
      token: null,
      healthTest: null,
      pmAllProjectsTest: null,
      errors: []
    };
    
    try {
      // Get auth token
      if (window.getAuthToken) {
        try {
          const token = await window.getAuthToken();
          results.token = token ? 'Available' : 'Not available';
          
          if (token) {
            console.log('🔐 Token available, testing API calls...');
            
            // Test health endpoint (no auth required)
            try {
              const healthResponse = await fetch('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health');
              results.healthTest = {
                status: healthResponse.status,
                success: healthResponse.ok,
                data: await healthResponse.text()
              };
              console.log('✅ Health API test:', results.healthTest);
            } catch (error) {
              results.healthTest = { error: error.message };
            }
            
            // Test pm-manager/all-projects (requires auth)
            try {
              const pmResponse = await fetch('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/pm-manager/all-projects', {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              const responseText = await pmResponse.text();
              results.pmAllProjectsTest = {
                status: pmResponse.status,
                success: pmResponse.ok,
                data: responseText.substring(0, 500) // Limit response size
              };
              console.log('✅ PM All Projects API test:', results.pmAllProjectsTest);
            } catch (error) {
              results.pmAllProjectsTest = { error: error.message };
              console.error('❌ PM All Projects API error:', error);
            }
          }
        } catch (error) {
          results.errors.push('Failed to get auth token: ' + error.message);
        }
      } else {
        results.errors.push('getAuthToken function not available');
      }
      
    } catch (error) {
      results.errors.push('Test error: ' + error.message);
    }
    
    return results;
  });
  
  console.log('\n=== API DIRECT TEST RESULTS ===');
  console.log('Auth Token:', apiTest.token);
  console.log('Health Test:', apiTest.healthTest);
  console.log('PM All Projects Test:', apiTest.pmAllProjectsTest);
  
  if (apiTest.errors.length > 0) {
    console.log('\nErrors:');
    apiTest.errors.forEach(error => console.log('❌', error));
  }
  
  await browser.close();
}

testAPIDirect().catch(console.error);
