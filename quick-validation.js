// Quick Browser Validation Script for ACTA-UI Manual Workflow
// Copy and paste this entire script into the browser console

(function () {
  console.log(
    '%c🧪 ACTA-UI Manual Workflow Validation',
    'font-size: 16px; font-weight: bold; color: #10b981;'
  );
  console.log('Running quick validation checks...\n');

  // Check 1: Authentication
  const hasToken = !!localStorage.getItem('ikusi.jwt');
  console.log(
    `%c${hasToken ? '✅' : '❌'} Authentication:`,
    'font-weight: bold;',
    hasToken ? 'JWT token found' : 'No JWT token'
  );

  // Check 2: Current page
  const isOnDashboard =
    window.location.pathname === '/dashboard' ||
    window.location.pathname === '/';
  console.log(
    `%c${isOnDashboard ? '✅' : '❌'} Dashboard Access:`,
    'font-weight: bold;',
    `Current path: ${window.location.pathname}`
  );

  // Check 3: Manual Entry button
  const manualEntryButton = Array.from(
    document.querySelectorAll('button')
  ).find((btn) => btn.textContent.includes('Manual Entry'));
  console.log(
    `%c${manualEntryButton ? '✅' : '❌'} Manual Entry Button:`,
    'font-weight: bold;',
    manualEntryButton ? 'Found' : 'Not found'
  );

  // Check 4: Switch to Manual Entry mode
  if (
    manualEntryButton &&
    !manualEntryButton.classList.contains('bg-blue-500')
  ) {
    console.log('🖱️ Switching to Manual Entry mode...');
    manualEntryButton.click();
  }

  // Check 5: Project ID input (after a delay)
  setTimeout(() => {
    const projectIdInput =
      document.querySelector('input[id="projectId"]') ||
      document.querySelector('input[placeholder*="project ID"]');
    console.log(
      `%c${projectIdInput ? '✅' : '❌'} Project ID Input:`,
      'font-weight: bold;',
      projectIdInput ? 'Found' : 'Not found'
    );

    // Check 6: ACTA action buttons
    const actionButtons = Array.from(
      document.querySelectorAll('button')
    ).filter((btn) => {
      const text = btn.textContent.toLowerCase();
      return (
        text.includes('generate') ||
        text.includes('download') ||
        text.includes('preview') ||
        text.includes('send')
      );
    });
    console.log(
      `%c${actionButtons.length > 0 ? '✅' : '❌'} Action Buttons:`,
      'font-weight: bold;',
      `Found ${actionButtons.length} action buttons`
    );

    // Check 7: Test Project ID entry
    if (projectIdInput) {
      console.log('🔤 Testing Project ID input...');
      projectIdInput.value = '1000000064013473';
      projectIdInput.dispatchEvent(new Event('input', { bubbles: true }));

      setTimeout(() => {
        const enabledButtons = actionButtons.filter((btn) => !btn.disabled);
        console.log(
          `%c${enabledButtons.length > 0 ? '✅' : '❌'} Button Activation:`,
          'font-weight: bold;',
          `${enabledButtons.length} buttons enabled after entering Project ID`
        );

        // Final summary
        console.log(
          '\n%c📋 Manual Workflow Status Summary:',
          'font-size: 14px; font-weight: bold; color: #059669;'
        );
        console.log(
          '%c✅ Ready for Manual Testing:',
          'color: #10b981; font-weight: bold;'
        );
        console.log('  1. Switch to Manual Entry mode');
        console.log('  2. Enter a Project ID (e.g., 1000000064013473)');
        console.log('  3. Click action buttons to test error handling');
        console.log('  4. Verify proper loading states and error messages');

        if (!hasToken) {
          console.log(
            '%c⚠️  Please log in first:',
            'color: #f59e0b; font-weight: bold;'
          );
          console.log('  Navigate to /login and complete authentication');
        }

        console.log(
          '\n%c🎯 Next Steps:',
          'font-size: 14px; font-weight: bold; color: #0d9488;'
        );
        console.log('  • Test each button to verify error messages appear');
        console.log('  • Confirm UI remains responsive during API failures');
        console.log('  • Verify that manual entry workflow is accessible');
      }, 1000);
    }
  }, 1500);

  // Check 8: User email in UI
  setTimeout(() => {
    const userEmail = Array.from(document.querySelectorAll('*')).find(
      (el) =>
        el.textContent &&
        el.textContent.includes('@') &&
        el.textContent.includes('.com')
    );
    console.log(
      `%c${userEmail ? '✅' : '❌'} User Email Display:`,
      'font-weight: bold;',
      userEmail ? userEmail.textContent : 'Not found in UI'
    );
  }, 2000);
})();
