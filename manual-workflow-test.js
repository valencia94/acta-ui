// Manual Workflow Testing Script for ACTA-UI
// Run this in the browser console on https://d7t9x3j66yd8k.cloudfront.net/dashboard

console.log('🧪 Starting Manual Workflow Test...');

// Test 1: Check if we're on the dashboard
function checkDashboardAccess() {
  console.log('📍 Test 1: Dashboard Access');

  const currentPath = window.location.pathname;
  const isOnDashboard = currentPath === '/dashboard' || currentPath === '/';

  console.log('Current path:', currentPath);
  console.log('Dashboard accessible:', isOnDashboard);

  if (!isOnDashboard) {
    console.log('❌ Not on dashboard - trying to navigate...');
    window.location.href = '/dashboard';
    return false;
  }

  console.log('✅ Dashboard is accessible');
  return true;
}

// Test 2: Check if Manual Entry mode is available
function checkManualEntryMode() {
  console.log('\n📍 Test 2: Manual Entry Mode');

  // Look for the mode toggle buttons
  const modeButtons = document.querySelectorAll('button');
  let manualModeButton = null;

  for (const button of modeButtons) {
    if (button.textContent.includes('Manual Entry')) {
      manualModeButton = button;
      break;
    }
  }

  if (!manualModeButton) {
    console.log('❌ Manual Entry mode button not found');
    console.log(
      'Available buttons:',
      Array.from(modeButtons).map((b) => b.textContent)
    );
    return false;
  }

  console.log('✅ Manual Entry mode button found');

  // Click the manual entry mode button
  console.log('🖱️ Clicking Manual Entry mode...');
  manualModeButton.click();

  // Wait a moment for the UI to update
  setTimeout(() => {
    const projectIdInput =
      document.querySelector('input[placeholder*="project ID"]') ||
      document.querySelector('input[id="projectId"]');

    if (projectIdInput) {
      console.log('✅ Manual Entry mode activated - Project ID input found');
      console.log('Project ID input:', projectIdInput);
    } else {
      console.log(
        '❌ Manual Entry mode not working - Project ID input not found'
      );
    }
  }, 1000);

  return true;
}

// Test 3: Test Project ID input functionality
function testProjectIdInput() {
  console.log('\n📍 Test 3: Project ID Input');

  setTimeout(() => {
    const projectIdInput =
      document.querySelector('input[placeholder*="project ID"]') ||
      document.querySelector('input[id="projectId"]');

    if (!projectIdInput) {
      console.log('❌ Project ID input not found');
      return;
    }

    console.log('✅ Project ID input found');

    // Test entering a sample project ID
    const testProjectId = '1000000064013473';
    projectIdInput.value = testProjectId;
    projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));

    console.log('🔤 Entered test Project ID:', testProjectId);
    console.log('Input value:', projectIdInput.value);

    // Check if buttons become enabled
    setTimeout(() => {
      const actaButtons = document.querySelectorAll('button');
      let enabledButtons = [];
      let disabledButtons = [];

      for (const button of actaButtons) {
        const text = button.textContent.toLowerCase();
        if (
          text.includes('generate') ||
          text.includes('download') ||
          text.includes('preview') ||
          text.includes('send')
        ) {
          if (button.disabled) {
            disabledButtons.push(button.textContent);
          } else {
            enabledButtons.push(button.textContent);
          }
        }
      }

      console.log('✅ Enabled action buttons:', enabledButtons);
      console.log('❌ Disabled action buttons:', disabledButtons);
    }, 500);
  }, 1500);
}

// Test 4: Check authentication status
function checkAuthStatus() {
  console.log('\n📍 Test 4: Authentication Status');

  const token = localStorage.getItem('ikusi.jwt');
  console.log('JWT token exists:', !!token);

  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', payload);
      console.log('Token expires:', new Date(payload.exp * 1000));
    } catch (e) {
      console.log('❌ Invalid JWT token format');
    }
  }

  // Check if user info is available
  const userEmail = document.querySelector(
    '[class*="text-teal-600"]'
  )?.textContent;
  if (userEmail && userEmail.includes('@')) {
    console.log('✅ User email found in UI:', userEmail);
  } else {
    console.log('❌ User email not found in UI');
  }
}

// Test 5: Check for error messages or backend status
function checkBackendStatus() {
  console.log('\n📍 Test 5: Backend Status');

  // Look for any error messages or status indicators
  const toastMessages = document.querySelectorAll('[class*="toast"]');
  console.log('Toast messages found:', toastMessages.length);

  // Check if backend diagnostic button exists
  const testBackendButton = Array.from(
    document.querySelectorAll('button')
  ).find((btn) => btn.textContent.includes('Test Backend'));

  if (testBackendButton) {
    console.log('✅ Backend test button found');
    console.log('🖱️ Clicking backend test...');
    testBackendButton.click();
  } else {
    console.log('❌ Backend test button not found');
  }
}

// Test 6: Visual inspection checklist
function printVisualChecklist() {
  console.log('\n📍 Test 6: Visual Inspection Checklist');
  console.log('👀 Please visually verify the following:');
  console.log('1. Header shows user email and logout option');
  console.log('2. Mode toggle shows "PM Projects" and "Manual Entry" options');
  console.log('3. In Manual Entry mode, you can see:');
  console.log('   - Project ID input field');
  console.log('   - Generate Acta button');
  console.log('   - Download PDF/Word buttons');
  console.log('   - Preview PDF button');
  console.log('   - Send for Approval button');
  console.log('4. Backend Status section with "Test Backend" button');
  console.log('5. No critical error messages blocking the UI');
  console.log(
    '6. Toast notifications appear at top-right when actions are performed'
  );
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running complete manual workflow test...\n');

  if (!checkDashboardAccess()) {
    console.log('❌ Dashboard access failed - stopping tests');
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (!checkManualEntryMode()) {
    console.log('❌ Manual entry mode test failed');
  }

  testProjectIdInput();
  checkAuthStatus();
  checkBackendStatus();

  setTimeout(() => {
    printVisualChecklist();

    console.log('\n🎯 Manual Workflow Test Summary:');
    console.log('✅ Dashboard is accessible');
    console.log('✅ Manual Entry mode should be available');
    console.log('✅ Project ID input should accept values');
    console.log(
      '✅ Action buttons should become enabled with valid Project ID'
    );
    console.log('⚠️  Backend API may be unavailable (expected)');
    console.log('✅ Manual workflows should still be accessible');

    console.log('\n📋 Next Steps:');
    console.log('1. Switch to Manual Entry mode if not already active');
    console.log('2. Enter a test Project ID (e.g., 1000000064013473)');
    console.log(
      '3. Try clicking "Generate Acta" - should show API unavailable message'
    );
    console.log(
      '4. Verify that buttons show proper loading states and error messages'
    );
    console.log(
      '5. Check that UI remains functional even when backend is down'
    );
  }, 3000);
}

// Export functions to window for manual testing
window.manualWorkflowTest = {
  runAllTests,
  checkDashboardAccess,
  checkManualEntryMode,
  testProjectIdInput,
  checkAuthStatus,
  checkBackendStatus,
  printVisualChecklist,
};

// Auto-run the test
runAllTests();
