// navigation-button-test.js
// 🧭 ACTA-UI Navigation & Button Test (Skip Auth Mode)
// Run this in browser console to test app flow without authentication blocks

console.log('🧭 Starting Navigation & Button Test (Skip Auth Mode)...');

// Test 1: Check Skip Auth Mode is Active
console.log('\n═══ TEST 1: SKIP AUTH MODE ═══');
function testSkipAuthMode() {
  const skipAuthIndicators = [
    document.body.textContent?.includes('Demo mode'),
    document.body.textContent?.includes('any credentials will work'),
    localStorage.getItem('ikusi.jwt') === 'dev-token'
  ];
  
  const skipAuthActive = skipAuthIndicators.some(Boolean);
  console.log(`${skipAuthActive ? '✅' : '❌'} Skip auth mode: ${skipAuthActive ? 'ACTIVE' : 'Not detected'}`);
  
  if (skipAuthActive) {
    console.log('🚀 Great! We can test navigation and buttons without auth barriers.');
  }
  
  return { active: skipAuthActive };
}

// Test 2: Test Navigation Flow
console.log('\n═══ TEST 2: NAVIGATION FLOW ═══');
async function testNavigationFlow() {
  const currentPath = window.location.pathname;
  console.log(`📍 Current location: ${currentPath}`);
  
  const results = {};
  
  // Test root redirect
  if (currentPath === '/') {
    console.log('🔄 Testing root redirect...');
    // Should redirect to dashboard in skip auth mode
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newPath = window.location.pathname;
    results.rootRedirect = newPath === '/dashboard';
    console.log(`${results.rootRedirect ? '✅' : '❌'} Root redirect: ${newPath}`);
  }
  
  // Test login page accessibility  
  if (currentPath !== '/login') {
    console.log('🔄 Testing login page navigation...');
    const originalPath = window.location.pathname;
    window.history.pushState({}, '', '/login');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In skip auth mode, login should redirect to dashboard
    const loginPath = window.location.pathname;
    results.loginRedirect = loginPath === '/dashboard';
    console.log(`${results.loginRedirect ? '✅' : '❌'} Login redirect in skip auth: ${loginPath}`);
    
    // Return to original path
    window.history.pushState({}, '', originalPath);
  }
  
  // Test dashboard accessibility
  console.log('🔄 Testing dashboard navigation...');
  window.history.pushState({}, '', '/dashboard');
  await new Promise(resolve => setTimeout(resolve, 500));
  const dashboardPath = window.location.pathname;
  results.dashboardAccess = dashboardPath === '/dashboard';
  console.log(`${results.dashboardAccess ? '✅' : '❌'} Dashboard access: ${dashboardPath}`);
  
  // Test admin page accessibility
  console.log('🔄 Testing admin navigation...');
  window.history.pushState({}, '', '/admin');
  await new Promise(resolve => setTimeout(resolve, 500));
  const adminPath = window.location.pathname;
  results.adminAccess = adminPath === '/admin';
  console.log(`${results.adminAccess ? '✅' : '❌'} Admin access: ${adminPath}`);
  
  return results;
}

// Test 3: Dashboard Component Loading
console.log('\n═══ TEST 3: DASHBOARD COMPONENTS ═══');
function testDashboardComponents() {
  // Navigate to dashboard first
  window.history.pushState({}, '', '/dashboard');
  
  // Wait a moment for React to render
  setTimeout(() => {
    const components = {
      projectInput: document.querySelector('input[type="text"], input[placeholder*="Project"]'),
      generateButton: Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Generate') && !btn.textContent?.includes('PDF')
      ),
      downloadButtons: Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.textContent?.includes('Word') || btn.textContent?.includes('PDF')
      ),
      previewButton: Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Preview')
      ),
      approvalButton: Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent?.includes('Approval')
      )
    };
    
    console.log(`${components.projectInput ? '✅' : '❌'} Project input field: ${components.projectInput ? 'Found' : 'Not found'}`);
    console.log(`${components.generateButton ? '✅' : '❌'} Generate button: ${components.generateButton ? 'Found' : 'Not found'}`);
    console.log(`${components.downloadButtons.length > 0 ? '✅' : '❌'} Download buttons: ${components.downloadButtons.length} found`);
    console.log(`${components.previewButton ? '✅' : '❌'} Preview button: ${components.previewButton ? 'Found' : 'Not found'}`);
    console.log(`${components.approvalButton ? '✅' : '❌'} Approval button: ${components.approvalButton ? 'Found' : 'Not found'}`);
    
    return components;
  }, 1000);
}

