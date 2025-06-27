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
  projectIdInput.dispatchEvent(new Event('change', { bubbles: true }));
  console.log(`✅ Set test project ID: ${testProjectId}`);

  // Wait a moment for state to update
  setTimeout(() => {
    // Test 4: Find and test each button
    const buttons = document.querySelectorAll('button');
    console.log(`✅ Found ${buttons.length} buttons on page`);

    // Find specific ACTA buttons with more detailed searching
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
      console.log(
        '  - onClick handler:',
        generateBtn.onclick ? 'Present' : 'Missing'
      );
    }
    if (approvalBtn) {
      console.log(
        '- Send Approval:',
        approvalBtn.disabled ? '🔒 Disabled' : '🟢 Enabled'
      );
      console.log(
        '  - onClick handler:',
        approvalBtn.onclick ? 'Present' : 'Missing'
      );
    }
    if (wordBtn) {
      console.log(
        '- Download Word:',
        wordBtn.disabled ? '🔒 Disabled' : '🟢 Enabled'
      );
      console.log(
        '  - onClick handler:',
        wordBtn.onclick ? 'Present' : 'Missing'
      );
    }
    if (pdfBtn) {
      console.log(
        '- Download PDF:',
        pdfBtn.disabled ? '🔒 Disabled' : '🟢 Enabled'
      );
      console.log(
        '  - onClick handler:',
        pdfBtn.onclick ? 'Present' : 'Missing'
      );
    }

    // Test 6: Try to trigger buttons with different methods
    console.log('\n🖱️ Testing Button Interactions:');

    if (generateBtn) {
      console.log('🔥 Testing Generate Acta button...');

      // Add a test event listener
      generateBtn.addEventListener('click', () => {
        console.log('✅ Generate button click event fired!');
      });

      // Try multiple ways to trigger the button
      console.log('  - Trying .click() method...');
      generateBtn.click();

      console.log('  - Trying manual event dispatch...');
      generateBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      console.log('  - Checking if button prevents default...');
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      const wasDefaultPrevented = !generateBtn.dispatchEvent(clickEvent);
      console.log('  - Default prevented:', wasDefaultPrevented);
    }

    console.log(
      '\n🎯 Button testing complete! Check console for click events.'
    );
    console.log(
      '📝 Note: If no click events appear, the button handlers may not be properly attached.'
    );
  }, 1000); // Increased timeout to ensure state updates
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

// Function to test React event handlers specifically
function testReactEventHandlers() {
  console.log('⚛️ Testing React Event Handlers...');

  // Check if project ID is set
  const projectIdInput = document.querySelector(
    '#projectId'
  ) as HTMLInputElement;
  if (projectIdInput && !projectIdInput.value) {
    projectIdInput.value = '1000000064013473';
    projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    projectIdInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Set project ID for testing');
  }

  setTimeout(() => {
    const buttons = document.querySelectorAll('button');
    console.log(`Found ${buttons.length} buttons`);

    // Try to find buttons by their text content
    const buttonTests = [
      { name: 'Generate', text: 'Generate' },
      { name: 'Send Approval', text: 'Send Approval' },
      { name: 'Download Word', text: 'Word' },
      { name: 'Download PDF', text: 'PDF' },
    ];

    buttonTests.forEach(({ name, text }) => {
      const button = Array.from(buttons).find((btn) =>
        btn.textContent?.includes(text)
      ) as HTMLButtonElement;

      if (button) {
        console.log(`\n🔍 Testing ${name} button:`);
        console.log(`  - Disabled: ${button.disabled}`);
        console.log(`  - Class list: ${button.className}`);

        // Check if button has React fiber
        const reactFiber =
          (button as unknown as Record<string, unknown>)._reactInternalFiber ||
          (button as unknown as Record<string, unknown>)
            .__reactInternalInstance ||
          Object.keys(button).find((key) =>
            key.startsWith('__reactInternalInstance')
          );
        console.log(`  - React fiber: ${reactFiber ? 'Present' : 'Missing'}`);

        // Add a test listener and try clicking
        let clickDetected = false;
        const testListener = () => {
          clickDetected = true;
          console.log(`  ✅ ${name} button click detected!`);
        };

        button.addEventListener('click', testListener);

        // Try clicking
        console.log('  - Attempting click...');
        button.click();

        setTimeout(() => {
          if (!clickDetected) {
            console.log(`  ❌ ${name} button click not detected`);
          }
          button.removeEventListener('click', testListener);
        }, 100);
      } else {
        console.log(`❌ ${name} button not found`);
      }
    });
  }, 500);
}

// Make functions available globally
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testDashboardButtons =
    testDashboardButtons;
  (window as unknown as Record<string, unknown>).simulateButtonClicks =
    simulateButtonClicks;
  (window as unknown as Record<string, unknown>).testAPIConnectivity =
    testAPIConnectivity;
  (window as unknown as Record<string, unknown>).testReactEventHandlers =
    testReactEventHandlers;

  console.log('🧪 Dashboard testing functions available:');
  console.log('- testDashboardButtons() - Check all buttons');
  console.log('- simulateButtonClicks() - Auto-click all buttons');
  console.log('- testAPIConnectivity() - Check API server status');
  console.log('- testReactEventHandlers() - Check React event handlers');
}
