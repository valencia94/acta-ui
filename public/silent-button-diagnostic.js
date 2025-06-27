// Silent Button Failure Diagnostic
// Run this in browser console to debug why buttons aren't responding

function diagnoseSilentButtons() {
  console.log('🔍 Diagnosing Silent Button Failures...');
  
  // Check if we're on the right page
  console.log(`📍 Current URL: ${window.location.href}`);
  console.log(`📍 Should be on: localhost:3000 or your deployed URL`);
  
  // Check if React is loaded
  console.log('\n⚛️ React Status:');
  console.log('React available:', typeof React !== 'undefined');
  console.log('React DevTools:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
  
  // Check environment variables
  console.log('\n🌐 Environment Check:');
  const apiUrl = import.meta?.env?.VITE_API_BASE_URL;
  console.log('API Base URL:', apiUrl);
  console.log('Expected API URL: https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod');
  
  // Find all buttons on the page
  console.log('\n🔘 Button Analysis:');
  const buttons = document.querySelectorAll('button');
  console.log(`Found ${buttons.length} buttons on page`);
  
  buttons.forEach((btn, index) => {
    const text = btn.textContent?.trim() || 'No text';
    const disabled = btn.disabled;
    const hasClick = btn.onclick !== null;
    const hasEventListeners = getEventListeners ? getEventListeners(btn).click : 'Unknown';
    
    console.log(`Button ${index + 1}: "${text}" | Disabled: ${disabled} | onClick: ${hasClick}`);
    
    // Special check for Generate button
    if (text.includes('Generate') || text.includes('Acta')) {
      console.log(`🎯 Found Generate button: "${text}"`);
      console.log('  - Disabled:', disabled);
      console.log('  - Parent form:', btn.closest('form'));
      console.log('  - Classes:', btn.className);
      
      // Try to trigger click manually
      console.log('  - Testing manual click...');
      try {
        btn.click();
        console.log('  ✅ Manual click succeeded');
      } catch (error) {
        console.log('  ❌ Manual click failed:', error);
      }
    }
  });
  
  // Check for input fields
  console.log('\n📝 Input Field Analysis:');
  const inputs = document.querySelectorAll('input[type="text"], input[placeholder*="project"]');
  inputs.forEach((input, index) => {
    console.log(`Input ${index + 1}: Value="${input.value}" | Placeholder="${input.placeholder}"`);
  });
  
  // Check for error toasts or messages
  console.log('\n🍞 Toast/Error Messages:');
  const toasts = document.querySelectorAll('[data-testid*="toast"], .toast, [class*="toast"]');
  console.log(`Found ${toasts.length} toast containers`);
  
  // Check network requests
  console.log('\n🌐 Network Monitoring:');
  console.log('To monitor network requests:');
  console.log('1. Open DevTools > Network tab');
  console.log('2. Clear the network log');
  console.log('3. Try clicking Generate button');
  console.log('4. Look for any XHR/Fetch requests');
  
  // Test API directly
  console.log('\n🧪 Direct API Test:');
  console.log('Testing API connectivity...');
  
  const testProjectId = '1000000064013473';
  const apiBaseUrl = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
  
  fetch(`${apiBaseUrl}/project-summary/${testProjectId}`)
    .then(response => {
      console.log(`✅ API responded: ${response.status} ${response.statusText}`);
      return response.text();
    })
    .then(data => {
      console.log('API Response:', data.substring(0, 200));
    })
    .catch(error => {
      console.log('❌ API Error:', error);
    });
  
  // Advanced debugging suggestions
  console.log('\n🔧 Next Steps:');
  console.log('1. Check if project ID input has a value');
  console.log('2. Look in Network tab for failed requests');
  console.log('3. Check Console for React errors');
  console.log('4. Try: fillProjectIdAndTest() function below');
  
  return {
    buttons: buttons.length,
    inputs: inputs.length,
    apiUrl,
    url: window.location.href
  };
}

// Helper function to fill project ID and test
function fillProjectIdAndTest() {
  console.log('🎯 Auto-filling project ID and testing...');
  
  // Find project ID input
  const projectInput = document.querySelector('input[placeholder*="project"], input[id*="project"], #projectId');
  
  if (projectInput) {
    console.log('📝 Found project input, filling with test ID...');
    projectInput.value = '1000000064013473';
    
    // Trigger input events to notify React
    projectInput.dispatchEvent(new Event('input', { bubbles: true }));
    projectInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('✅ Project ID filled:', projectInput.value);
    
    // Wait a moment then try to find and click Generate button
    setTimeout(() => {
      const generateBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent?.includes('Generate'));
      
      if (generateBtn) {
        console.log('🔘 Found Generate button, clicking...');
        console.log('Button state - Disabled:', generateBtn.disabled);
        
        if (!generateBtn.disabled) {
          generateBtn.click();
          console.log('✅ Generate button clicked!');
        } else {
          console.log('❌ Generate button is disabled');
        }
      } else {
        console.log('❌ Generate button not found');
      }
    }, 500);
    
  } else {
    console.log('❌ Project ID input not found');
    console.log('Available inputs:', document.querySelectorAll('input'));
  }
}

// Make functions globally available
window.diagnoseSilentButtons = diagnoseSilentButtons;
window.fillProjectIdAndTest = fillProjectIdAndTest;

// Auto-run diagnostic
diagnoseSilentButtons();
