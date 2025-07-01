/*
🧪 ACTA-UI BUTTON FUNCTIONALITY TEST - ENHANCED DEBUGGING
Run this in the browser console after the auth fix

This script will:
1. Check if auth is working
2. Test all dashboard buttons  
3. Monitor API calls in real-time
4. Verify network requests include Authorization headers
5. Report detailed button behavior
*/

console.log('🧪 ACTA-UI BUTTON FUNCTIONALITY TEST - ENHANCED DEBUGGING');
console.log('='.repeat(65));

// Enhanced Network Monitoring
let networkRequests = [];
const originalFetch = window.fetch;
window.fetch = function (...args) {
  console.log(
    '🌐 FETCH REQUEST:',
    args[0],
    args[1] ? JSON.stringify(args[1], null, 2) : ''
  );
  networkRequests.push({
    url: args[0],
    options: args[1],
    timestamp: new Date().toISOString(),
  });
  return originalFetch
    .apply(this, args)
    .then((response) => {
      console.log(
        '📡 FETCH RESPONSE:',
        response.status,
        response.statusText,
        'for',
        args[0]
      );
      return response;
    })
    .catch((error) => {
      console.error('❌ FETCH ERROR:', error, 'for', args[0]);
      throw error;
    });
};

// Monitor XMLHttpRequest too
const originalXHR = window.XMLHttpRequest;
window.XMLHttpRequest = function () {
  const xhr = new originalXHR();
  const originalOpen = xhr.open;
  const originalSend = xhr.send;

  xhr.open = function (method, url, ...args) {
    console.log(`🌐 XHR ${method}:`, url);
    return originalOpen.apply(this, [method, url, ...args]);
  };

  xhr.send = function (data) {
    console.log('📡 XHR SEND:', data ? JSON.stringify(data) : 'no data');
    return originalSend.apply(this, [data]);
  };

  return xhr;
};

// Test 1: Environment Check
function testEnvironment() {
  console.log('\n📋 1. ENVIRONMENT CHECK:');

  const env = {
    apiUrl: window.location.origin.includes('localhost')
      ? 'http://localhost:8000' // Dev
      : 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod', // Prod
    cognitoRegion: 'us-east-2',
    cognitoPoolId: 'us-east-2_FyHLtOhiY',
    cognitoClientId: '1hdn8b19ub2kmfkuse8rsjpv8e',
  };

  console.log(
    '- Environment detected:',
    window.location.origin.includes('localhost') ? 'Development' : 'Production'
  );
  console.log('- API URL:', env.apiUrl);
  console.log('- Cognito Pool ID:', env.cognitoPoolId);
  console.log('- Cognito Client ID:', env.cognitoClientId);

  return env;
}

