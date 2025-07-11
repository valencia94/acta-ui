// test-api-simple.js
// Simple test to check API connectivity with available functions

import { chromium } from 'playwright';

async function testAPISimple() {
  console.log('Testing API connectivity...');
  
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

  // Test API functions
  const result = await page.evaluate(async () => {
    const results = {
      functionsAvailable: [],
      apiTests: {},
      errors: []
    };
    
    try {
      // Check which functions are available
      const functions = ['getSummary', 'getTimeline', 'getDownloadUrl', 'sendApprovalEmail', 'getProjectsByPM', 'getAllProjects', 'getAuthToken'];
      
      functions.forEach(func => {
        if (typeof window[func] === 'function') {
          results.functionsAvailable.push(func);
        }
      });
      
      console.log('Available functions:', results.functionsAvailable);
      
      // Test getAllProjects (doesn't need parameters)
      if (window.getAllProjects) {
        try {
          console.log('Testing getAllProjects...');
          const projects = await window.getAllProjects();
          results.apiTests.getAllProjects = {
            success: true,
            data: projects?.length ? `Found ${projects.length} projects` : 'No projects found'
          };
          console.log('✅ getAllProjects successful:', projects?.length || 0, 'projects');
        } catch (error) {
          results.apiTests.getAllProjects = {
            success: false,
            error: error.message
          };
          console.log('❌ getAllProjects failed:', error.message);
        }
      }
      
      // Test getAuthToken
      if (window.getAuthToken) {
        try {
          console.log('Testing getAuthToken...');
          const token = await window.getAuthToken();
          results.apiTests.getAuthToken = {
            success: true,
            data: token ? 'Token available' : 'No token'
          };
          console.log('✅ getAuthToken successful:', !!token);
        } catch (error) {
          results.apiTests.getAuthToken = {
            success: false,
            error: error.message
          };
          console.log('❌ getAuthToken failed:', error.message);
        }
      }
      
    } catch (error) {
      results.errors.push('Evaluation error: ' + error.message);
    }
    
    return results;
  });

  console.log('\n=== SIMPLE API TEST RESULTS ===');
  console.log('Functions Available:', result.functionsAvailable.length);
  result.functionsAvailable.forEach(func => console.log('  ✅', func));
  
  console.log('\nAPI Tests:');
  Object.entries(result.apiTests).forEach(([test, result]) => {
    console.log(`  ${result.success ? '✅' : '❌'} ${test}:`, result.data || result.error);
  });
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(error => console.log('❌', error));
  }

  await browser.close();
  console.log('\nSimple test completed');
}

testAPISimple().catch(console.error);