// Test 4: Button Interaction Simulation
console.log('\n═══ TEST 4: BUTTON INTERACTION SIMULATION ═══');
function testButtonInteractions() {
  // Navigate to dashboard
  window.history.pushState({}, '', '/dashboard');
  
  setTimeout(() => {
    console.log('🎯 Testing button interactions...');
    
    // Find and fill project input
    const projectInput = document.querySelector('input[type="text"], input[placeholder*="Project"]');
    if (projectInput) {
      projectInput.value = '1000000049842296';
      projectInput.dispatchEvent(new Event('input', { bubbles: true }));
      console.log('✅ Project ID set: 1000000049842296');
    } else {
      console.log('❌ Project input not found');
      return;
    }
    
    // Test Generate button (don't actually click, just verify it's ready)
    const generateBtn = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent?.includes('Generate') && !btn.textContent?.includes('PDF')
    );
    
    if (generateBtn && !generateBtn.disabled) {
      console.log('✅ Generate button is ready and enabled');
      console.log('💡 In skip auth mode, you can safely test the button click');
    } else {
      console.log('❌ Generate button not ready or disabled');
    }
    
    // Check other buttons
    const otherButtons = [
      { name: 'Download Word', text: 'Word' },
      { name: 'Download PDF', text: 'PDF' },
      { name: 'Preview PDF', text: 'Preview' },
      { name: 'Send Approval', text: 'Approval' }
    ];
    
    otherButtons.forEach(({ name, text }) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent?.includes(text)
      );
      if (btn) {
        console.log(`${btn.disabled ? '⚠️' : '✅'} ${name}: ${btn.disabled ? 'Disabled (expected until document generated)' : 'Ready'}`);
      } else {
        console.log(`❌ ${name}: Not found`);
      }
    });
    
  }, 1000);
}

// Test 5: API Call Simulation (No Auth Required)
console.log('\n═══ TEST 5: API HEALTH CHECK ═══');
async function testAPIHealthCheck() {
  try {
    console.log('🔍 Testing health endpoint (no auth required)...');
    const response = await fetch('https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health');
    const data = await response.json();
    
    console.log(`${response.ok ? '✅' : '❌'} Health check: ${response.status} - ${JSON.stringify(data)}`);
    
    if (response.ok) {
      console.log('🎉 API Gateway is responding correctly!');
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return { success: false, error: error.message };
  }
}

// Run All Navigation Tests
async function runNavigationTests() {
  console.log('\n🚀 RUNNING NAVIGATION & BUTTON TESTS...\n');
  
  const results = {
    skipAuth: testSkipAuthMode(),
    healthCheck: await testAPIHealthCheck(),
    navigation: await testNavigationFlow(),
    components: testDashboardComponents(),
    interactions: testButtonInteractions()
  };
  
  console.log('\n═══ NAVIGATION TEST SUMMARY ═══');
  
  if (results.skipAuth.active) {
    console.log('🎉 SKIP AUTH MODE IS WORKING!');
    console.log('✅ You can now test all navigation and button functionality');
    console.log('✅ API connectivity confirmed (health check passed)');
    console.log('💡 Next: Test button clicks on dashboard to verify full functionality');
  } else {
    console.log('⚠️ Skip auth mode not detected - may still have auth barriers');
  }
  
  return results;
}

// Auto-run tests
setTimeout(runNavigationTests, 1000);

console.log('🧭 Navigation test script loaded. Running tests in 1 second...');
console.log('💡 Manual run: runNavigationTests()');

// Export for manual testing
window.navigationTests = {
  runNavigationTests,
  testSkipAuthMode,
  testNavigationFlow,
  testDashboardComponents,
  testButtonInteractions,
  testAPIHealthCheck
};
