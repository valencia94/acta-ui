// Auth and Role Validation Test
// This script tests authentication handling and role-based access in skip-auth mode

console.log('🔍 AUTH & ROLE VALIDATION TEST');
console.log('=====================================');

// Test 1: Check Environment Variables
console.log('\n📋 1. ENVIRONMENT SETUP:');
console.log('Skip Auth Mode:', window.location.search.includes('skip') || 'Check .env file');
console.log('API Base URL:', 'Should be /api for local proxy');
console.log('Current URL:', window.location.href);

// Test 2: Test API Authentication
console.log('\n🔐 2. TESTING API AUTHENTICATION:');

async function testAPIAuth() {
  try {
    console.log('Making test API call to /api/health...');
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ API Response successful:', data);
    } else {
      console.log('❌ API Response failed:', response.statusText);
    }
  } catch (error) {
    console.log('❌ API Error:', error.message);
  }
}

// Test 3: Check User Authentication Status
console.log('\n👤 3. TESTING USER AUTHENTICATION:');

function testUserAuth() {
  // Look for auth-related elements
  const headerEl = document.querySelector('header');
  const userMenuEl = document.querySelector('[class*="dropdown"], [class*="menu"]');
  
  console.log('Header found:', !!headerEl);
  console.log('User menu found:', !!userMenuEl);
  
  // Check for user email display
  const emailDisplay = document.body.textContent.includes('@');
  console.log('Email display detected:', emailDisplay);
  
  // Check for admin elements
  const adminButtons = document.querySelectorAll('[class*="admin"], [href*="admin"]');
  console.log('Admin elements found:', adminButtons.length);
  
  if (adminButtons.length > 0) {
    console.log('✅ Admin access detected');
    Array.from(adminButtons).forEach((btn, i) => {
      console.log(`  Admin element ${i + 1}:`, btn.textContent?.trim() || btn.outerHTML.substring(0, 50));
    });
  } else {
    console.log('❌ No admin access elements found');
  }
}

// Test 4: Test Role-Based Navigation
console.log('\n🛡️ 4. TESTING ROLE-BASED ACCESS:');

function testRoleAccess() {
  // Check if we can navigate to admin dashboard
  const adminPath = '/admin';
  
  console.log('Testing admin navigation...');
  
  // Look for admin navigation option
  const adminLink = document.querySelector(`[href="${adminPath}"], [onclick*="admin"]`);
  if (adminLink) {
    console.log('✅ Admin navigation link found:', adminLink.textContent?.trim());
  } else {
    console.log('❌ Admin navigation link not found');
  }
  
  // Test direct navigation
  const currentPath = window.location.pathname;
  console.log('Current path:', currentPath);
  
  if (currentPath === adminPath) {
    console.log('✅ Successfully on admin dashboard');
  } else if (currentPath === '/dashboard') {
    console.log('ℹ️ On regular dashboard - try clicking admin link in header menu');
  }
}

// Test 5: Button Functionality Test
console.log('\n🔘 5. TESTING BUTTON FUNCTIONALITY:');

function testButtons() {
  // Look for ACTA buttons
  const actaButtons = document.querySelectorAll('[class*="acta"], [class*="button"]');
  console.log('Button elements found:', actaButtons.length);
  
  // Look for project input
  const projectInput = document.querySelector('input[placeholder*="project"], input[type="text"]');
  console.log('Project input found:', !!projectInput);
  
  if (projectInput) {
    console.log('✅ Project input available for testing');
    console.log('Input placeholder:', projectInput.placeholder);
  }
  
  // Check for action buttons
  const actionButtons = document.querySelectorAll('button:not([class*="menu"]):not([class*="header"])');
  console.log('Action buttons found:', actionButtons.length);
  
  if (actionButtons.length > 0) {
    console.log('Action buttons detected:');
    Array.from(actionButtons).slice(0, 5).forEach((btn, i) => {
      const text = btn.textContent?.trim();
      if (text && text.length > 0) {
        console.log(`  ${i + 1}. "${text}"`);
      }
    });
  }
}

// Run all tests
async function runAllTests() {
  await testAPIAuth();
  testUserAuth();
  testRoleAccess();
  testButtons();
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Try accessing /admin directly: ' + window.location.origin + '/admin');
  console.log('2. Look for admin option in header menu (hamburger menu)');
  console.log('3. Test button functionality with project ID input');
  console.log('4. Check browser console for auth-related logs');
  console.log('\n=====================================');
}

// Auto-run tests after page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
}

// Expose functions for manual testing
window.authRoleTest = {
  runAllTests,
  testAPIAuth,
  testUserAuth,
  testRoleAccess,
  testButtons,
};

console.log('\n🔧 Manual test functions available:');
console.log('window.authRoleTest.runAllTests() - Run all tests');
console.log('window.authRoleTest.testAPIAuth() - Test API authentication');
console.log('window.authRoleTest.testUserAuth() - Test user authentication');
console.log('window.authRoleTest.testRoleAccess() - Test role-based access');
console.log('window.authRoleTest.testButtons() - Test button functionality');
