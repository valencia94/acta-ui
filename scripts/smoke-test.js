#!/usr/bin/env node
// Basic post-build smoke test for Acta UI
// Validates that the build output contains required files for SPA routing

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(path.dirname(__dirname), 'dist');
const REQUIRED_FILES = ['index.html', '404.html'];
const REQUIRED_CONTENT_CHECKS = [
  { file: 'index.html', content: '<div id="root">' },
  { file: '404.html', content: '<div id="root">' },
];

console.log('🧪 Running post-build smoke test...');

// Check if dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ FAIL: dist directory not found');
  process.exit(1);
}

console.log('✅ dist directory exists');

// Check required files exist
let allFilesExist = true;
for (const file of REQUIRED_FILES) {
  const filePath = path.join(DIST_DIR, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ FAIL: ${file} not found`);
    allFilesExist = false;
  }
}

if (!allFilesExist) {
  process.exit(1);
}

// Check file contents
let allContentValid = true;
for (const check of REQUIRED_CONTENT_CHECKS) {
  const filePath = path.join(DIST_DIR, check.file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(check.content)) {
      console.log(`✅ ${check.file} contains required content`);
    } else {
      console.error(`❌ FAIL: ${check.file} missing required content: ${check.content}`);
      allContentValid = false;
    }
  } catch (error) {
    console.error(`❌ FAIL: Could not read ${check.file}: ${error.message}`);
    allContentValid = false;
  }
}

// Check that 404.html and index.html are identical (for SPA routing)
try {
  const indexContent = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
  const fallbackContent = fs.readFileSync(path.join(DIST_DIR, '404.html'), 'utf8');
  
  if (indexContent === fallbackContent) {
    console.log('✅ 404.html matches index.html (SPA routing ready)');
  } else {
    console.error('❌ FAIL: 404.html does not match index.html');
    allContentValid = false;
  }
} catch (error) {
  console.error(`❌ FAIL: Could not compare index.html and 404.html: ${error.message}`);
  allContentValid = false;
}

// Check for assets directory
const assetsPath = path.join(DIST_DIR, 'assets');
if (fs.existsSync(assetsPath)) {
  console.log('✅ assets directory exists');
} else {
  console.log('⚠️  WARNING: assets directory not found (may be expected for some builds)');
}

if (allContentValid) {
  console.log('🎉 All smoke tests passed! Build is ready for SPA deployment.');
  process.exit(0);
} else {
  console.error('❌ Some smoke tests failed. Build may not work correctly for SPA routing.');
  process.exit(1);
}