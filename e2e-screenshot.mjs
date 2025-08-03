import { test, chromium, expect } from '@playwright/test';

const USER = process.env.ACTA_UI_USER;
const PW = process.env.ACTA_UI_PW;

test('dashboard screenshot', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/');
    
    if (USER && PW) {
      // Try to login if credentials are available
      await page.fill('input[type="email"]', USER);
      await page.fill('input[type="password"]', PW);
      await page.click('button:text("Sign in")');
      await page.locator('text=Your Projects').waitFor({ state: 'visible' });
      // Wait for at least one project row
      await page.locator('table tbody tr').first().waitFor();
    }
    
    const file = `docs/screenshots/pm-dashboard-${Date.now()}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`🖼  saved ${file}`);
  } catch (error) {
    console.log(`❌ Error taking screenshot: ${error.message}`);
    // Take a screenshot anyway to show current state
    const file = `docs/screenshots/pm-dashboard-error-${Date.now()}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`🖼  saved error screenshot: ${file}`);
  }
  
  await browser.close();
});