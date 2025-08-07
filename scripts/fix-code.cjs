#!/usr/bin/env node
const { execSync } = require('child_process');

console.log('🔧 Starting code fix...');

try {
  // Fix imports and format
  console.log('📝 Fixing imports and formatting...');
  execSync('pnpm eslint . --fix', { stdio: 'inherit' });
  execSync('pnpm prettier --write "src/**/*.{ts,tsx}"', { stdio: 'inherit' });

  // Run type check
  console.log('🔍 Running type check...');
  execSync('pnpm tsc --noEmit', { stdio: 'inherit' });

  console.log('✅ Code fix complete!');
} catch (error) {
  console.error('❌ Fix failed:', error);
  process.exit(1);
}