// Test 2: Auth Status Check
async function testAuthStatus() {
  console.log('\n🔐 2. AUTH STATUS CHECK:');

  try {
    // Check localStorage token
    const localToken = localStorage.getItem('ikusi.jwt');
    console.log(
      '- localStorage token:',
      localToken ? `Present (${localToken.length} chars)` : 'Missing'
    );

    // Check if user is on login page or dashboard
    const isOnLogin = window.location.pathname.includes('login');
    const isOnDashboard = window.location.pathname.includes('dashboard');
    console.log('- Current page:', window.location.pathname);
    console.log('- On login page:', isOnLogin);
    console.log('- On dashboard page:', isOnDashboard);

    // Check if Amplify auth is available
    if (window.AWS && window.AWS.config) {
      console.log('- AWS SDK loaded:', true);
    } else {
      console.log('- AWS SDK loaded:', false);
    }

    return { localToken, isOnLogin, isOnDashboard };
    // Main Test Runner
    async function runAllTests() {
      console.log('\n🚀 RUNNING COMPLETE BUTTON FUNCTIONALITY TEST');
      console.log('=' * 50);

      try {
        // Run all tests in sequence
        const env = testEnvironment();
        const authStatus = await testAuthStatus();
        const projectInput = testProjectIdInput();
        const buttons = testButtonAvailability();

        // Test button clicks
        testButtonClicks(buttons);

        console.log('\n📊 TEST SUMMARY:');
        console.log('- Environment:', env ? '✅' : '❌');
        console.log('- Auth Status:', authStatus ? '✅' : '❌');
        console.log('- Project Input:', projectInput ? '✅' : '❌');
        console.log(
          '- Buttons Found:',
          Object.keys(buttons).filter((k) => buttons[k]).length,
          '/',
          Object.keys(buttons).length
        );

        console.log('\n💡 NEXT STEPS:');
        console.log(
          '1. Watch the console for network requests as you click buttons'
        );
        console.log('2. Check the Network tab in DevTools');
        console.log('3. Look for Authorization headers in requests');
        console.log("4. Report any buttons that don't trigger API calls");
      } catch (error) {
        console.error('❌ Test execution failed:', error);
      }
    }

    // Auto-run after page load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runAllTests);
    } else {
      runAllTests();
    }

    // Expose global functions for manual testing
    window.testButtonFunctionality = {
      runAllTests,
      testEnvironment,
      testAuthStatus,
      testButtonAvailability,
      testProjectIdInput,
      testButtonClicks,
      getNetworkRequests: () => networkRequests,
      clearNetworkRequests: () => {
        networkRequests = [];
      },
    };

    console.log('\n🔧 MANUAL TESTING COMMANDS:');
    console.log('- testButtonFunctionality.runAllTests() - Run all tests');
    console.log(
      '- testButtonFunctionality.getNetworkRequests() - View all network requests'
    );
    console.log(
      '- testButtonFunctionality.clearNetworkRequests() - Clear request log'
    );

    // Test 3: Button Availability Check
    function testButtonAvailability() {
      console.log('\n🖱️ 3. BUTTON AVAILABILITY CHECK:');

      const buttonTests = [
        {
          id: 'generate',
          name: 'Generate ACTA',
          selector:
            '[data-testid="generate-button"], button:contains("Generate"), button[id*="generate"]',
        },
        {
          id: 'word',
          name: 'Download Word',
          selector:
            '[data-testid="word-button"], button:contains("Word"), button[id*="word"]',
        },
        {
          id: 'pdf',
          name: 'Download PDF',
          selector:
            '[data-testid="pdf-button"], button:contains("PDF"), button[id*="pdf"]',
        },
        {
          id: 'preview',
          name: 'Preview PDF',
          selector:
            '[data-testid="preview-button"], button:contains("Preview"), button[id*="preview"]',
        },
        {
          id: 'approval',
          name: 'Send Approval',
          selector:
            '[data-testid="approval-button"], button:contains("Approval"), button[id*="approval"]',
        },
      ];

      const foundButtons = {};

      buttonTests.forEach((test) => {
        // Try multiple selectors
        const selectors = test.selector.split(', ');
        let button = null;

        for (const selector of selectors) {
          button = document.querySelector(selector);
          if (button) break;
        }

        if (!button) {
          // Try finding by text content
          const allButtons = document.querySelectorAll('button');
          button = Array.from(allButtons).find(
            (btn) =>
              btn.textContent.toLowerCase().includes(test.id) ||
              btn.textContent
                .toLowerCase()
                .includes(test.name.toLowerCase().split(' ')[0])
          );
        }

        foundButtons[test.id] = button;
        console.log(`- ${test.name}:`, button ? '✅ Found' : '❌ Not found');

        if (button) {
          console.log(`  - Element:`, button.tagName, button.className);
          console.log(`  - Disabled:`, button.disabled);
          console.log(
            `  - Visible:`,
            !button.hidden && button.offsetParent !== null
          );
        }
      });

      return foundButtons;
    }

    // Test 4: Project ID Input Check
    function testProjectIdInput() {
      console.log('\n📋 4. PROJECT ID INPUT CHECK:');

      const projectIdSelectors = [
        'input[data-testid="project-id"]',
        'input[placeholder*="project"]',
        'input[placeholder*="Project"]',
        'input[id*="project"]',
        'input[name*="project"]',
      ];

      let projectIdInput = null;
      for (const selector of projectIdSelectors) {
        projectIdInput = document.querySelector(selector);
        if (projectIdInput) break;
      }

      if (!projectIdInput) {
        // Try finding any text input
        const inputs = document.querySelectorAll(
          'input[type="text"], input:not([type])'
        );
        projectIdInput = inputs[0]; // Assume first text input might be project ID
      }

      console.log(
        '- Project ID input found:',
        projectIdInput ? '✅ Found' : '❌ Not found'
      );

      if (projectIdInput) {
        console.log(`  - Current value: "${projectIdInput.value}"`);
        console.log(`  - Placeholder: "${projectIdInput.placeholder}"`);

        // Set test project ID if empty
        if (!projectIdInput.value) {
          projectIdInput.value = '1000000049842296';
          projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
          projectIdInput.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('  - Set test project ID: 1000000049842296');
        }
      }

      return projectIdInput;
    }

    // Enhanced Button Click Testing
    function testButtonClicks(buttons) {
      console.log('\n🔘 5. BUTTON CLICK TESTING:');
      console.log('Starting button click tests...');

      const testButton = async (buttonElement, buttonName) => {
        console.log(`\n🔵 Testing ${buttonName}:`);

        if (!buttonElement) {
          console.log(`❌ Button not found`);
          return;
        }

        if (buttonElement.disabled) {
          console.log(`⚠️ Button is disabled`);
          return;
        }

        // Clear previous network requests for this test
        const beforeRequestCount = networkRequests.length;

        console.log(`📱 Clicking ${buttonName}...`);
        buttonElement.click();

        // Wait a moment for any async operations
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check if any new network requests were made
        const newRequests = networkRequests.slice(beforeRequestCount);

        if (newRequests.length > 0) {
          console.log(`✅ Network requests triggered: ${newRequests.length}`);
          newRequests.forEach((req, index) => {
            console.log(`  Request ${index + 1}:`, req.url);
            if (req.options && req.options.headers) {
              console.log(`  Headers:`, req.options.headers);
            }
          });
        } else {
          console.log(`❌ No network requests detected`);
        }

        // Check for any new toast messages or UI changes
        const toasts = document.querySelectorAll(
          '[role="alert"], .toast, .notification, .message'
        );
        if (toasts.length > 0) {
          console.log(`📢 UI Messages found: ${toasts.length}`);
          toasts.forEach((toast, index) => {
            console.log(`  Message ${index + 1}: ${toast.textContent.trim()}`);
          });
        }
      };

      // Test each button
      Object.entries(buttons).forEach(async ([id, button], index) => {
        setTimeout(() => testButton(button, id), index * 3000); // Space out tests
      });
    }

    if (isOnLogin) {
      console.log('⚠️ Currently on login page - auth check skipped');
      return { authenticated: false, reason: 'on_login_page' };
    }

    if (localToken && isOnDashboard) {
      console.log('✅ User appears to be authenticated');
      return { authenticated: true, token: localToken };
    } else {
      console.log('❌ User not authenticated');
      return { authenticated: false, reason: 'no_token_or_wrong_page' };
    }
  } catch (error) {
    console.log('❌ Auth check failed:', error);
    return { authenticated: false, error };
  }
}

