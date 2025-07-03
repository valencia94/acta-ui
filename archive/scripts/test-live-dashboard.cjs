#!/usr/bin/env node

/**
 * Live Dashboard Testing Script
 * Tests the actual deployed dashboard functionality with real login
 */

const puppeteer = require('puppeteer');

const CONFIG = {
  BASE_URL: 'https://d7t9x3j66yd8k.cloudfront.net',
  API_URL: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
  TEST_USER: process.env.ACTA_UI_USER || 'valencia942003@gmail.com',
  TEST_PASSWORD: process.env.ACTA_UI_PW || 'test_password',
  TIMEOUT: 30000,
};

async function testDashboard() {
  console.log('🚀 Starting Live Dashboard Test');
  console.log('===============================');
  console.log(`📍 Base URL: ${CONFIG.BASE_URL}`);
  console.log(`👤 Test User: ${CONFIG.TEST_USER}`);
  console.log('');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 720 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', (msg) => console.log(`🖥️  BROWSER: ${msg.text()}`));
    page.on('pageerror', (error) =>
      console.log(`❌ PAGE ERROR: ${error.message}`)
    );

    console.log('📥 1. Loading homepage...');
    await page.goto(CONFIG.BASE_URL, {
      waitUntil: 'networkidle0',
      timeout: CONFIG.TIMEOUT,
    });

    // Take screenshot of current state
    await page.screenshot({ path: 'live-dashboard-step1.png', fullPage: true });

    // Check page title
    const title = await page.title();
    console.log(`📋 Page Title: "${title}"`);

    // Check if we're on login page or already logged in
    const currentUrl = page.url();
    console.log(`🔗 Current URL: ${currentUrl}`);

    // Look for login elements
    const hasLoginForm =
      (await page.$(
        'input[type="email"], input[placeholder*="email"], input[name="email"]'
      )) !== null;
    const hasPasswordField = (await page.$('input[type="password"]')) !== null;

    if (hasLoginForm && hasPasswordField) {
      console.log('🔐 2. Found login form, attempting login...');

      // Find and fill email field
      const emailSelector =
        'input[type="email"], input[placeholder*="email"], input[name="email"]';
      await page.waitForSelector(emailSelector, { timeout: 5000 });
      await page.type(emailSelector, CONFIG.TEST_USER);
      console.log('✅ Email entered');

      // Find and fill password field
      const passwordSelector = 'input[type="password"]';
      await page.type(passwordSelector, CONFIG.TEST_PASSWORD);
      console.log('✅ Password entered');

      // Take screenshot before submitting
      await page.screenshot({
        path: 'live-dashboard-step2-login.png',
        fullPage: true,
      });

      // Find and click submit button
      const submitSelectors = [
        'button[type="submit"]',
        'button:contains("Sign In")',
        'button:contains("Login")',
        'input[type="submit"]',
        '.login-button',
        '.signin-button',
      ];

      let loginClicked = false;
      for (const selector of submitSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            await button.click();
            loginClicked = true;
            console.log(`✅ Clicked login button: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue trying other selectors
        }
      }

      if (!loginClicked) {
        // Try pressing Enter
        await page.keyboard.press('Enter');
        console.log('✅ Pressed Enter to submit');
      }

      // Wait for navigation or dashboard to load
      try {
        await page.waitForNavigation({
          waitUntil: 'networkidle0',
          timeout: 15000,
        });
        console.log('✅ Navigation completed');
      } catch (e) {
        console.log('⚠️  No navigation detected, checking current state...');
      }
    } else {
      console.log(
        'ℹ️  No login form found, checking if already on dashboard...'
      );
    }

    // Take screenshot after login attempt
    await page.screenshot({
      path: 'live-dashboard-step3-post-login.png',
      fullPage: true,
    });

    console.log('📊 3. Analyzing dashboard state...');

    // Check current page content
    const pageContent = await page.content();
    const bodyText = await page.evaluate(() => document.body.innerText);

    // Look for dashboard indicators
    const dashboardIndicators = [
      'dashboard',
      'projects',
      'welcome',
      'ACTA',
      'logout',
      'profile',
      'create project',
      'recent projects',
    ];

    const foundIndicators = dashboardIndicators.filter((indicator) =>
      bodyText.toLowerCase().includes(indicator.toLowerCase())
    );

    console.log('🔍 Dashboard indicators found:', foundIndicators);

    // Check for interactive elements
    const buttons = await page.$$('button');
    const links = await page.$$('a');
    const inputs = await page.$$('input');

    console.log(
      `🎛️  Interactive elements: ${buttons.length} buttons, ${links.length} links, ${inputs.length} inputs`
    );

    // Test specific dashboard features
    console.log('🧪 4. Testing dashboard functionality...');

    // Look for "Create Project" button or similar
    const createProjectButton = await page.$(
      'button:contains("Create"), button:contains("New"), .create-project, .new-project'
    );
    if (createProjectButton) {
      console.log('✅ Found Create Project functionality');

      // Test clicking the button (don't actually create a project)
      const isEnabled = await page.evaluate(
        (btn) => !btn.disabled,
        createProjectButton
      );
      console.log(`   Button enabled: ${isEnabled}`);
    } else {
      console.log('❌ Create Project button not found');
    }

    // Check for navigation menu
    const navItems = await page.$$('nav a, .nav-item, .navigation a');
    console.log(`🧭 Navigation items found: ${navItems.length}`);

    // Look for user info/profile
    const userInfo = await page.$(
      '.user-info, .profile, .user-menu, [data-testid="user"]'
    );
    if (userInfo) {
      const userText = await page.evaluate((el) => el.textContent, userInfo);
      console.log(`👤 User info found: ${userText}`);
    }

    // Test API connectivity from browser
    console.log('🔌 5. Testing API connectivity from browser...');

    const apiTest = await page.evaluate(async (apiUrl) => {
      try {
        const response = await fetch(`${apiUrl}/health`);
        return {
          status: response.status,
          ok: response.ok,
          url: response.url,
        };
      } catch (error) {
        return {
          error: error.message,
        };
      }
    }, CONFIG.API_URL);

    console.log('🔌 API Health Check:', apiTest);

    // Final screenshot
    await page.screenshot({ path: 'live-dashboard-final.png', fullPage: true });

    console.log('');
    console.log('📋 DASHBOARD TEST SUMMARY');
    console.log('=========================');
    console.log(`✅ Site accessible: ${CONFIG.BASE_URL}`);
    console.log(`📄 Page title: "${title}"`);
    console.log(
      `🔍 Dashboard indicators: ${foundIndicators.length > 0 ? foundIndicators.join(', ') : 'None found'}`
    );
    console.log(
      `🎛️  Interactive elements: ${buttons.length} buttons, ${links.length} links`
    );
    console.log(`🔌 API connectivity: ${apiTest.ok ? 'Working' : 'Failed'}`);
    console.log('');
    console.log('📸 Screenshots saved:');
    console.log('   - live-dashboard-step1.png (initial load)');
    console.log('   - live-dashboard-step2-login.png (login form)');
    console.log('   - live-dashboard-step3-post-login.png (after login)');
    console.log('   - live-dashboard-final.png (final state)');

    // Determine if dashboard is working
    const isDashboardWorking =
      foundIndicators.length >= 2 && buttons.length > 2;

    if (isDashboardWorking) {
      console.log('');
      console.log('🎉 DASHBOARD APPEARS TO BE WORKING!');
    } else {
      console.log('');
      console.log('❌ DASHBOARD APPEARS TO HAVE ISSUES');
      console.log(
        '   The deployed site may not match the expected dashboard interface'
      );
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testDashboard()
    .then(() => {
      console.log('✅ Dashboard test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Dashboard test failed:', error);
      process.exit(1);
    });
}

module.exports = { testDashboard };
