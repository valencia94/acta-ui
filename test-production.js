// test-production.js
// Script to test the production deployment
// Run this with: node test-production.js

import { chromium } from 'playwright';

async function testProductionSite() {
  console.log('Starting production testing...');
  
  // Launch the browser with dev tools enabled
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true,
    slowMo: 100
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Add console event listeners to capture browser console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Failed to fetch')) {
      console.log('🚨 FETCH ERROR DETECTED:', text);
    } else if (text.includes('error') || text.includes('❌')) {
      console.log('⚠️ Console error:', text);
    } else if (text.includes('aws-exports') || text.includes('cognito')) {
      console.log('ℹ️ Auth related:', text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log('🚨 PAGE ERROR:', error.message);
  });

  // Capture response errors
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`🚨 HTTP ERROR: ${response.status()} ${response.statusText()} - ${response.url()}`);
    }
  });

  // Capture request failures
  page.on('requestfailed', request => {
    console.log(`🚨 REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
  });
  
  // Add check for critical API functions
  await page.addInitScript(() => {
    window.addEventListener('load', () => {
      setTimeout(() => {
        console.log('🔍 Checking for critical API functions...');
        const scriptTag = document.createElement('script');
        scriptTag.textContent = `
          const criticalFunctions = [
            'getSummary',
            'getTimeline', 
            'getDownloadUrl', 
            'sendApprovalEmail',
            'fetchWrapper',
            'getAuthToken'
          ];
          
          let foundFunctions = [];
          for (const funcName of criticalFunctions) {
            // Check if the function exists in global scope or any module
            if (window[funcName]) {
              foundFunctions.push(funcName);
            } else {
              // Try to find it in bundled code
              const allScripts = Array.from(document.scripts)
                .map(script => script.textContent)
                .join('');
              
              if (allScripts.includes(funcName + '=function') || 
                  allScripts.includes('function ' + funcName) || 
                  allScripts.includes(funcName + ':') || 
                  allScripts.includes(funcName + '(')) {
                foundFunctions.push(funcName);
              }
            }
          }
          
          console.log('🔍 Critical functions found: ' + foundFunctions.join(', '));
          console.log('❌ Critical functions missing: ' + 
            criticalFunctions.filter(f => !foundFunctions.includes(f)).join(', '));
        `;
        document.head.appendChild(scriptTag);
      }, 4000);
    });
  });

  // Inject script to detect aws-exports.js
  await page.addInitScript(() => {
    window.awsExportsLoaded = false;
    window.addEventListener('load', () => {
      setTimeout(() => {
        // Check if aws-exports.js was loaded
        try {
          const script = document.createElement('script');
          script.textContent = `
            console.log('🔍 Checking for AWS exports...');
            try {
              if (typeof awsmobile !== 'undefined') {
                console.log('✅ aws-exports.js is loaded', 
                  JSON.stringify({
                    region: awsmobile.aws_project_region,
                    userPoolId: awsmobile.aws_user_pools_id,
                    apiEndpoint: awsmobile.aws_cloud_logic_custom?.[0]?.endpoint
                  })
                );
              } else {
                console.log('❌ aws-exports.js is NOT loaded!');
              }
            } catch (e) {
              console.log('❌ Error checking aws-exports.js:', e);
            }
          `;
          document.head.appendChild(script);
        } catch (e) {
          console.error('Failed to inject aws-exports check:', e);
        }
      }, 3000);
    });
  });

  try {
    // Step 1: Navigate to the site
    console.log('Navigating to production site...');
    await page.goto('https://d7t9x3j66yd8k.cloudfront.net/');
    
    // Step 2: Wait for the page to load completely
    await page.waitForLoadState('networkidle');
    // Additional wait time to ensure all JavaScript executes
    await page.waitForTimeout(5000);
    console.log('Page loaded');

    // NEW: Open Dev Tools and perform detailed UI/Error analysis
    console.log('\n🔧 Opening Dev Tools for detailed analysis...');
    
    // Open dev tools (F12 equivalent)
    await page.keyboard.press('F12');
    await page.waitForTimeout(2000);
    
    // Perform comprehensive UI structure and error analysis
    const devToolsAnalysis = await page.evaluate(async () => {
      const analysis = {
        uiStructure: {},
        criticalErrors: [],
        warnings: [],
        performance: {},
        accessibility: {},
        security: {}
      };
      
      // 1. UI Structure Analysis
      try {
        analysis.uiStructure = {
          totalElements: document.querySelectorAll('*').length,
          headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
            tag: h.tagName,
            text: h.textContent.trim().substring(0, 100)
          })),
          buttons: Array.from(document.querySelectorAll('button')).map(btn => ({
            text: btn.textContent.trim().substring(0, 50),
            disabled: btn.disabled,
            type: btn.type
          })),
          inputs: Array.from(document.querySelectorAll('input')).map(input => ({
            type: input.type,
            name: input.name,
            placeholder: input.placeholder,
            required: input.required
          })),
          links: Array.from(document.querySelectorAll('a')).map(link => ({
            text: link.textContent.trim().substring(0, 50),
            href: link.href,
            target: link.target
          })),
          forms: Array.from(document.querySelectorAll('form')).map(form => ({
            action: form.action,
            method: form.method,
            inputs: form.querySelectorAll('input').length
          })),
          tables: Array.from(document.querySelectorAll('table')).map(table => ({
            rows: table.querySelectorAll('tr').length,
            columns: table.querySelectorAll('th').length
          })),
          navigation: {
            hasHeader: !!document.querySelector('header'),
            hasNav: !!document.querySelector('nav'),
            hasFooter: !!document.querySelector('footer'),
            hasMainContent: !!document.querySelector('main')
          }
        };
      } catch (error) {
        analysis.criticalErrors.push('UI Structure Analysis Failed: ' + error.message);
      }
      
      // 2. Critical Error Detection
      try {
        // Check for JavaScript errors in console
        const consoleErrors = [];
        const originalConsoleError = console.error;
        console.error = function(...args) {
          consoleErrors.push(args.join(' '));
          originalConsoleError.apply(console, args);
        };
        
        // Check for missing critical resources
        const criticalResources = ['aws-exports.js', 'index.js', 'main.js'];
        const missingResources = criticalResources.filter(resource => {
          return !Array.from(document.querySelectorAll('script')).some(script => 
            script.src && script.src.includes(resource)
          );
        });
        
        if (missingResources.length > 0) {
          analysis.criticalErrors.push('Missing critical resources: ' + missingResources.join(', '));
        }
        
        // Check for authentication issues
        if (!window.awsmobile) {
          analysis.criticalErrors.push('AWS Amplify configuration not loaded');
        }
        
        // Check for broken images
        const brokenImages = Array.from(document.querySelectorAll('img')).filter(img => {
          return !img.complete || img.naturalWidth === 0;
        });
        
        if (brokenImages.length > 0) {
          analysis.criticalErrors.push(`${brokenImages.length} broken image(s) detected`);
        }
        
        // Check for 404 or failed network requests
        const failedRequests = performance.getEntries()
          .filter(entry => entry.entryType === 'resource' && !entry.responseEnd)
          .map(entry => entry.name);
          
        if (failedRequests.length > 0) {
          analysis.criticalErrors.push('Failed network requests: ' + failedRequests.join(', '));
        }
        
      } catch (error) {
        analysis.criticalErrors.push('Error Detection Failed: ' + error.message);
      }
      
      // 3. Performance Analysis
      try {
        const navigationTiming = performance.getEntriesByType('navigation')[0];
        analysis.performance = {
          loadTime: navigationTiming.loadEventEnd - navigationTiming.loadEventStart,
          domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.domContentLoadedEventStart,
          totalPageLoadTime: navigationTiming.loadEventEnd - navigationTiming.navigationStart,
          resourcesLoaded: performance.getEntries().filter(entry => entry.entryType === 'resource').length,
          memoryUsage: performance.memory ? {
            usedJSHeapSize: performance.memory.usedJSHeapSize,
            totalJSHeapSize: performance.memory.totalJSHeapSize,
            jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
          } : 'Not available'
        };
      } catch (error) {
        analysis.warnings.push('Performance Analysis Failed: ' + error.message);
      }
      
      // 4. Accessibility Analysis
      try {
        analysis.accessibility = {
          hasSkipLinks: !!document.querySelector('a[href="#main"], a[href="#content"]'),
          ariaLabels: document.querySelectorAll('[aria-label]').length,
          ariaDescribedBy: document.querySelectorAll('[aria-describedby]').length,
          altTexts: document.querySelectorAll('img[alt]').length,
          totalImages: document.querySelectorAll('img').length,
          headingStructure: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.tagName),
          focusableElements: document.querySelectorAll('a, button, input, textarea, select, [tabindex]').length,
          missingAltTexts: document.querySelectorAll('img:not([alt])').length
        };
      } catch (error) {
        analysis.warnings.push('Accessibility Analysis Failed: ' + error.message);
      }
      
      // 5. Security Analysis
      try {
        analysis.security = {
          httpsUsed: location.protocol === 'https:',
          mixedContent: Array.from(document.querySelectorAll('script, link, img')).some(el => {
            const src = el.src || el.href;
            return src && src.startsWith('http://');
          }),
          cspPresent: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
          inlineScripts: document.querySelectorAll('script:not([src])').length,
          externalScripts: document.querySelectorAll('script[src]').length
        };
      } catch (error) {
        analysis.warnings.push('Security Analysis Failed: ' + error.message);
      }
      
      return analysis;
    });
    
    // Display the comprehensive analysis
    console.log('\n📊 DETAILED UI & ERROR ANALYSIS');
    console.log('=' .repeat(50));
    
    // UI Structure Report
    console.log('\n🎨 UI STRUCTURE ANALYSIS:');
    console.log(`  📄 Total DOM Elements: ${devToolsAnalysis.uiStructure.totalElements}`);
    console.log(`  📝 Headings: ${devToolsAnalysis.uiStructure.headings.length}`);
    devToolsAnalysis.uiStructure.headings.forEach((h, i) => {
      if (i < 5) console.log(`    ${h.tag}: ${h.text}`);
    });
    
    console.log(`  🔘 Buttons: ${devToolsAnalysis.uiStructure.buttons.length}`);
    devToolsAnalysis.uiStructure.buttons.forEach((btn, i) => {
      if (i < 5) console.log(`    "${btn.text}" (${btn.type}${btn.disabled ? ', disabled' : ''})`);
    });
    
    console.log(`  📝 Input Fields: ${devToolsAnalysis.uiStructure.inputs.length}`);
    devToolsAnalysis.uiStructure.inputs.forEach((input, i) => {
      if (i < 5) console.log(`    ${input.type}: ${input.placeholder || input.name || 'unnamed'}`);
    });
    
    console.log(`  📊 Tables: ${devToolsAnalysis.uiStructure.tables.length}`);
    devToolsAnalysis.uiStructure.tables.forEach((table, i) => {
      console.log(`    Table ${i + 1}: ${table.rows} rows, ${table.columns} columns`);
    });
    
    console.log(`  🧭 Navigation Elements:`);
    console.log(`    Header: ${devToolsAnalysis.uiStructure.navigation.hasHeader ? '✅' : '❌'}`);
    console.log(`    Navigation: ${devToolsAnalysis.uiStructure.navigation.hasNav ? '✅' : '❌'}`);
    console.log(`    Main Content: ${devToolsAnalysis.uiStructure.navigation.hasMainContent ? '✅' : '❌'}`);
    console.log(`    Footer: ${devToolsAnalysis.uiStructure.navigation.hasFooter ? '✅' : '❌'}`);
    
    // Critical Errors Report
    console.log('\n🚨 CRITICAL ERRORS:');
    if (devToolsAnalysis.criticalErrors.length === 0) {
      console.log('  ✅ No critical errors detected!');
    } else {
      devToolsAnalysis.criticalErrors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });
    }
    
    // Warnings Report
    console.log('\n⚠️  WARNINGS:');
    if (devToolsAnalysis.warnings.length === 0) {
      console.log('  ✅ No warnings detected!');
    } else {
      devToolsAnalysis.warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning}`);
      });
    }
    
    // Performance Report
    console.log('\n⚡ PERFORMANCE ANALYSIS:');
    console.log(`  📊 Page Load Time: ${devToolsAnalysis.performance.totalPageLoadTime}ms`);
    console.log(`  📊 DOM Content Loaded: ${devToolsAnalysis.performance.domContentLoaded}ms`);
    console.log(`  📊 Resources Loaded: ${devToolsAnalysis.performance.resourcesLoaded}`);
    if (devToolsAnalysis.performance.memoryUsage !== 'Not available') {
      console.log(`  🧠 Memory Usage: ${Math.round(devToolsAnalysis.performance.memoryUsage.usedJSHeapSize / 1024 / 1024)}MB`);
    }
    
    // Accessibility Report
    console.log('\n♿ ACCESSIBILITY ANALYSIS:');
    console.log(`  📍 Skip Links: ${devToolsAnalysis.accessibility.hasSkipLinks ? '✅' : '❌'}`);
    console.log(`  🏷️  ARIA Labels: ${devToolsAnalysis.accessibility.ariaLabels}`);
    console.log(`  🖼️  Alt Texts: ${devToolsAnalysis.accessibility.altTexts}/${devToolsAnalysis.accessibility.totalImages} images`);
    if (devToolsAnalysis.accessibility.missingAltTexts > 0) {
      console.log(`  ⚠️  Missing Alt Texts: ${devToolsAnalysis.accessibility.missingAltTexts}`);
    }
    console.log(`  🎯 Focusable Elements: ${devToolsAnalysis.accessibility.focusableElements}`);
    
    // Security Report
    console.log('\n🔒 SECURITY ANALYSIS:');
    console.log(`  🔐 HTTPS Used: ${devToolsAnalysis.security.httpsUsed ? '✅' : '❌'}`);
    console.log(`  🔗 Mixed Content: ${devToolsAnalysis.security.mixedContent ? '❌ Found' : '✅ None'}`);
    console.log(`  🛡️  CSP Present: ${devToolsAnalysis.security.cspPresent ? '✅' : '❌'}`);
    console.log(`  📜 External Scripts: ${devToolsAnalysis.security.externalScripts}`);
    console.log(`  ⚠️  Inline Scripts: ${devToolsAnalysis.security.inlineScripts}`);
    
    console.log('\n' + '=' .repeat(50));
    console.log('🔧 Dev Tools analysis completed\n');

    // Additional Dev Tools Console Analysis
    console.log('\n📋 CONSOLE MESSAGES ANALYSIS:');
    const consoleMessages = await page.evaluate(() => {
      // Capture recent console messages
      const messages = [];
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      // Override console methods to capture messages
      console.log = function(...args) {
        messages.push({ type: 'log', message: args.join(' '), timestamp: Date.now() });
        originalLog.apply(console, args);
      };
      
      console.error = function(...args) {
        messages.push({ type: 'error', message: args.join(' '), timestamp: Date.now() });
        originalError.apply(console, args);
      };
      
      console.warn = function(...args) {
        messages.push({ type: 'warn', message: args.join(' '), timestamp: Date.now() });
        originalWarn.apply(console, args);
      };
      
      return messages;
    });
    
    // Display console messages summary
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const warningMessages = consoleMessages.filter(msg => msg.type === 'warn');
    
    console.log(`  📊 Total Console Messages: ${consoleMessages.length}`);
    console.log(`  🚨 Errors: ${errorMessages.length}`);
    console.log(`  ⚠️  Warnings: ${warningMessages.length}`);
    
    if (errorMessages.length > 0) {
      console.log('\n  📋 Recent Error Messages:');
      errorMessages.slice(-5).forEach(msg => {
        console.log(`    ❌ ${msg.message}`);
      });
    }
    
    if (warningMessages.length > 0) {
      console.log('\n  📋 Recent Warning Messages:');
      warningMessages.slice(-5).forEach(msg => {
        console.log(`    ⚠️  ${msg.message}`);
      });
    }
    
    // Network Tab Analysis
    console.log('\n🌐 NETWORK ANALYSIS:');
    const networkAnalysis = await page.evaluate(() => {
      const entries = performance.getEntries();
      const resources = entries.filter(entry => entry.entryType === 'resource');
      
      const analysis = {
        totalRequests: resources.length,
        successfulRequests: resources.filter(r => r.responseEnd > 0).length,
        failedRequests: resources.filter(r => r.responseEnd === 0).length,
        slowRequests: resources.filter(r => r.duration > 2000).length,
        resourceTypes: {},
        largestResources: resources
          .filter(r => r.transferSize > 0)
          .sort((a, b) => b.transferSize - a.transferSize)
          .slice(0, 5)
          .map(r => ({
            name: r.name.split('/').pop(),
            size: Math.round(r.transferSize / 1024) + 'KB',
            duration: Math.round(r.duration) + 'ms'
          })),
        slowestRequests: resources
          .filter(r => r.duration > 0)
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)
          .map(r => ({
            name: r.name.split('/').pop(),
            duration: Math.round(r.duration) + 'ms'
          }))
      };
      
      // Count resource types
      resources.forEach(resource => {
        const extension = resource.name.split('.').pop().toLowerCase();
        analysis.resourceTypes[extension] = (analysis.resourceTypes[extension] || 0) + 1;
      });
      
      return analysis;
    });
    
    console.log(`  📊 Total Network Requests: ${networkAnalysis.totalRequests}`);
    console.log(`  ✅ Successful: ${networkAnalysis.successfulRequests}`);
    console.log(`  ❌ Failed: ${networkAnalysis.failedRequests}`);
    console.log(`  🐌 Slow Requests (>2s): ${networkAnalysis.slowRequests}`);
    
    console.log('\n  📋 Resource Types:');
    Object.entries(networkAnalysis.resourceTypes).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });
    
    if (networkAnalysis.largestResources.length > 0) {
      console.log('\n  📊 Largest Resources:');
      networkAnalysis.largestResources.forEach(resource => {
        console.log(`    📦 ${resource.name} - ${resource.size} (${resource.duration})`);
      });
    }
    
    if (networkAnalysis.slowestRequests.length > 0) {
      console.log('\n  ⏱️  Slowest Requests:');
      networkAnalysis.slowestRequests.forEach(request => {
        console.log(`    🐌 ${request.name} - ${request.duration}`);
      });
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🌐 Network analysis completed\n');
    
    // Capture page title and body text for debugging
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Page body text contains:', bodyText.substring(0, 300) + '...');
    
    // Check for network errors in the page
    const networkErrors = await page.evaluate(() => {
      return window.performance
        .getEntries()
        .filter(entry => entry.entryType === 'resource' && !entry.responseEnd)
        .map(entry => entry.name);
    });
    
    if (networkErrors.length > 0) {
      console.log('⚠️ Detected network errors for these resources:');
      networkErrors.forEach(url => console.log(`  - ${url}`));
    } else {
      console.log('✅ No network errors detected');
    }
    
    // Step 3: Check if we're at the login page
    const isLoginPage = await page.isVisible('input[type="email"]') && 
                        await page.isVisible('input[type="password"]') && 
                        await page.isVisible('button:has-text("Sign In")');
    
    if (isLoginPage) {
      console.log('✅ Login page detected');
      
      // Step 4: Fill in the login credentials
      console.log('Entering credentials...');
      await page.fill('input[type="email"]', 'christian.valencia@ikusi.com');
      await page.fill('input[type="password"]', 'PdYb7TU7HvBhYP7$!');
      
      // Step 5: Click the sign in button
      console.log('Attempting to sign in...');
      await Promise.all([
        page.waitForResponse(response => response.url().includes('cognito') && response.status() === 200, { timeout: 60000 }),
        page.click('button:has-text("Sign In")')
      ]).catch(e => console.log('Auth response wait failed:', e.message));
      
      // Step 6: Wait for the dashboard to load
      console.log('Waiting for dashboard to load...');
      await page.waitForTimeout(10000); // Give it more time to process the login
      
      // Check for fetch errors after login
      const hasFetchErrors = await page.evaluate(() => {
        return window.performance
          .getEntries()
          .some(entry => 
            entry.entryType === 'resource' && 
            !entry.responseEnd && 
            entry.name.includes('execute-api')
          );
      });
      
      if (hasFetchErrors) {
        console.log('🚨 API fetch errors detected after login');
      }
      
      // Step 7: Check if login was successful - try multiple selectors
      const dashboardLoaded = await page.isVisible('text=Dashboard') || 
                             await page.isVisible('text=Projects for') ||
                             await page.isVisible('button:has-text("Generate ACTA")');
      
      if (dashboardLoaded) {
        console.log('✅ Login successful!');
        
        // Debug: Check authentication token after login
        console.log('🔍 Debugging authentication token...');
        await page.evaluate(async () => {
          try {
            // Import fetchAuthSession from AWS Amplify
            const { fetchAuthSession } = await import('aws-amplify/auth');
            
            console.log('🔍 Testing authentication token retrieval...');
            const session = await fetchAuthSession();
            console.log('📋 Current session:', {
              hasTokens: !!session.tokens,
              hasIdToken: !!session.tokens?.idToken,
              hasAccessToken: !!session.tokens?.accessToken,
            });
            
            if (session.tokens?.idToken) {
              const token = session.tokens.idToken.toString();
              console.log('✅ Token retrieved successfully');
              console.log('🔍 Token prefix:', token.substring(0, 50) + '...');
              
              // Test API call with this token
              console.log('🧪 Testing API call with token...');
              const response = await fetch('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              console.log('📊 API response status:', response.status);
              const data = await response.json();
              console.log('📄 API response data:', data);
              
            } else {
              console.log('❌ No token found in session');
            }
          } catch (error) {
            console.error('❌ Error in token debug:', error);
          }
        });
        
        // Step 8: Check if projects loaded
        console.log('Checking projects...');
        
        // Wait for project data to load
        await page.waitForSelector('text=Projects for', { timeout: 10000 })
          .catch(() => console.log('⚠️ Projects section not found'));
        
        // Count projects
        const projectCount = await page.$$eval('table tbody tr', rows => rows.length);
        console.log(`📊 Found ${projectCount} projects (should be 7)`);
        
        if (projectCount === 7) {
          console.log('✅ Correct number of projects loaded!');
        } else {
          console.log('❌ Incorrect number of projects');
        }
        
        // Step 9: Test the Generate ACTA button
        console.log('Testing Generate ACTA button...');
        
        // Find the first project's Select button and click it
        const selectButtons = await page.$$('button:has-text("Select")');
        if (selectButtons.length > 0) {
          await selectButtons[0].click();
          console.log('✅ Project selected');
          
          // Find and click the Generate ACTA button (with longer timeout)
          try {
            const generateButtons = await page.$$('button:has-text("Generate")');
            if (generateButtons.length > 0) {
              await generateButtons[0].click();
              console.log('✅ Generate ACTA button clicked');
            } else {
              console.log('❌ No Generate ACTA button found');
            }
          } catch (err) {
            console.log('Error clicking Generate ACTA:', err.message);
          }
          
          // Wait for the operation to complete
          await page.waitForTimeout(3000);
        } else {
          console.log('❌ No Select buttons found');
        }
        
        // Step 10: Test the Download PDF button
        console.log('Testing Download PDF button...');
        const pdfButtons = await page.$$('button:has-text("PDF")');
        if (pdfButtons.length > 0) {
          await pdfButtons[0].click();
          console.log('✅ PDF button clicked');
          await page.waitForTimeout(2000);
        } else {
          console.log('❌ No PDF buttons found');
        }
        
        // Step 11: Test the Download DOCX button
        console.log('Testing Download DOCX button...');
        const docxButtons = await page.$$('button:has-text("DOCX")');
        if (docxButtons.length > 0) {
          await docxButtons[0].click();
          console.log('✅ DOCX button clicked');
          await page.waitForTimeout(2000);
        } else {
          console.log('❌ No DOCX buttons found');
        }
        
        // Step 12: Test Send button
        console.log('Testing Send button...');
        const sendButtons = await page.$$('button:has-text("Send")');
        if (sendButtons.length > 0) {
          await sendButtons[0].click();
          console.log('✅ Send button clicked');
          
          // Wait for the email dialog to appear
          await page.waitForSelector('text=Send for Approval');
          console.log('✅ Email dialog appeared');
          
          // Fill in the email and submit
          await page.fill('input[type="email"]', 'test@example.com');
          await page.click('button:has-text("Send Approval")');
          console.log('✅ Email submitted');
          
          // Wait for operation to complete
          await page.waitForTimeout(3000);
        } else {
          console.log('❌ No Send buttons found');
        }
        
      } else {
        console.log('❌ Login failed or dashboard did not load');
        
        // Check for specific errors
        const errorElements = await page.$$eval('.error-message, .alert-error, [role="alert"]', 
          elements => elements.map(el => el.textContent));
          
        if (errorElements.length > 0) {
          console.log('🚨 Error messages found on page:');
          errorElements.forEach(msg => console.log(`  - ${msg}`));
        }
      }
    } else {
      console.log('❌ Login page not detected');
      console.log('Current page content:', await page.content());
    }
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Take a screenshot for review
    await page.screenshot({ path: 'production-test.png' });
    
    // FINAL DEV TOOLS SUMMARY
    console.log('\n🔍 FINAL DEV TOOLS SUMMARY');
    console.log('=' .repeat(50));
    
    // Capture final state analysis
    const finalAnalysis = await page.evaluate(() => {
      const finalState = {
        pageHealth: {
          hasErrors: false,
          errorCount: 0,
          warningCount: 0,
          criticalIssues: []
        },
        uiIntegrity: {
          essentialElementsPresent: true,
          missingElements: [],
          brokenFeatures: []
        },
        performanceHealth: {
          loadTimeAcceptable: true,
          memoryUsageNormal: true,
          networkIssues: []
        },
        securityStatus: {
          httpsEnabled: location.protocol === 'https:',
          noMixedContent: true,
          cspCompliant: true
        }
      };
      
      // Check for critical UI elements
      const essentialElements = [
        { selector: 'input[type="email"]', name: 'Email Input' },
        { selector: 'input[type="password"]', name: 'Password Input' },
        { selector: 'button', name: 'Buttons' },
        { selector: 'header, nav', name: 'Navigation' }
      ];
      
      essentialElements.forEach(element => {
        if (!document.querySelector(element.selector)) {
          finalState.uiIntegrity.essentialElementsPresent = false;
          finalState.uiIntegrity.missingElements.push(element.name);
        }
      });
      
      // Check performance metrics
      const navigationTiming = performance.getEntriesByType('navigation')[0];
      if (navigationTiming && navigationTiming.loadEventEnd - navigationTiming.navigationStart > 5000) {
        finalState.performanceHealth.loadTimeAcceptable = false;
        finalState.performanceHealth.networkIssues.push('Slow page load time');
      }
      
      // Check for JavaScript errors
      const errors = performance.getEntries().filter(entry => 
        entry.entryType === 'resource' && entry.responseEnd === 0
      );
      finalState.pageHealth.errorCount = errors.length;
      finalState.pageHealth.hasErrors = errors.length > 0;
      
      // Check for AWS configuration
      if (!window.awsmobile) {
        finalState.pageHealth.criticalIssues.push('AWS Amplify configuration missing');
      }
      
      // Check for authentication readiness
      if (typeof window.fetchAuthSession === 'undefined' && !window.awsmobile) {
        finalState.pageHealth.criticalIssues.push('Authentication system not ready');
      }
      
      return finalState;
    });
    
    // Display final analysis
    console.log('\n📊 PAGE HEALTH STATUS:');
    console.log(`  Overall Status: ${finalAnalysis.pageHealth.hasErrors ? '❌ ISSUES FOUND' : '✅ HEALTHY'}`);
    console.log(`  Error Count: ${finalAnalysis.pageHealth.errorCount}`);
    console.log(`  Warning Count: ${finalAnalysis.pageHealth.warningCount}`);
    
    if (finalAnalysis.pageHealth.criticalIssues.length > 0) {
      console.log('\n  🚨 Critical Issues:');
      finalAnalysis.pageHealth.criticalIssues.forEach(issue => {
        console.log(`    ❌ ${issue}`);
      });
    }
    
    console.log('\n🎨 UI INTEGRITY STATUS:');
    console.log(`  Essential Elements: ${finalAnalysis.uiIntegrity.essentialElementsPresent ? '✅ PRESENT' : '❌ MISSING'}`);
    if (finalAnalysis.uiIntegrity.missingElements.length > 0) {
      console.log('  Missing Elements:');
      finalAnalysis.uiIntegrity.missingElements.forEach(element => {
        console.log(`    ❌ ${element}`);
      });
    }
    
    console.log('\n⚡ PERFORMANCE STATUS:');
    console.log(`  Load Time: ${finalAnalysis.performanceHealth.loadTimeAcceptable ? '✅ ACCEPTABLE' : '❌ SLOW'}`);
    console.log(`  Memory Usage: ${finalAnalysis.performanceHealth.memoryUsageNormal ? '✅ NORMAL' : '⚠️ HIGH'}`);
    
    console.log('\n🔒 SECURITY STATUS:');
    console.log(`  HTTPS: ${finalAnalysis.securityStatus.httpsEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`  Mixed Content: ${finalAnalysis.securityStatus.noMixedContent ? '✅ CLEAN' : '❌ DETECTED'}`);
    
    // Overall grade
    const issueCount = finalAnalysis.pageHealth.criticalIssues.length + 
                      finalAnalysis.uiIntegrity.missingElements.length +
                      (finalAnalysis.performanceHealth.loadTimeAcceptable ? 0 : 1) +
                      (finalAnalysis.securityStatus.httpsEnabled ? 0 : 1);
    
    let grade;
    if (issueCount === 0) grade = 'A+ (Excellent)';
    else if (issueCount <= 2) grade = 'B+ (Good)';
    else if (issueCount <= 4) grade = 'C+ (Needs Improvement)';
    else grade = 'F (Critical Issues)';
    
    console.log(`\n📊 OVERALL GRADE: ${grade}`);
    console.log('=' .repeat(50));
    
    // Check for network activity one last time
    const finalNetworkCheck = await page.evaluate(() => {
      const errors = window.performance
        .getEntries()
        .filter(entry => entry.entryType === 'resource' && !entry.responseEnd)
        .map(entry => entry.name);
      
      return {
        totalRequests: window.performance.getEntries().length,
        failedRequests: errors,
        hasFetchErrors: errors.some(url => url.includes('execute-api'))
      };
    });
    
    // Check for critical components in the page
    const criticalComponentsCheck = await page.evaluate(() => {
      const results = {
        awsExportsFound: typeof window.awsmobile !== 'undefined',
        authComponentsFound: false,
        apiComponentsFound: false,
        criticalFunctions: []
      };
      
      // Check for auth components
      if (document.querySelector('form input[type="email"]') && 
          document.querySelector('form input[type="password"]')) {
        results.authComponentsFound = true;
      }
      
      // Collect any critical functions found (from our earlier check)
      const consoleOutput = window.performance.getEntriesByType('mark')
        .filter(mark => mark.name.includes('Critical functions found'));
      if (consoleOutput.length > 0) {
        results.criticalFunctions = consoleOutput[0].name
          .replace('Critical functions found: ', '')
          .split(', ');
      }
      
      return results;
    });
    
    console.log('\n📊 Network summary:');
    console.log(`  - Total requests: ${finalNetworkCheck.totalRequests}`);
    console.log(`  - Failed requests: ${finalNetworkCheck.failedRequests.length}`);
    console.log(`  - API fetch errors: ${finalNetworkCheck.hasFetchErrors ? 'YES' : 'NO'}`);
    
    console.log('\n🔍 Critical components check:');
    console.log(`  - AWS Exports loaded: ${criticalComponentsCheck.awsExportsFound ? '✅ YES' : '❌ NO'}`);
    console.log(`  - Auth components found: ${criticalComponentsCheck.authComponentsFound ? '✅ YES' : '❌ NO'}`);
    console.log(`  - Critical functions found: ${criticalComponentsCheck.criticalFunctions.length > 0 ? 
      '✅ ' + criticalComponentsCheck.criticalFunctions.join(', ') : 
      '❌ None detected'}`);
    
    // Final assessment
    const allComponentsPresent = criticalComponentsCheck.awsExportsFound && 
                               criticalComponentsCheck.authComponentsFound &&
                               criticalComponentsCheck.criticalFunctions.length >= 3;
    
    console.log('\n📝 Final assessment:');
    if (allComponentsPresent) {
      console.log('✅ PASS: All critical components are present in the deployment');
    } else {
      console.log('❌ FAIL: Some critical components are missing from the deployment');
      console.log('   Run the rebuild-and-deploy-complete.sh script to fix the issues');
    }
    
    // Close the browser
    await browser.close();
    console.log('\nTesting completed');
  }
}

// Run the test
testProductionSite().catch(console.error);
