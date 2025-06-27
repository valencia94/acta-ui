// Dashboard Button Testing Utility
// This utility helps test all buttons on the dashboard

// Function to test dashboard buttons
function testDashboardButtons() {
  console.log('🧪 Starting Dashboard Button Tests...');

  // Test 1: Check if we're on the dashboard
  if (!window.location.pathname.includes('dashboard')) {
    console.log('❌ Please navigate to /dashboard first');
    return;
  }

  console.log('✅ On dashboard page');

  // Test 2: Check if project ID input exists
  const projectIdInput = document.querySelector(
    '#projectId'
  ) as HTMLInputElement;
  if (!projectIdInput) {
    console.log('❌ Project ID input not found');
    return;
  }

  console.log('✅ Project ID input found');

  // Test 3: Set a test project ID
  const testProjectId = '1000000064013473';
  projectIdInput.value = testProjectId;
  projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
  console.log(`✅ Set test project ID: ${testProjectId}`);

  // Wait a moment for state to update
  setTimeout(() => {
    // Test 4: Find and test each button
    const buttons = document.querySelectorAll('button');
    console.log(`✅ Found ${buttons.length} buttons on page`);

    // Find specific ACTA buttons
    const generateBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Generate')
    );
    const approvalBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Send Approval')
    );
    const wordBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('Word')
    );
    const pdfBtn = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('PDF')
    );
    const refreshBtn = Array.from(buttons).find(
      (btn) =>
        btn.querySelector('svg')?.classList.contains('animate-spin') !==
        undefined
    );

    console.log('\n🔍 Button Status:');
    console.log('- Generate Acta:', generateBtn ? '✅ Found' : '❌ Missing');
    console.log('- Send Approval:', approvalBtn ? '✅ Found' : '❌ Missing');
    console.log('- Download Word:', wordBtn ? '✅ Found' : '❌ Missing');
    console.log('- Download PDF:', pdfBtn ? '✅ Found' : '❌ Missing');
    console.log('- Refresh Projects:', refreshBtn ? '✅ Found' : '❌ Missing');

    // Test 5: Check if buttons are enabled/disabled
    console.log('\n⚡ Button States:');
    if (generateBtn) {
      console.log(
        '- Generate Acta:',
        generateBtn.disabled ? '🔒 Disabled' : '🟢 Enabled'
      );
    }
    if (approvalBtn) {
      console.log(
        '- Send Approval:',
        approvalBtn.disabled ? '🔒 Disabled' : '🟢 Enabled'
      );
    }
    if (wordBtn) {
      console.log(
        '- Download Word:',
        wordBtn.disabled ? '🔒 Disabled' : '🟢 Enabled'
      );
    }
    if (pdfBtn) {
      console.log(
        '- Download PDF:',
        pdfBtn.disabled ? '🔒 Disabled' : '🟢 Enabled'
      );
    }

    // Test 6: Test button clicks (without actually triggering actions)
    console.log('\n🖱️ Testing Button Clicks:');

    // Add click listeners to see if events are working
    if (generateBtn) {
      const originalClick = generateBtn.onclick;
      generateBtn.onclick = (e) => {
        console.log('✅ Generate Acta button clicked!');
        if (originalClick) originalClick.call(generateBtn, e);
      };
    }

    if (approvalBtn) {
      const originalClick = approvalBtn.onclick;
      approvalBtn.onclick = (e) => {
        console.log('✅ Send Approval button clicked!');
        if (originalClick) originalClick.call(approvalBtn, e);
      };
    }

    if (wordBtn) {
      const originalClick = wordBtn.onclick;
      wordBtn.onclick = (e) => {
        console.log('✅ Download Word button clicked!');
        if (originalClick) originalClick.call(wordBtn, e);
      };
    }

    if (pdfBtn) {
      const originalClick = pdfBtn.onclick;
      pdfBtn.onclick = (e) => {
        console.log('✅ Download PDF button clicked!');
        if (originalClick) originalClick.call(pdfBtn, e);
      };
    }

    console.log(
      '\n🎯 Ready for testing! Try clicking the buttons to see console output.'
    );
    console.log(
      '📝 Note: API calls may fail if backend server is not running.'
    );
  }, 500);
}

// Function to simulate button clicks for testing
function simulateButtonClicks() {
  console.log('🤖 Simulating button clicks...');

  const projectIdInput = document.querySelector(
    '#projectId'
  ) as HTMLInputElement;
  if (projectIdInput && !projectIdInput.value) {
    projectIdInput.value = '1000000064013473';
    projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Set test project ID');
  }

  setTimeout(() => {
    const buttons = document.querySelectorAll('button');

    // Find and click Generate button
    const generateBtn = Array.from(buttons).find(
      (btn) => btn.textContent?.includes('Generate') && !btn.disabled
    );
    if (generateBtn) {
      console.log('🔥 Clicking Generate Acta button...');
      (generateBtn as HTMLButtonElement).click();
    }

    // Click other buttons with delays
    setTimeout(() => {
      const approvalBtn = Array.from(buttons).find(
        (btn) => btn.textContent?.includes('Send Approval') && !btn.disabled
      );
      if (approvalBtn) {
        console.log('📧 Clicking Send Approval button...');
        (approvalBtn as HTMLButtonElement).click();
      }
    }, 2000);

    setTimeout(() => {
      const wordBtn = Array.from(buttons).find(
        (btn) => btn.textContent?.includes('Word') && !btn.disabled
      );
      if (wordBtn) {
        console.log('📄 Clicking Download Word button...');
        (wordBtn as HTMLButtonElement).click();
      }
    }, 4000);

    setTimeout(() => {
      const pdfBtn = Array.from(buttons).find(
        (btn) => btn.textContent?.includes('PDF') && !btn.disabled
      );
      if (pdfBtn) {
        console.log('📑 Clicking Download PDF button...');
        (pdfBtn as HTMLButtonElement).click();
      }
    }, 6000);
  }, 1000);
}

// Function to check API connectivity
async function testAPIConnectivity() {
  console.log('🌐 Testing API connectivity...');

  const apiBaseUrl =
    (window as unknown as Record<string, unknown>).__VITE_API_BASE_URL__ ||
    'http://localhost:9999';
  console.log(`📡 API Base URL: ${apiBaseUrl}`);

  try {
    const response = await fetch(`${apiBaseUrl}/health`);
    if (response.ok) {
      console.log('✅ API server is reachable');
      return true;
    } else {
      console.log('⚠️ API server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ API server is not reachable:', error.message);
    console.log('💡 Make sure the backend server is running on', apiBaseUrl);
    return false;
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testDashboardButtons =
    testDashboardButtons;
  (window as unknown as Record<string, unknown>).simulateButtonClicks =
    simulateButtonClicks;
  (window as unknown as Record<string, unknown>).testAPIConnectivity =
    testAPIConnectivity;

  console.log('🧪 Dashboard testing functions available:');
  console.log('- testDashboardButtons() - Check all buttons');
  console.log('- simulateButtonClicks() - Auto-click all buttons');
  console.log('- testAPIConnectivity() - Check API server status');
}
