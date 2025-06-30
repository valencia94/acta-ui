// Quick Auth and Button Test Script
// Use the credentials: valencia942003@gmail.com / PdYb7TU7HvBhYP7$

console.log('🧪 QUICK AUTH & BUTTON TEST');
console.log('='.repeat(50));

// Step 1: Check if we're authenticated
function checkIfAuthenticated() {
  const token = localStorage.getItem('ikusi.jwt');
  const onDashboard = window.location.pathname.includes('dashboard');
  const onLogin = window.location.pathname.includes('login');

  console.log('📍 Current page:', window.location.pathname);
  console.log('🔑 Has auth token:', !!token);

  if (token && onDashboard) {
    console.log('✅ User is authenticated and on dashboard');
    return true;
  } else if (onLogin) {
    console.log('ℹ️ User is on login page - need to authenticate');
    console.log(
      '📝 Use credentials: valencia942003@gmail.com / PdYb7TU7HvBhYP7$'
    );
    return false;
  } else {
    console.log('❌ User not authenticated or wrong page');
    return false;
  }
}

// Step 2: Test button availability and functionality
function testButtons() {
  if (!checkIfAuthenticated()) {
    console.log('⚠️ Cannot test buttons - authentication required');
    return;
  }

  console.log('\n🎯 TESTING BUTTONS...');

  // Set test project ID
  const projectInput = document.querySelector('#projectId');
  if (projectInput) {
    projectInput.value = '1000000049842296';
    projectInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Set test project ID: 1000000049842296');
  }

  // Wait for React state to update
  setTimeout(() => {
    const buttons = {
      generate: Array.from(document.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Generate')
      ),
      word: Array.from(document.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Word')
      ),
      pdf: Array.from(document.querySelectorAll('button')).find(
        (btn) =>
          btn.textContent?.includes('PDF') &&
          !btn.textContent?.includes('Preview')
      ),
      preview: Array.from(document.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Preview')
      ),
      approval: Array.from(document.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Send Approval')
      ),
    };

    console.log('\n📊 BUTTON STATUS:');
    Object.entries(buttons).forEach(([name, button]) => {
      if (button) {
        const disabled = button.disabled;
        console.log(
          `- ${name.toUpperCase()}: ${disabled ? '🔒 Disabled' : '✅ Enabled'}`
        );
      } else {
        console.log(`- ${name.toUpperCase()}: ❌ Not found`);
      }
    });

    // Test API call with current auth
    testAPICall();
  }, 1000);
}

// Step 3: Test API call with auth headers
async function testAPICall() {
  console.log('\n🔗 TESTING API CALL WITH AUTH...');

  const token = localStorage.getItem('ikusi.jwt');
  if (!token) {
    console.log('❌ No auth token available');
    return;
  }

  try {
    const response = await fetch(
      'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/projects',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('API Response:', response.status, response.statusText);

    if (response.ok) {
      console.log('✅ API CALLS ARE WORKING! Buttons should be functional.');
    } else {
      console.log('❌ API calls still failing. Status:', response.status);
    }
  } catch (error) {
    console.log('❌ API call error:', error);
  }
}

// Step 4: Test specific button click
function clickButton(buttonName) {
  const buttons = {
    generate: Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Generate')
    ),
    word: Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Word')
    ),
    pdf: Array.from(document.querySelectorAll('button')).find(
      (btn) =>
        btn.textContent?.includes('PDF') &&
        !btn.textContent?.includes('Preview')
    ),
    preview: Array.from(document.querySelectorAll('button')).find((btn) =>
      btn.textContent?.includes('Preview')
    ),
  };

  const button = buttons[buttonName];
  if (button && !button.disabled) {
    console.log(`🖱️ Clicking ${buttonName} button...`);
    button.click();
    console.log('✅ Button clicked - watch for toast notifications!');
  } else {
    console.log(`❌ Cannot click ${buttonName} button (not found or disabled)`);
  }
}

// Make functions available globally
window.testAuth = testButtons;
window.clickButton = clickButton;
window.testAPICall = testAPICall;

console.log('✅ Quick test functions loaded!');
console.log('📝 Run testAuth() to check buttons after login');
console.log('📝 Run clickButton("generate") to test Generate button');

// Auto-run if on dashboard
if (window.location.pathname.includes('dashboard')) {
  console.log('🎯 Dashboard detected - running test...');
  setTimeout(testButtons, 1000);
}
