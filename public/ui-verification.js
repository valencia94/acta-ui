// Quick UI Change Verification
// Run this in browser console to verify changes are applied

function verifyUIChanges() {
  console.log('🔍 Verifying UI Changes...');
  console.log('='.repeat(50));
  
  // Check logo size
  const logo = document.querySelector('img[alt="Ikusi logo"]');
  if (logo) {
    const logoClasses = logo.className;
    console.log('✅ Logo found:', logoClasses);
    console.log('   Expected: h-12 (should see this)');
    console.log('   Previous: h-8 (should NOT see this)');
    
    if (logoClasses.includes('h-12')) {
      console.log('✅ Logo size updated correctly!');
    } else {
      console.log('❌ Logo size not updated');
    }
  } else {
    console.log('❌ Logo not found');
  }
  
  // Check for admin navigation
  const adminBtn = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent?.includes('Admin')
  );
  
  if (adminBtn) {
    console.log('✅ Admin button found in navigation');
  } else {
    console.log('⚠️ Admin button not found (may not have admin access)');
  }
  
  // Check current route
  const currentPath = window.location.pathname;
  console.log('📍 Current path:', currentPath);
  
  if (currentPath === '/admin') {
    // Check for admin-specific elements
    const adminTitle = document.querySelector('h1');
    if (adminTitle?.textContent?.includes('Admin Dashboard')) {
      console.log('✅ Admin Dashboard loaded correctly!');
    } else {
      console.log('❌ Admin Dashboard title not found');
    }
    
    // Check for system stats
    const statsCards = document.querySelectorAll('[class*="grid"]');
    console.log(`📊 Found ${statsCards.length} grid layouts (should have system stats)`);
    
  } else if (currentPath === '/dashboard') {
    // Check for main dashboard elements
    const modeToggle = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent?.includes('PM Projects')
    );
    
    if (modeToggle) {
      console.log('✅ Main Dashboard loaded correctly!');
    } else {
      console.log('❌ Main Dashboard elements not found');
    }
  }
  
  // Check header typography
  const headerTitle = document.querySelector('h1');
  if (headerTitle) {
    const titleClasses = headerTitle.className;
    console.log('📝 Header title classes:', titleClasses);
    
    if (titleClasses.includes('text-2xl') || titleClasses.includes('text-3xl')) {
      console.log('✅ Header typography enhanced!');
    } else {
      console.log('⚠️ Header typography may not be updated');
    }
  }
  
  console.log('\n🧪 Testing Steps:');
  console.log('1. Try visiting /admin in the URL bar');
  console.log('2. Try visiting /dashboard in the URL bar');
  console.log('3. Look for larger Ikusi logo in header');
  console.log('4. Check if Admin button appears in navigation (if admin user)');
  console.log('5. Hard refresh with Ctrl+F5 if needed');
}

// Auto-run verification
verifyUIChanges();

// Make function available globally
window.verifyUIChanges = verifyUIChanges;

console.log('🔧 Run verifyUIChanges() anytime to check UI changes');
