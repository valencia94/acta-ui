// scripts/prepare.cjs  — runs AFTER 'pnpm install'
/* eslint-disable @typescript-eslint/no-var-requires */
if (!process.env.CI) {
  const { execSync } = require('child_process');
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  execSync('npx husky install', { stdio: 'inherit' });
}

// --- SPA route copies (login & dashboard) -----------------
if (process.env.CI) {
  const fs = require('fs');
  const path = require('path');
  const extraRoutes = ['login', 'dashboard'];
  const dist = path.resolve(__dirname, '../dist');
  extraRoutes.forEach((r) => {
    const dest = path.join(dist, r);
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.copyFileSync(
      path.join(dist, 'index.html'),
      path.join(dest, 'index.html')
    );
  });
  console.info('✓ copied index.html to /login and /dashboard');
}
