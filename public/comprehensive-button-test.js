// ACTA UI Comprehensive Button Test Script
// Copy and paste this into the browser console after logging in to test all functionality

console.log('🧪 ACTA UI COMPREHENSIVE BUTTON FUNCTIONALITY TEST');
console.log('==================================================');
console.log('Starting automated test of all dashboard buttons...');

async function runAllTests() {
  const TEST_PROJECT_ID = '1000000049842296';
  const results = {
    authentication: null,
    projectInput: null,
    buttons: {},
    apiCalls: [],
    errors: [],
  };

  try {
    // Test 1: Check authentication status
    console.log('\n📋 TEST 1: Authentication Status');
    console.log('=================================');

    const userEmail =
      document.querySelector('[data-testid="user-email"], .user-email') ||
      Array.from(document.querySelectorAll('*')).find(
        (el) =>
          el.textContent &&
          el.textContent.includes('@') &&
          el.textContent.includes('.com')
      );

    if (userEmail) {
      results.authentication = 'logged_in';
      console.log('✅ User is logged in:', userEmail.textContent);
    } else {
      results.authentication = 'not_logged_in';
      console.log('❌ User does not appear to be logged in');
      console.log('Please login first and then run this test again');
      return results;
    }

    // Test 2: Project ID Input
    console.log('\n📋 TEST 2: Project ID Input');
    console.log('============================');

    const projectInput =
      document.querySelector(
        'input[placeholder*="Project"], input[placeholder*="project"], input[type="text"]'
      ) ||
      Array.from(document.querySelectorAll('input')).find(
        (input) =>
          input.placeholder.toLowerCase().includes('project') ||
          input.placeholder.toLowerCase().includes('id')
      );

    if (projectInput) {
      projectInput.value = TEST_PROJECT_ID;
      projectInput.dispatchEvent(new Event('input', { bubbles: true }));
      projectInput.dispatchEvent(new Event('change', { bubbles: true }));
      results.projectInput = 'found_and_set';
      console.log(`✅ Found project input and set to: ${TEST_PROJECT_ID}`);
    } else {
      results.projectInput = 'not_found';
      console.log('❌ Could not find project ID input field');
      console.log(
        'Available inputs:',
        Array.from(document.querySelectorAll('input')).map((i) => ({
          type: i.type,
          placeholder: i.placeholder,
          name: i.name,
          id: i.id,
        }))
      );
    }

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 3: Button Discovery and Testing
    console.log('\n📋 TEST 3: Button Discovery and Testing');
    console.log('=======================================');

    const buttons = Array.from(document.querySelectorAll('button'));
    console.log(`Found ${buttons.length} total buttons on page`);

    // Define button mappings
    const buttonMappings = {
      generate: ['generate', 'create', 'build'],
      downloadWord: ['word', 'docx', 'document'],
      downloadPdf: ['pdf'],
      previewPdf: ['preview'],
      sendApproval: ['approval', 'send', 'submit'],
      timeline: ['timeline', 'history'],
      refresh: ['refresh', 'reload'],
    };

    // Find and test each button type
    for (const [buttonType, keywords] of Object.entries(buttonMappings)) {
      const button = buttons.find((btn) => {
        const text = btn.textContent.toLowerCase();
        return (
          keywords.some((keyword) => text.includes(keyword)) &&
          !btn.disabled &&
          btn.offsetParent !== null
        ); // visible
      });

      if (button) {
        console.log(`\n🔄 Testing ${buttonType} button...`);
        console.log(`Button text: "${button.textContent.trim()}"`);

        try {
          // Monitor network requests
          const originalFetch = window.fetch;
          const fetchCalls = [];
          window.fetch = function (...args) {
            fetchCalls.push({
              url: args[0],
              options: args[1] || {},
              timestamp: new Date().toISOString(),
            });
            return originalFetch.apply(this, args);
          };

          // Click the button
          button.click();

          // Wait for potential API calls
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Restore fetch
          window.fetch = originalFetch;

          results.buttons[buttonType] = {
            status: 'clicked',
            buttonText: button.textContent.trim(),
            apiCalls: fetchCalls.filter(
              (call) =>
                call.url.includes('execute-api') ||
                call.url.includes('amazonaws.com')
            ),
          };

          results.apiCalls.push(...fetchCalls);

          console.log(`✅ ${buttonType} button clicked successfully`);
          if (fetchCalls.length > 0) {
            console.log(`📡 Triggered ${fetchCalls.length} API call(s)`);
            fetchCalls.forEach((call) => {
              console.log(`  - ${call.url}`);
            });
          }
        } catch (error) {
          results.buttons[buttonType] = {
            status: 'error',
            error: error.message,
            buttonText: button.textContent.trim(),
          };
          results.errors.push(`${buttonType}: ${error.message}`);
          console.log(`❌ ${buttonType} button error:`, error);
        }

        // Small delay between button tests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        results.buttons[buttonType] = {
          status: 'not_found_or_disabled',
        };
        console.log(`❌ ${buttonType} button not found or disabled`);
      }
    }

    // Test 4: Network Analysis
    console.log('\n📋 TEST 4: Network Analysis');
    console.log('============================');

    const apiCalls = results.apiCalls.filter(
      (call) =>
        call.url.includes('execute-api') || call.url.includes('amazonaws.com')
    );

    console.log(`Total API calls made: ${apiCalls.length}`);

    if (apiCalls.length > 0) {
      console.log('\nAPI Calls Summary:');
      apiCalls.forEach((call, index) => {
        console.log(`${index + 1}. ${call.url}`);
        if (call.options.headers && call.options.headers.Authorization) {
          console.log('   ✅ Has Authorization header');
        } else {
          console.log('   ❌ Missing Authorization header');
        }
      });
    }

    // Test 5: DOM Inspection
    console.log('\n📋 TEST 5: DOM Elements Check');
    console.log('==============================');

    const modalCheck =
      document.querySelector('[role="dialog"], .modal, .pdf-preview') !== null;
    console.log(
      `PDF Preview Modal: ${modalCheck ? '✅ Found' : '❌ Not found'}`
    );

    const toastCheck =
      document.querySelector('.toast, .notification, [data-sonner-toaster]') !==
      null;
    console.log(
      `Toast Notifications: ${toastCheck ? '✅ Found' : '❌ Not found'}`
    );
  } catch (error) {
    results.errors.push(`Main test error: ${error.message}`);
    console.error('❌ Main test error:', error);
  }

  // Final Summary
  console.log('\n🎯 COMPREHENSIVE TEST SUMMARY');
  console.log('=============================');

  const totalButtons = Object.keys(results.buttons).length;
  const successfulButtons = Object.values(results.buttons).filter(
    (b) => b.status === 'clicked'
  ).length;
  const apiCallsCount = results.apiCalls.filter(
    (call) =>
      call.url.includes('execute-api') || call.url.includes('amazonaws.com')
  ).length;

  console.log(
    `Authentication: ${results.authentication === 'logged_in' ? '✅' : '❌'} ${results.authentication}`
  );
  console.log(
    `Project Input: ${results.projectInput === 'found_and_set' ? '✅' : '❌'} ${results.projectInput}`
  );
  console.log(`Buttons Working: ${successfulButtons}/${totalButtons}`);
  console.log(`API Calls Made: ${apiCallsCount}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    results.errors.forEach((error) => console.log(`  - ${error}`));
  }

  console.log('\n📊 Individual Button Results:');
  Object.entries(results.buttons).forEach(([buttonType, result]) => {
    const status =
      result.status === 'clicked'
        ? '✅'
        : result.status === 'error'
          ? '❌'
          : '⚠️';
    console.log(`  ${buttonType}: ${status} ${result.status}`);
    if (result.apiCalls && result.apiCalls.length > 0) {
      console.log(`    └─ API calls: ${result.apiCalls.length}`);
    }
  });

  console.log('\n💡 Next Steps:');
  console.log(
    '1. Check the Network tab in DevTools for detailed API responses'
  );
  console.log('2. Look for any error messages in the console');
  console.log('3. Verify that API calls include Authorization headers');
  console.log('4. Check for toast notifications after button clicks');

  // Save results to window for further inspection
  window.testResults = results;
  console.log('\n✅ Test completed! Results saved to window.testResults');

  return results;
}

// Auto-run the test
runAllTests().catch((error) => {
  console.error('❌ Test failed to run:', error);
});

// Helper function to check specific button
window.testButton = function (buttonText) {
  const button = Array.from(document.querySelectorAll('button')).find((btn) =>
    btn.textContent.toLowerCase().includes(buttonText.toLowerCase())
  );

  if (button) {
    console.log(`Testing button: "${button.textContent}"`);
    button.click();
    console.log('Button clicked - check Network tab for API calls');
  } else {
    console.log(`Button containing "${buttonText}" not found`);
    console.log(
      'Available buttons:',
      Array.from(document.querySelectorAll('button')).map((b) =>
        b.textContent.trim()
      )
    );
  }
};

// Helper function to check API endpoints manually
window.checkAPIs = async function () {
  const apis = [
    'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health',
    'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/timeline/1000000049842296',
    'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/project-summary/1000000049842296',
  ];

  console.log('🔍 Testing API endpoints directly...');

  for (const api of apis) {
    try {
      const response = await fetch(api);
      console.log(`${api}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${api}: ❌ ${error.message}`);
    }
  }
};

console.log('\n🛠️ Available helper functions:');
console.log('- runAllTests() - Run the complete test suite');
console.log('- testButton("generate") - Test a specific button');
console.log('- checkAPIs() - Test API endpoints directly');
console.log('- window.testResults - View last test results');
