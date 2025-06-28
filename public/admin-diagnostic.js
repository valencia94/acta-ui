// Admin Dashboard Diagnostic Script
// Run this in browser console on the admin page to debug the loading/redirect issue

function diagnoseAdminDashboard() {
  console.log('🔍 Admin Dashboard Diagnostic');
  console.log('='.repeat(50));

  // Check current URL
  console.log('📍 Current URL:', window.location.href);

  // Check if we're on admin page
  const isOnAdminPage = window.location.pathname === '/admin';
  console.log('🏠 On admin page:', isOnAdminPage);

  // Check for admin-specific elements
  const adminTitle = document.querySelector('h1');
  const adminTitleText = adminTitle?.textContent;
  console.log('📝 Page title:', adminTitleText);

  // Check for project loading in console
  console.log('🔍 Looking for project loading logs...');

  // Check localStorage for user info
  const userInfo = localStorage.getItem('amplify-signin-with-hostedUI');
  console.log(
    '👤 User info in localStorage:',
    userInfo ? 'Found' : 'Not found'
  );

  // Check for authentication state
  const authState = document.querySelector(
    '[data-testid="auth-state"]'
  )?.textContent;
  console.log('🔐 Auth state:', authState || 'Not visible');

  // Monitor network requests
  console.log('🌐 Monitoring network requests for next 5 seconds...');

  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    console.log('📡 API Call:', args[0]);
    return originalFetch.apply(this, args);
  };

  // Reset fetch after 5 seconds
  setTimeout(() => {
    window.fetch = originalFetch;
    console.log('🔄 Network monitoring stopped');
  }, 5000);

  // Check for any error messages
  const errorMessages = Array.from(document.querySelectorAll('*')).filter(
    (el) =>
      el.textContent?.includes('error') ||
      el.textContent?.includes('Error') ||
      el.textContent?.includes('denied') ||
      el.textContent?.includes('Access')
  );

  if (errorMessages.length > 0) {
    console.log(
      '❌ Error messages found:',
      errorMessages.map((el) => el.textContent)
    );
  } else {
    console.log('✅ No error messages visible');
  }

  // Check for redirects
  let redirectCount = 0;
  const originalAssign = window.location.assign;
  const originalHref = window.location.href;

  Object.defineProperty(window.location, 'href', {
    set: function (url) {
      console.log('🔄 Redirect attempt to:', url);
      redirectCount++;
      return originalHref;
    },
    get: function () {
      return originalHref;
    },
  });

  // Manual checks
  console.log('\n📋 Manual Checks:');
  console.log('1. Open browser DevTools Console');
  console.log('2. Try navigating to /admin');
  console.log('3. Watch for any redirect messages');
  console.log('4. Check if you see "AdminDashboard - Debug info" logs');
  console.log('5. Look for PMProjectManager logs about loading projects');

  console.log('\n🧪 Next Steps:');
  console.log('- If redirected: Check auth loading timing');
  console.log('- If projects load but redirect: Look for admin check logic');
  console.log('- If 150+ projects: Check what API endpoint is being called');
}

// Auto-run
diagnoseAdminDashboard();

// Make available globally
window.diagnoseAdminDashboard = diagnoseAdminDashboard;

console.log('🔧 Run diagnoseAdminDashboard() to re-run diagnostic');
