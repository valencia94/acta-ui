// Comprehensive Dashboard Debugging Script
// This script will test the dashboard functionality and identify issues

console.log('🔍 Starting Dashboard Debugging...');

// Test 1: Check if the main application loads
function testMainAppLoad() {
  console.log('📋 Test 1: Main Application Load');
  try {
    const app = document.querySelector('#root');
    if (app) {
      console.log('✅ React root element found');
      console.log('📊 Root element content length:', app.innerHTML.length);
      if (app.innerHTML.length === 0) {
        console.error(
          '❌ Root element is empty - React app may not be mounting'
        );
      }
    } else {
      console.error('❌ React root element not found');
    }
  } catch (error) {
    console.error('❌ Error checking main app:', error);
  }
}

// Test 2: Check for JavaScript errors
function testJavaScriptErrors() {
  console.log('📋 Test 2: JavaScript Error Monitoring');

  window.addEventListener('error', (event) => {
    console.error('❌ Global JavaScript Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled Promise Rejection:', event.reason);
  });
}

// Test 3: Check AWS Amplify configuration
function testAmplifyConfig() {
  console.log('📋 Test 3: AWS Amplify Configuration');
  try {
    // Check if Amplify is loaded
    if (window.aws_amplify) {
      console.log('✅ AWS Amplify found in window');
    } else {
      console.log('⚠️ AWS Amplify not found in window object');
    }

    // Test auth configuration
    fetch('/health')
      .then((response) => response.json())
      .then((data) => {
        console.log('✅ Health endpoint accessible:', data);
      })
      .catch((error) => {
        console.error('❌ Health endpoint error:', error);
      });
  } catch (error) {
    console.error('❌ Error testing Amplify config:', error);
  }
}

// Test 4: Check for CSS/Styling issues
function testStyling() {
  console.log('📋 Test 4: CSS and Styling');
  try {
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    console.log(`📊 Found ${stylesheets.length} stylesheets`);

    stylesheets.forEach((sheet, index) => {
      console.log(`📄 Stylesheet ${index + 1}:`, sheet.href);
    });

    // Check if Tailwind CSS is loaded
    const testElement = document.createElement('div');
    testElement.className = 'bg-red-500';
    document.body.appendChild(testElement);
    const computedStyle = window.getComputedStyle(testElement);
    const backgroundColor = computedStyle.backgroundColor;
    document.body.removeChild(testElement);

    if (
      backgroundColor === 'rgb(239, 68, 68)' ||
      backgroundColor.includes('red')
    ) {
      console.log('✅ Tailwind CSS appears to be working');
    } else {
      console.log('⚠️ Tailwind CSS may not be loaded properly');
    }
  } catch (error) {
    console.error('❌ Error testing styling:', error);
  }
}

// Test 5: Check React components
function testReactComponents() {
  console.log('📋 Test 5: React Components');
  try {
    // Check if React is loaded
    if (window.React) {
      console.log('✅ React found in window');
      console.log('📊 React version:', window.React.version);
    } else {
      console.log('⚠️ React not found in window object');
    }

    // Check for React Router
    setTimeout(() => {
      const pathname = window.location.pathname;
      console.log('📍 Current pathname:', pathname);

      // Check for router elements
      const routerElements = document.querySelectorAll(
        '[data-testid], [class*="route"], [class*="router"]'
      );
      console.log(
        `📊 Found ${routerElements.length} potential router elements`
      );
    }, 1000);
  } catch (error) {
    console.error('❌ Error testing React components:', error);
  }
}

// Test 6: Check Network Requests
function testNetworkRequests() {
  console.log('📋 Test 6: Network Requests');

  // Monitor fetch requests
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    console.log('🌐 Fetch request:', args[0]);
    return originalFetch
      .apply(this, args)
      .then((response) => {
        console.log('📡 Fetch response:', args[0], response.status);
        return response;
      })
      .catch((error) => {
        console.error('❌ Fetch error:', args[0], error);
        throw error;
      });
  };
}

// Test 7: Check Console for specific errors
function testConsoleErrors() {
  console.log('📋 Test 7: Console Error Monitoring');

  const originalError = console.error;
  console.error = function (...args) {
    // Log React-specific errors
    if (
      args.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('React') ||
            arg.includes('Component') ||
            arg.includes('Hook') ||
            arg.includes('render') ||
            arg.includes('setState'))
      )
    ) {
      console.log('⚛️ React-related error detected:', ...args);
    }

    // Log AWS/Auth errors
    if (
      args.some(
        (arg) =>
          typeof arg === 'string' &&
          (arg.includes('AWS') ||
            arg.includes('Amplify') ||
            arg.includes('Auth') ||
            arg.includes('Cognito'))
      )
    ) {
      console.log('🔐 Auth-related error detected:', ...args);
    }

    return originalError.apply(this, args);
  };
}

// Run all tests
function runAllTests() {
  testJavaScriptErrors();
  testNetworkRequests();
  testConsoleErrors();

  setTimeout(() => {
    testMainAppLoad();
    testAmplifyConfig();
    testStyling();
    testReactComponents();
  }, 500);

  // Continuous monitoring
  setInterval(() => {
    const root = document.querySelector('#root');
    if (root && root.innerHTML.length === 0) {
      console.warn(
        '⚠️ Dashboard still showing empty - React app may have crashed'
      );
    }
  }, 5000);
}

// Export for use in browser console
window.debugDashboard = {
  runAllTests,
  testMainAppLoad,
  testAmplifyConfig,
  testStyling,
  testReactComponents,
  testNetworkRequests,
};

// Auto-run tests
runAllTests();

console.log(
  '🔍 Dashboard debugging initialized. Use window.debugDashboard for manual testing.'
);
