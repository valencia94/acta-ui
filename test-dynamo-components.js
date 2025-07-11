// test-dynamo-components.js
// Test specifically for DynamoDB/PM components in production

import { chromium } from 'playwright';

async function testDynamoComponents() {
  console.log('🧪 TESTING DYNAMO/PM COMPONENTS IN PRODUCTION');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Add console listeners for debugging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('PM') || text.includes('Dynamo') || text.includes('Project') || text.includes('Error')) {
      console.log('🔍', text);
    }
  });

  try {
    // Navigate to the site
    console.log('🌐 Navigating to production site...');
    await page.goto('https://d7t9x3j66yd8k.cloudfront.net/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check initial state
    console.log('\n📋 CHECKING INITIAL DASHBOARD STATE...');
    
    // Look for PM/Dynamo specific elements
    const initialCheck = await page.evaluate(() => {
      return {
        hasProjectElements: !!document.querySelector('[data-testid*="project"], .project, [class*="project"], [id*="project"]'),
        hasDynamoElements: !!document.querySelector('[data-testid*="dynamo"], .dynamo, [class*="dynamo"], [id*="dynamo"]'),
        hasPMElements: !!document.querySelector('[data-testid*="pm"], .pm, [class*="pm"], [id*="pm"]'),
        hasTableElements: !!document.querySelector('table, [role="table"], .table, [class*="table"]'),
        hasLoadingElements: !!document.querySelector('[data-testid*="loading"], .loading, [class*="loading"]'),
        hasErrorElements: !!document.querySelector('[data-testid*="error"], .error, [class*="error"]'),
        textContent: document.body.textContent.toLowerCase()
      };
    });
    
    console.log('Element Detection Results:');
    console.log(`  Projects: ${initialCheck.hasProjectElements ? '✅' : '❌'}`);
    console.log(`  Dynamo: ${initialCheck.hasDynamoElements ? '✅' : '❌'}`);
    console.log(`  PM: ${initialCheck.hasPMElements ? '✅' : '❌'}`);
    console.log(`  Tables: ${initialCheck.hasTableElements ? '✅' : '❌'}`);
    console.log(`  Loading: ${initialCheck.hasLoadingElements ? '✅' : '❌'}`);
    console.log(`  Errors: ${initialCheck.hasErrorElements ? '✅' : '❌'}`);
    
    // Check for key text indicators
    const keyWords = ['project', 'dynamo', 'manager', 'table', 'loading', 'error', 'pm'];
    console.log('\nText Content Analysis:');
    keyWords.forEach(word => {
      const found = initialCheck.textContent.includes(word);
      console.log(`  "${word}": ${found ? '✅' : '❌'}`);
    });
    
    // If we're on the login page, try to see what happens after login simulation
    const isOnLogin = await page.isVisible('input[type="email"]');
    if (isOnLogin) {
      console.log('\n🔐 On login page - checking for post-login component readiness...');
      
      // Check if the login page has any references to components that will load
      const loginPageCode = await page.evaluate(() => {
        const scripts = Array.from(document.scripts).map(s => s.textContent).join('');
        return {
          hasDashboardRef: scripts.includes('Dashboard') || scripts.includes('dashboard'),
          hasDynamoRef: scripts.includes('Dynamo') || scripts.includes('dynamo'),
          hasPMRef: scripts.includes('PM') || scripts.includes('ProjectManager'),
          hasTableRef: scripts.includes('Table') || scripts.includes('table')
        };
      });
      
      console.log('Login Page Component References:');
      Object.entries(loginPageCode).forEach(([key, value]) => {
        console.log(`  ${key}: ${value ? '✅' : '❌'}`);
      });
    }
    
    // Check for any errors in the console
    console.log('\n🐛 CHECKING FOR ERRORS...');
    
    // Get any network failures
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });
    
    await page.waitForTimeout(2000);
    
    if (failedRequests.length > 0) {
      console.log('❌ Failed Network Requests:');
      failedRequests.forEach(url => console.log(`  - ${url}`));
    } else {
      console.log('✅ No failed network requests detected');
    }
    
    // Check window object for component functions
    const windowCheck = await page.evaluate(() => {
      const components = ['DynamoProjectsView', 'ProjectTable', 'PMProjectManager'];
      const results = {};
      
      // Check if any component-related globals exist
      components.forEach(comp => {
        results[comp] = {
          asFunction: typeof window[comp] === 'function',
          asProperty: comp in window,
          inObjectKeys: Object.keys(window).some(key => key.includes(comp.toLowerCase()))
        };
      });
      
      return results;
    });
    
    console.log('\n🪟 WINDOW OBJECT COMPONENT CHECK:');
    Object.entries(windowCheck).forEach(([comp, checks]) => {
      const hasAny = Object.values(checks).some(Boolean);
      console.log(`  ${comp}: ${hasAny ? '✅' : '❌'}`);
      if (hasAny) {
        Object.entries(checks).forEach(([checkType, result]) => {
          if (result) console.log(`    ↳ ${checkType}: true`);
        });
      }
    });
    
    console.log('\n✅ Component detection test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testDynamoComponents().catch(console.error);
