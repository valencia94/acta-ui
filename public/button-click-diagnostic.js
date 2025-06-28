// Button Click Diagnostic Tool
// Run this in the browser console to debug silent button clicks

function testButtonClicks() {
  console.log('🔧 Testing Button Click Handlers...');

  // Find the project input field
  const projectInput = document.querySelector(
    'input[placeholder*="project"], input[placeholder*="Project"]'
  );
  if (projectInput) {
    console.log('📝 Found project input field');

    // Set a test project ID
    const testProjectId = 'TEST-PROJECT-001';
    projectInput.value = testProjectId;

    // Trigger input change event
    projectInput.dispatchEvent(new Event('input', { bubbles: true }));
    projectInput.dispatchEvent(new Event('change', { bubbles: true }));

    console.log(`✅ Set project ID to: ${testProjectId}`);
  } else {
    console.log('❌ Could not find project input field');
  }

  // Find and test Generate button
  const generateBtn = Array.from(document.querySelectorAll('button')).find(
    (btn) =>
      btn.textContent.includes('Generate') || btn.textContent.includes('Acta')
  );

  if (generateBtn) {
    console.log('🎯 Found Generate button:', generateBtn.textContent);
    console.log('Button disabled:', generateBtn.disabled);
    console.log('Button classes:', generateBtn.className);

    // Add event listener to see if click is registered
    generateBtn.addEventListener(
      'click',
      () => {
        console.log('🖱️ Generate button click detected!');
      },
      { once: true }
    );

    // Simulate click
    console.log('🖱️ Simulating Generate button click...');
    generateBtn.click();

    // Wait a moment then check for toasts
    setTimeout(() => {
      const toasts = document.querySelectorAll(
        '[data-hot-toast], [role="alert"], .toast'
      );
      console.log(`📢 Found ${toasts.length} toast notifications`);
      toasts.forEach((toast, index) => {
        console.log(`Toast ${index + 1}:`, toast.textContent);
      });
    }, 1000);
  } else {
    console.log('❌ Could not find Generate button');
  }

  // Test API connectivity
  console.log('🌐 Testing API connectivity...');
  const apiUrl =
    window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

  fetch(`${apiUrl}/health`)
    .then((response) => {
      console.log('✅ API Health Check:', response.status, response.statusText);
      return response.json();
    })
    .then((data) => {
      console.log('✅ API Response:', data);
    })
    .catch((error) => {
      console.log('❌ API Error:', error.message);
    });
}

// Test React event system
function testReactEvents() {
  console.log('⚛️ Testing React Event System...');

  // Check if React DevTools are available
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ React DevTools detected');
  } else {
    console.log(
      "❌ React DevTools not found - this might indicate React isn't loading properly"
    );
  }

  // Check for React components in the DOM
  const reactElements = document.querySelectorAll(
    '[data-reactroot], [data-react-component]'
  );
  console.log(`Found ${reactElements.length} React root elements`);

  // Test if React event delegation is working
  const testDiv = document.createElement('div');
  testDiv.innerHTML = '<button id="react-test-btn">Test React Events</button>';
  document.body.appendChild(testDiv);

  const testBtn = document.getElementById('react-test-btn');
  testBtn.addEventListener('click', () => {
    console.log('✅ DOM event delegation is working');
    testDiv.remove();
  });

  console.log('🖱️ Click the "Test React Events" button that appeared');
}

// Check for common React/Vite issues
function checkCommonIssues() {
  console.log('🔍 Checking for Common Issues...');

  // Check if HMR is working in dev mode
  if (import.meta.hot) {
    console.log('✅ Hot Module Replacement is active');
  }

  // Check for console errors
  const originalError = console.error;
  const errors = [];
  console.error = (...args) => {
    errors.push(args);
    originalError.apply(console, args);
  };

  setTimeout(() => {
    console.error = originalError;
    if (errors.length > 0) {
      console.log('❌ Console errors detected:');
      errors.forEach((error, index) => {
        console.log(`Error ${index + 1}:`, error);
      });
    } else {
      console.log('✅ No console errors detected');
    }
  }, 2000);

  // Check environment variables
  console.log('🌍 Environment Variables:');
  console.log('NODE_ENV:', process?.env?.NODE_ENV || 'undefined');
  console.log('DEV mode:', import.meta.env.DEV);
  console.log('PROD mode:', import.meta.env.PROD);
  console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
}

// Run all diagnostics
function runFullDiagnostic() {
  console.log('🚀 Running Full Button Diagnostic...');
  console.log('='.repeat(50));

  testButtonClicks();

  setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    testReactEvents();
  }, 2000);

  setTimeout(() => {
    console.log('\n' + '='.repeat(50));
    checkCommonIssues();
  }, 4000);
}

// Make functions available globally
window.testButtonClicks = testButtonClicks;
window.testReactEvents = testReactEvents;
window.checkCommonIssues = checkCommonIssues;
window.runFullDiagnostic = runFullDiagnostic;

console.log('🔧 Button Click Diagnostic Tool Loaded!');
console.log('Run these commands in console:');
console.log('- testButtonClicks() - Test button click handlers');
console.log('- testReactEvents() - Test React event system');
console.log('- checkCommonIssues() - Check for common issues');
console.log('- runFullDiagnostic() - Run all tests');
