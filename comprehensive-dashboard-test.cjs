// Live Dashboard Feature Test
// Tests the actual dashboard functionality in production

const puppeteer = require('puppeteer');

async function testLiveDashboard() {
  console.log('🧪 Starting comprehensive dashboard test...');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true, // Enable devtools to see console
    slowMo: 1000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
    ],
  });

  const page = await browser.newPage();

  // Listen to console messages from the page
  page.on('console', (msg) => {
    console.log(`🌐 BROWSER CONSOLE [${msg.type()}]:`, msg.text());
  });

  // Listen to page errors
  page.on('pageerror', (error) => {
    console.log(`❌ PAGE ERROR:`, error.message);
  });

  // Listen to failed requests
  page.on('requestfailed', (request) => {
    console.log(
      `❌ FAILED REQUEST:`,
      request.url(),
      request.failure().errorText
    );
  });

  try {
    // Navigate to the live site
    console.log('📍 Navigating to live dashboard...');
    await page.goto('https://d7t9x3j66yd8k.cloudfront.net/', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait a bit for React to initialize
    await page.waitForTimeout(5000);

    // Check if JavaScript is working at all
    const jsTest = await page.evaluate(() => {
      try {
        return {
          windowLoaded: true,
          reactExists: typeof window.React !== 'undefined',
          rootElementExists: !!document.getElementById('root'),
          rootHasContent: document.getElementById('root').innerHTML.length > 0,
          scriptsLoaded: document.querySelectorAll('script[src]').length,
          cssLoaded: document.querySelectorAll('link[rel="stylesheet"]').length,
          consoleErrors: window.errors || [],
          bodyContent: document.body.innerHTML.substring(0, 200),
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('🔍 JavaScript Test Results:', JSON.stringify(jsTest, null, 2));

    // Take initial screenshot
    await page.screenshot({
      path: 'live-dashboard-initial.png',
      fullPage: true,
    });

    // Check page title
    const title = await page.title();
    console.log(`📋 Page title: "${title}"`);

    // Check for React root element
    const rootElement = await page.$('#root');
    console.log(`⚛️ React root element: ${rootElement ? 'Found' : 'Missing'}`);

    // Check for login form
    const emailInput = await page.$(
      'input[type="email"], input[name="username"], input[placeholder*="mail"], input[placeholder*="user"]'
    );
    const passwordInput = await page.$('input[type="password"]');
    const loginButton = await page.$(
      'button[type="submit"], button:contains("Sign"), button:contains("Login")'
    );

    console.log(`📧 Email input: ${emailInput ? 'Found' : 'Missing'}`);
    console.log(`🔐 Password input: ${passwordInput ? 'Found' : 'Missing'}`);
    console.log(`🔘 Login button: ${loginButton ? 'Found' : 'Missing'}`);

    if (emailInput && passwordInput) {
      // Fill in login credentials
      console.log('🔑 Filling in login credentials...');
      await page.type(
        'input[type="email"], input[name="username"]',
        'admin@ikusi.com'
      );
      await page.type('input[type="password"]', 'TempPassword123!');

      // Take screenshot before login
      await page.screenshot({
        path: 'live-dashboard-before-login.png',
        fullPage: true,
      });

      // Submit login
      console.log('🚪 Attempting login...');
      if (loginButton) {
        await loginButton.click();
      } else {
        await page.keyboard.press('Enter');
      }

      // Wait for navigation or response
      await page.waitForTimeout(3000);

      // Take screenshot after login attempt
      await page.screenshot({
        path: 'live-dashboard-after-login.png',
        fullPage: true,
      });

      // Check if we're now on dashboard
      const currentUrl = page.url();
      console.log(`🌐 Current URL: ${currentUrl}`);

      // Look for dashboard elements
      const dashboardIndicators = await page.evaluate(() => {
        const body = document.body;
        const bodyText = body.innerText.toLowerCase();

        return {
          hasProjectTable: !!document.querySelector('table, [role="table"]'),
          hasGenerateButton: !!document.querySelector(
            'button:contains("Generate"), button[data-testid*="generate"]'
          ),
          hasProjectManager:
            bodyText.includes('project manager') || bodyText.includes('pm'),
          hasActaText: bodyText.includes('acta'),
          hasDashboardText: bodyText.includes('dashboard'),
          pageContent: body.innerText.substring(0, 500),
        };
      });

      console.log(
        '📊 Dashboard indicators:',
        JSON.stringify(dashboardIndicators, null, 2)
      );

      // Check for any error messages
      const errors = await page.evaluate(() => {
        const errorElements = Array.from(
          document.querySelectorAll(
            '[role="alert"], .error, .alert-error, .text-red'
          )
        );
        return errorElements
          .map((el) => el.textContent.trim())
          .filter((text) => text.length > 0);
      });

      if (errors.length > 0) {
        console.log('❌ Errors found:', errors);
      }

      // Final comprehensive screenshot
      await page.screenshot({
        path: 'live-dashboard-final.png',
        fullPage: true,
      });
    } else {
      console.log('❌ Login form not found - this might be the issue!');

      // Capture what's actually on the page
      const pageContent = await page.evaluate(() => {
        return {
          html: document.documentElement.outerHTML.substring(0, 2000),
          bodyText: document.body.innerText.substring(0, 500),
          allInputs: Array.from(document.querySelectorAll('input')).map(
            (input) => ({
              type: input.type,
              name: input.name,
              placeholder: input.placeholder,
              id: input.id,
            })
          ),
          allButtons: Array.from(document.querySelectorAll('button')).map(
            (button) => ({
              text: button.textContent.trim(),
              type: button.type,
              id: button.id,
            })
          ),
        };
      });

      console.log(
        '📄 Page content analysis:',
        JSON.stringify(pageContent, null, 2)
      );
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'live-dashboard-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testLiveDashboard().catch(console.error);