// Test 3: API Connectivity
async function testAPIConnectivity(authResult) {
  console.log('\n🔗 3. API CONNECTIVITY TEST:');

  const apiUrl = window.location.origin.includes('localhost')
    ? 'http://localhost:8000'
    : 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

  try {
    // Test health endpoint (no auth required)
    console.log('Testing health endpoint...');
    const healthResponse = await fetch(`${apiUrl}/health`);
    console.log(
      '- Health endpoint:',
      healthResponse.status,
      healthResponse.statusText
    );

    if (!authResult.authenticated) {
      console.log('⚠️ Skipping authenticated endpoint tests (not logged in)');
      return { health: healthResponse.ok, authenticated: false };
    }

    // Test protected endpoint
    console.log('Testing protected endpoint with auth token...');
    const headers = {
      Authorization: `Bearer ${authResult.token}`,
      'Content-Type': 'application/json',
    };

    const projectsResponse = await fetch(`${apiUrl}/projects`, { headers });
    console.log(
      '- Projects endpoint:',
      projectsResponse.status,
      projectsResponse.statusText
    );

    if (projectsResponse.ok) {
      console.log('✅ API connectivity with auth is working!');
    } else {
      console.log('❌ API calls failing despite auth token');
    }

    return {
      health: healthResponse.ok,
      authenticated: projectsResponse.ok,
      status: projectsResponse.status,
    };
  } catch (error) {
    console.log('❌ API connectivity test failed:', error);
    return { health: false, authenticated: false, error };
  }
}

