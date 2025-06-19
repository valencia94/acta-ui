require('../tests/playwright.preload.js');
// Ensure the CLI runs `playwright test`
if (!process.argv.includes('test')) process.argv.push('test');
require('@playwright/test/cli');
