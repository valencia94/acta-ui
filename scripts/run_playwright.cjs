require('../tests/playwright.preload.js');
// Ensure the CLI runs `playwright test`
if (!process.argv.includes('test')) {
  process.argv.splice(2, 0, 'test');
}
require('@playwright/test/cli');
