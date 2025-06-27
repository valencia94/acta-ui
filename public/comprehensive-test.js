// Comprehensive Button Test Results
// This documents what happens when buttons are pressed

function runComprehensiveTest() {
  console.log('🧪 COMPREHENSIVE BUTTON TEST');
  console.log('='.repeat(60));
  
  // Step 1: Check initial state
  console.log('📋 INITIAL STATE CHECK:');
  console.log(`Current URL: ${window.location.href}`);
  console.log(`API Base URL: ${import.meta?.env?.VITE_API_BASE_URL || 'Not defined'}`);
  
  // Check if Toaster is present
  const toasterContainer = document.querySelector('[data-hot-toast-container]');
  console.log(`Toaster container present: ${!!toasterContainer}`);
  
  // Step 2: Fill project ID
  console.log('\n📝 FILLING PROJECT ID:');
  const projectInput = document.querySelector('input[placeholder*="Project"], input[placeholder*="project"]');
  if (projectInput) {
    const testProjectId = '1000000064013473';
    projectInput.value = testProjectId;
    projectInput.dispatchEvent(new Event('input', { bubbles: true }));
    projectInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`✅ Project ID set to: ${testProjectId}`);
  } else {
    console.log('❌ Project input not found');
    return;
  }
  
  // Step 3: Test Generate button with monitoring
  console.log('\n🎯 TESTING GENERATE BUTTON:');
  
  // Set up toast monitoring
  let toastCount = 0;
  const originalToast = window.toast;
  
  // Monitor network requests
  const originalFetch = window.fetch;
  const networkRequests = [];
  
  window.fetch = function(...args) {
    const url = args[0];
    networkRequests.push({ url, timestamp: new Date().toISOString() });
    console.log(`🌐 Network Request: ${url}`);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log(`📡 Response: ${response.status} ${response.statusText} for ${url}`);
        return response;
      })
      .catch(error => {
        console.log(`❌ Network Error: ${error.message} for ${url}`);
        throw error;
      });
  };
  
  // Monitor DOM changes for toasts
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 && (
            node.getAttribute && (
              node.getAttribute('data-hot-toast') ||
              node.classList.contains('toast') ||
              node.textContent?.includes('Acta') ||
              node.textContent?.includes('error')
            )
          )) {
            toastCount++;
            console.log(`🍞 Toast #${toastCount} appeared:`, node.textContent);
          }
        });
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Find and click Generate button
  setTimeout(() => {
    const generateBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Generate')
    );
    
    if (generateBtn) {
      console.log(`Found Generate button: "${generateBtn.textContent}"`);
      console.log(`Button disabled: ${generateBtn.disabled}`);
      console.log(`Button classes: ${generateBtn.className}`);
      
      if (!generateBtn.disabled) {
        console.log('🔘 CLICKING GENERATE BUTTON...');
        
        // Click the button
        generateBtn.click();
        
        // Monitor results for 10 seconds
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          console.log(`⏱️  Check #${checkCount} (${checkCount}s after click):`);
          console.log(`   - Network requests: ${networkRequests.length}`);
          console.log(`   - Toast notifications: ${toastCount}`);
          
          // List current toasts
          const currentToasts = document.querySelectorAll('[data-hot-toast]');
          console.log(`   - Active toasts: ${currentToasts.length}`);
          currentToasts.forEach((toast, index) => {
            console.log(`     Toast ${index + 1}: "${toast.textContent}"`);
          });
          
          if (checkCount >= 10) {
            clearInterval(checkInterval);
            
            // Final report
            console.log('\n📊 FINAL TEST RESULTS:');
            console.log(`✅ Button clicked successfully`);
            console.log(`🌐 Network requests made: ${networkRequests.length}`);
            console.log(`🍞 Toast notifications: ${toastCount}`);
            console.log(`⏱️  Test duration: 10 seconds`);
            
            if (networkRequests.length > 0) {
              console.log('\n📡 Network Request Details:');
              networkRequests.forEach((req, index) => {
                console.log(`${index + 1}. ${req.url} at ${req.timestamp}`);
              });
            }
            
            // Restore original functions
            window.fetch = originalFetch;
            observer.disconnect();
            
            console.log('\n✅ TEST COMPLETED - Check the results above!');
          }
        }, 1000);
        
      } else {
        console.log('❌ Generate button is disabled');
      }
    } else {
      console.log('❌ Generate button not found');
    }
  }, 1000);
}

// Quick test function
function quickButtonTest() {
  console.log('⚡ QUICK BUTTON TEST');
  
  // Fill project ID
  const projectInput = document.querySelector('input[placeholder*="Project"], input[placeholder*="project"]');
  if (projectInput) {
    projectInput.value = '1000000064013473';
    projectInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Project ID filled');
  }
  
  // Click Generate button
  setTimeout(() => {
    const generateBtn = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Generate')
    );
    
    if (generateBtn && !generateBtn.disabled) {
      console.log('🔘 Clicking Generate...');
      generateBtn.click();
      
      setTimeout(() => {
        const toasts = document.querySelectorAll('[data-hot-toast]');
        console.log(`Result: ${toasts.length} toast(s) appeared`);
        toasts.forEach(toast => console.log(`Toast: "${toast.textContent}"`));
      }, 2000);
    }
  }, 500);
}

// Make functions available globally
window.runComprehensiveTest = runComprehensiveTest;
window.quickButtonTest = quickButtonTest;

console.log('🧪 Comprehensive Button Test Loaded!');
console.log('Commands:');
console.log('- runComprehensiveTest() - Full 10-second monitoring test');
console.log('- quickButtonTest() - Quick 2-second test');