// Test 4: Button Functionality
function testButtonFunctionality() {
  console.log('\n🎯 4. BUTTON FUNCTIONALITY TEST:');

  if (!window.location.pathname.includes('dashboard')) {
    console.log('❌ Not on dashboard - navigate to /dashboard first');
    return { onDashboard: false };
  }

  // Find project ID input
  const projectIdInput = document.querySelector('#projectId');
  if (!projectIdInput) {
    console.log('❌ Project ID input not found');
    return { projectIdInput: false };
  }
  console.log('✅ Project ID input found');

  // Set test project ID if empty
  if (!projectIdInput.value) {
    projectIdInput.value = '1000000049842296';
    projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Set test project ID: 1000000049842296');
  }

  // Find all buttons
  const buttons = document.querySelectorAll('button');
  console.log(`✅ Found ${buttons.length} total buttons`);

  // Find specific ACTA buttons
  const actaButtons = {
    generate: Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Generate')
    ),
    approval: Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Send Approval')
    ),
    word: Array.from(buttons).find((btn) => btn.textContent?.includes('Word')),
    pdf: Array.from(buttons).find((btn) => btn.textContent?.includes('PDF')),
    preview: Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Preview')
    ),
  };

  console.log('\n🎯 ACTA Button Status:');
  Object.entries(actaButtons).forEach(([name, button]) => {
    if (button) {
      const isDisabled = button.disabled;
      console.log(
        `- ${name.toUpperCase()}: ✅ Found ${isDisabled ? '(disabled)' : '(enabled)'}`
      );
    } else {
      console.log(`- ${name.toUpperCase()}: ❌ Missing`);
    }
  });

  return {
    onDashboard: true,
    projectIdInput: true,
    buttons: actaButtons,
    totalButtons: buttons.length,
  };
}

// Test 5: Simulate Button Click
function testButtonClick(buttonName = 'generate') {
  console.log(`\n🖱️ 5. TESTING ${buttonName.toUpperCase()} BUTTON CLICK:`);

  const buttons = {
    generate: Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Generate')
    ),
    word: Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Word')
    ),
    pdf: Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('PDF')
    ),
    preview: Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Preview')
    ),
  };

  const button = buttons[buttonName];
  if (!button) {
    console.log(`❌ ${buttonName} button not found`);
    return false;
  }

  if (button.disabled) {
    console.log(`❌ ${buttonName} button is disabled`);
    return false;
  }

  console.log(`🖱️ Clicking ${buttonName} button...`);
  button.click();
  console.log(
    `✅ ${buttonName} button clicked - check for toast notifications or network activity`
  );
  return true;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive button functionality test...\n');

  const env = testEnvironment();
  const auth = await testAuthStatus();
  const api = await testAPIConnectivity(auth);
  const buttons = testButtonFunctionality();

  console.log('\n📊 TEST SUMMARY:');
  console.log('='.repeat(60));
  console.log('- Environment:', '✅ Configured');
  console.log(
    '- Authentication:',
    auth.authenticated ? '✅ Working' : '❌ Failed'
  );
  console.log('- API Health:', api.health ? '✅ Working' : '❌ Failed');
  console.log('- API Auth:', api.authenticated ? '✅ Working' : '❌ Failed');
  console.log(
    '- Dashboard:',
    buttons.onDashboard ? '✅ Accessible' : '❌ Not on dashboard'
  );
  console.log(
    '- Buttons Found:',
    buttons.buttons ? Object.keys(buttons.buttons).length : 0
  );

  if (auth.authenticated && api.authenticated && buttons.onDashboard) {
    console.log('\n🎉 ALL SYSTEMS GO! Buttons should be functional.');
    console.log('\n💡 To test a specific button, run:');
    console.log('   testButtonClick("generate")  // Test generate button');
    console.log('   testButtonClick("word")      // Test word download');
    console.log('   testButtonClick("pdf")       // Test PDF download');
    console.log('   testButtonClick("preview")   // Test PDF preview');
  } else {
    console.log('\n⚠️ Issues detected - buttons may not work properly');
    if (!auth.authenticated) console.log('   → Need to log in first');
    if (!api.authenticated) console.log('   → API authentication failing');
    if (!buttons.onDashboard) console.log('   → Need to navigate to dashboard');
  }

  return { env, auth, api, buttons };
}

// Make functions available globally for manual testing
window.testActaUI = {
  runAllTests,
  testEnvironment,
  testAuthStatus,
  testAPIConnectivity,
  testButtonFunctionality,
  testButtonClick,
};

console.log(
  '✅ Test functions loaded! Run runAllTests() to start comprehensive test.'
);
console.log('📝 Individual functions available as window.testActaUI.*');

// Auto-run if we're on the dashboard
if (window.location.pathname.includes('dashboard')) {
  console.log('🎯 Dashboard detected - running automated test in 2 seconds...');
  setTimeout(runAllTests, 2000);
}
