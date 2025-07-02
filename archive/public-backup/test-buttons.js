/* eslint-disable no-console */
/* eslint-disable no-undef */

// Test Button Functionality
// Run this in browser console: testButtons()

function testButtons() {
  console.log('🧪 Testing Button Functionality...');
  console.log('='.repeat(50));

  // Test API connectivity first
  console.log('1. Testing API connectivity...');
  const apiUrl = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

  fetch(`${apiUrl}/health`)
    .then((response) => {
      console.log(`✅ API Health: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      console.log('✅ API Response:', data);
    })
    .catch((error) => {
      console.log('❌ API Error:', error.message);
    });

  // Fill project ID input
  console.log('\n2. Setting up test project ID...');
  const projectInput = document.querySelector(
    'input[placeholder*="Project"], input[placeholder*="project"]'
  );

  if (projectInput) {
    const testProjectId = '1000000064013473';
    projectInput.value = testProjectId;
    projectInput.dispatchEvent(new Event('input', { bubbles: true }));
    projectInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`✅ Set project ID: ${testProjectId}`);
  } else {
    console.log('❌ Project input field not found');
    return;
  }

  // Test Generate button
  console.log('\n3. Testing Generate Acta button...');
  setTimeout(() => {
    const generateBtn = Array.from(document.querySelectorAll('button')).find(
      (btn) => btn.textContent?.includes('Generate')
    );

    if (generateBtn) {
      console.log('Found Generate button:', generateBtn.textContent);
      console.log('Button disabled:', generateBtn.disabled);

      if (!generateBtn.disabled) {
        console.log('🔘 Clicking Generate button...');
        generateBtn.click();

        // Monitor for toast notifications
        setTimeout(() => {
          const toasts = document.querySelectorAll('[data-hot-toast]');
          console.log(`📢 Toast notifications found: ${toasts.length}`);
          toasts.forEach((toast, index) => {
            console.log(`Toast ${index + 1}:`, toast.textContent);
          });
        }, 1000);
      } else {
        console.log('❌ Generate button is disabled');
      }
    } else {
      console.log('❌ Generate button not found');
    }
  }, 500);

  // Test other buttons after a delay
  setTimeout(() => {
    console.log('\n4. Testing other buttons...');

    const buttons = [
      { name: 'Download PDF', text: 'PDF' },
      { name: 'Download Word', text: 'Word' },
      { name: 'Send Approval', text: 'Send' },
      { name: 'Refresh', text: 'Refresh' },
    ];

    buttons.forEach((btnInfo) => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.includes(btnInfo.text)
      );

      if (btn && !btn.disabled) {
        console.log(`🔘 Testing ${btnInfo.name} button...`);
        btn.click();
      }
    });
  }, 3000);

  console.log('\n5. Monitor the browser for:');
  console.log('   - Toast notifications (top-right)');
  console.log('   - Console messages');
  console.log('   - Network requests (DevTools > Network)');
  console.log('   - Any downloads or new tabs');
}

// Test specific API endpoints
function testApiEndpoints() {
  console.log('🌐 Testing API Endpoints...');
  const apiUrl = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
  const testProjectId = '1000000064013473';

  const endpoints = [
    { name: 'Health Check', url: `${apiUrl}/health` },
    {
      name: 'Project Summary',
      url: `${apiUrl}/project-summary/${testProjectId}`,
    },
    {
      name: 'Extract Project Data',
      url: `${apiUrl}/extract-project-place/${testProjectId}`,
    },
  ];

  endpoints.forEach((endpoint) => {
    console.log(`\nTesting ${endpoint.name}...`);
    fetch(endpoint.url, {
      method: endpoint.name === 'Extract Project Data' ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => {
        console.log(
          `${endpoint.name}: ${response.status} ${response.statusText}`
        );
        if (response.ok) {
          return response.json();
        }
        return response.text();
      })
      .then((data) => {
        console.log(
          `${endpoint.name} Response:`,
          typeof data === 'string' ? data.substring(0, 200) : data
        );
      })
      .catch((error) => {
        console.log(`${endpoint.name} Error:`, error.message);
      });
  });
}

// Make functions available globally
window.testButtons = testButtons;
window.testApiEndpoints = testApiEndpoints;

console.log('🔧 Button Test Script Loaded!');
console.log('Run: testButtons() - Test button functionality');
console.log('Run: testApiEndpoints() - Test API endpoints directly');
