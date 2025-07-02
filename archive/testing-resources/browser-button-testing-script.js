// Live Environment Button Testing Script
// Run this in the browser console on https://d7t9x3j66yd8k.cloudfront.net

console.log('🚀 Starting ACTA-UI Button Testing Script...');

// Test configuration
const config = {
  apiBaseUrl: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
  userPoolId: 'us-east-2_FyHLtOhiY',
  appClientId: 'dshos5iou44tuach7ta3ici5m',
  expectedButtons: [
    'Generate ACTA',
    'Download Word',
    'Download PDF',
    'Preview PDF',
    'Send Approval',
    'Timeline',
    'Project Summary',
    'Document Status',
  ],
};

// Helper function to find buttons by text content
function findButtonByText(text) {
  const buttons = Array.from(
    document.querySelectorAll('button, [role="button"], a')
  );
  return buttons.find(
    (btn) =>
      btn.textContent.trim().toLowerCase().includes(text.toLowerCase()) ||
      btn
        .getAttribute('aria-label')
        ?.toLowerCase()
        .includes(text.toLowerCase()) ||
      btn.title?.toLowerCase().includes(text.toLowerCase())
  );
}

// Helper function to find buttons by common selectors
function findAllActionButtons() {
  const selectors = [
    'button[data-testid*="generate"]',
    'button[data-testid*="download"]',
    'button[data-testid*="preview"]',
    'button[data-testid*="send"]',
    'button[data-testid*="timeline"]',
    'button[data-testid*="summary"]',
    'button[data-testid*="status"]',
    '.btn-primary',
    '.btn-secondary',
    '[role="button"]',
  ];

  const buttons = new Set();
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((btn) => buttons.add(btn));
  });

  return Array.from(buttons);
}

// Network monitoring setup
let networkRequests = [];
const originalFetch = window.fetch;
window.fetch = function (...args) {
  const url = args[0];
  console.log('🌐 Fetch request intercepted:', url);
  networkRequests.push({
    type: 'fetch',
    url: url,
    timestamp: new Date().toISOString(),
    args: args,
  });
  return originalFetch.apply(this, args);
};

// XMLHttpRequest monitoring
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, ...args) {
  console.log('🌐 XHR request intercepted:', method, url);
  networkRequests.push({
    type: 'xhr',
    method: method,
    url: url,
    timestamp: new Date().toISOString(),
  });
  return originalXHROpen.apply(this, [method, url, ...args]);
};

// Authentication check
function checkAuthStatus() {
  console.log('🔐 Checking authentication status...');

  // Check for common auth tokens in localStorage/sessionStorage
  const authChecks = [
    { key: 'amplify-authenticator-authState', storage: 'localStorage' },
    { key: 'amplify-signin-token', storage: 'localStorage' },
    {
      key: 'CognitoIdentityServiceProvider',
      storage: 'localStorage',
      partial: true,
    },
    { key: 'aws-amplify-auth', storage: 'sessionStorage' },
    { key: 'idToken', storage: 'localStorage' },
    { key: 'accessToken', storage: 'localStorage' },
  ];

  const authStatus = {};
  authChecks.forEach((check) => {
    const storage =
      check.storage === 'localStorage' ? localStorage : sessionStorage;
    if (check.partial) {
      // Check for keys that start with the pattern
      const keys = Object.keys(storage).filter((key) =>
        key.includes(check.key)
      );
      authStatus[check.key] = keys.length > 0 ? keys : null;
    } else {
      authStatus[check.key] = storage.getItem(check.key)
        ? 'Present'
        : 'Not found';
    }
  });

  console.log('Auth status:', authStatus);
  return authStatus;
}

// Button discovery and testing
function discoverButtons() {
  console.log('🔍 Discovering buttons on page...');

  const allButtons = findAllActionButtons();
  console.log(
    `Found ${allButtons.length} potential action buttons:`,
    allButtons
  );

  const buttonInfo = allButtons.map((btn, index) => ({
    index: index,
    element: btn,
    text: btn.textContent.trim(),
    id: btn.id,
    classes: btn.className,
    testId: btn.getAttribute('data-testid'),
    ariaLabel: btn.getAttribute('aria-label'),
    disabled: btn.disabled,
    visible: btn.offsetWidth > 0 && btn.offsetHeight > 0,
  }));

  console.table(buttonInfo);
  return buttonInfo;
}

// Test individual button
function testButton(buttonInfo, expectedEndpoint) {
  console.log(`🧪 Testing button: ${buttonInfo.text}`);

  // Clear previous network requests
  const startRequestCount = networkRequests.length;

  // Add click event listener to monitor
  const originalClick = buttonInfo.element.onclick;
  let clickEventFired = false;

  buttonInfo.element.addEventListener(
    'click',
    function (e) {
      clickEventFired = true;
      console.log('👆 Click event fired for button:', buttonInfo.text);
    },
    { once: true }
  );

  // Simulate click
  buttonInfo.element.click();

  // Wait a moment for async operations
  setTimeout(() => {
    const newRequests = networkRequests.slice(startRequestCount);
    console.log(`📊 Button test results for "${buttonInfo.text}":`, {
      clickEventFired: clickEventFired,
      networkRequestsMade: newRequests.length,
      requests: newRequests,
    });
  }, 1000);
}

// Main testing function
async function runButtonTests() {
  console.log('🎯 Starting comprehensive button tests...');

  // 1. Check authentication
  const authStatus = checkAuthStatus();

  // 2. Discover buttons
  const buttons = discoverButtons();

  // 3. Test each button
  console.log('🚀 Starting button click tests...');

  buttons.forEach((buttonInfo, index) => {
    if (buttonInfo.visible && !buttonInfo.disabled) {
      setTimeout(() => {
        testButton(buttonInfo);
      }, index * 2000); // Stagger tests by 2 seconds
    }
  });

  // 4. Generate final report
  setTimeout(
    () => {
      generateTestReport(authStatus, buttons, networkRequests);
    },
    buttons.length * 2000 + 3000
  );
}

// Generate test report
function generateTestReport(authStatus, buttons, requests) {
  console.log('📋 Generating test report...');

  const report = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    authStatus: authStatus,
    buttonsFound: buttons.length,
    visibleButtons: buttons.filter((b) => b.visible).length,
    enabledButtons: buttons.filter((b) => !b.disabled).length,
    networkRequests: requests.length,
    apiRequests: requests.filter(
      (r) =>
        r.url &&
        (r.url.includes('api.acta.ikusii.com') || r.url.includes('/api/'))
    ),
    buttons: buttons,
    allRequests: requests,
  };

  console.log('📊 FINAL TEST REPORT:', report);

  // Also display a summary table
  console.table(
    buttons.map((b) => ({
      Text: b.text,
      Visible: b.visible,
      Enabled: !b.disabled,
      ID: b.id,
      TestID: b.testId,
    }))
  );

  return report;
}

// Export functions to global scope for manual use
window.actaTestSuite = {
  runButtonTests,
  discoverButtons,
  testButton,
  checkAuthStatus,
  findButtonByText,
  networkRequests,
  generateTestReport,
};

// Auto-run basic discovery
console.log('🔍 Running initial button discovery...');
discoverButtons();
checkAuthStatus();

console.log(
  '✅ Test suite loaded! Run actaTestSuite.runButtonTests() to start comprehensive testing.'
);
console.log('📚 Available functions:', Object.keys(window.actaTestSuite));
