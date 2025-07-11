// test-api-auth-fixed.js
// Enhanced API authentication test with proper project ID

import { chromium } from 'playwright';

async function testAPIAuthFixed() {
  console.log('Testing API authentication with proper project ID...');
  
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
      projectsApiResult: null,
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
      
      // Try to get projects first (this doesn't need a project ID)
      if (window.getProjects) {
        try {
          const projects = await window.getProjects();
          results.projectsApiResult = 'SUCCESS';
          console.log('✅ Projects API call successful');
          console.log('Projects found:', projects?.length || 0);
          
          // If we have projects, try to get summary for the first one
          if (projects && projects.length > 0) {
            const firstProject = projects[0];
            const projectId = firstProject.project_id || firstProject.id;
            
            if (projectId && window.getSummary) {
              try {
                const summary = await window.getSummary(projectId);
                results.apiCallResult = 'SUCCESS';
                console.log('✅ Project summary API call successful');
              } catch (error) {
                results.apiCallResult = 'FAILED: ' + error.message;
                console.log('❌ Project summary API call failed:', error.message);
              }
            } else {
              results.apiCallResult = 'SKIPPED: No valid project ID found';
            }
          } else {
            results.apiCallResult = 'SKIPPED: No projects found';
          }
        } catch (error) {
          results.projectsApiResult = 'FAILED: ' + error.message;
          console.log('❌ Projects API call failed:', error.message);
        }
      } else {
        results.errors.push('getProjects function not available');
      }
      
    } catch (error) {
      results.errors.push('Evaluation error: ' + error.message);
    }
    
    return results;
  });

  console.log('\n=== ENHANCED API AUTH TEST RESULTS ===');
  console.log('AWS Config Loaded:', result.awsConfigLoaded ? '✅' : '❌');
  console.log('Auth Token Available:', result.authTokenAvailable ? '✅' : '❌');
  console.log('Projects API Result:', result.projectsApiResult || 'NOT TESTED');
  console.log('Project Summary API Result:', result.apiCallResult || 'NOT TESTED');
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(error => console.log('❌', error));
  }

  // If no auth token, check if we need to login
  if (!result.authTokenAvailable) {
    console.log('\n⚠️ No auth token found. Checking login functionality...');
    
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
  console.log('\nEnhanced test completed');
}

testAPIAuthFixed().catch(console.error);
