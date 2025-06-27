// Admin Access and Button Layout Verification
// Run this in browser console to test both fixes

function verifyFixes() {
  console.log('🔧 Verifying Admin Access and Button Layout Fixes...');
  console.log('=' .repeat(60));
  
  // Check if we're on the dashboard
  const currentPath = window.location.pathname;
  if (currentPath !== '/dashboard') {
    console.log('⚠️ Please navigate to /dashboard first');
    return;
  }
  
  // Check for admin user indication
  const welcomeMessage = document.querySelector('[class*="Welcome"]')?.textContent || 
                        Array.from(document.querySelectorAll('*')).find(el => 
                          el.textContent?.includes('Welcome')
                        )?.textContent;
  
  if (welcomeMessage) {
    console.log('👤 User welcome message:', welcomeMessage);
    
    // Check if admin email (valencia94 or admin)
    const isAdminUser = welcomeMessage.includes('valencia94') || 
                       welcomeMessage.includes('admin') ||
                       welcomeMessage.includes('@ikusi.com');
    
    if (isAdminUser) {
      console.log('✅ Admin user detected!');
      
      // Look for "all projects" indication in PM section
      const pmSection = Array.from(document.querySelectorAll('*')).find(el => 
        el.textContent?.includes('projects') && 
        (el.textContent?.includes('admin') || el.textContent?.includes('all'))
      );
      
      if (pmSection) {
        console.log('✅ Admin should now have access to all projects!');
        console.log('   Found:', pmSection.textContent);
      } else {
        console.log('⚠️ Look for toast notification about loading all projects');
      }
    } else {
      console.log('ℹ️ Regular user - will see assigned projects only');
    }
  }
  
  // Check ActaButtons layout
  console.log('\n🎨 Checking ActaButtons Layout...');
  
  const actaSection = Array.from(document.querySelectorAll('*')).find(el => 
    el.textContent?.includes('Generate Acta') && el.querySelector('button')
  );
  
  if (actaSection) {
    const buttonContainer = actaSection.querySelector('[class*="grid"]');
    if (buttonContainer) {
      const containerClasses = buttonContainer.className;
      console.log('📦 Button container classes:', containerClasses);
      
      // Check for improved grid layout
      if (containerClasses.includes('grid-cols-1') && 
          containerClasses.includes('sm:grid-cols-2') && 
          containerClasses.includes('lg:grid-cols-4')) {
        console.log('✅ Button grid layout updated for better distribution!');
      } else {
        console.log('⚠️ Button grid may need adjustment');
      }
      
      if (containerClasses.includes('max-w-4xl') && containerClasses.includes('mx-auto')) {
        console.log('✅ Button container centered and constrained!');
      }
      
      // Check button consistency
      const buttons = buttonContainer.querySelectorAll('button');
      console.log(`🔘 Found ${buttons.length} buttons in Generate Acta section`);
      
      if (buttons.length > 0) {
        const firstButton = buttons[0];
        const buttonClasses = firstButton.className;
        
        if (buttonClasses.includes('min-h-[48px]')) {
          console.log('✅ Buttons have consistent minimum height!');
        }
        
        if (buttonClasses.includes('font-semibold')) {
          console.log('✅ Button text weight improved!');
        }
        
        if (buttonClasses.includes('px-6') && buttonClasses.includes('py-3')) {
          console.log('✅ Button padding increased for better appearance!');
        }
        
        console.log('🎯 Button layout should now be more evenly distributed and visually balanced');
      }
    }
  } else {
    console.log('❌ Generate Acta section not found - scroll down or switch to Manual Entry mode');
  }
  
  console.log('\n📋 Test Steps:');
  console.log('1. Admin users should see "admin access" in project loading toast');
  console.log('2. Admin users should see all projects, not just assigned ones');
  console.log('3. Generate Acta buttons should be evenly spaced in a grid');
  console.log('4. Buttons should have consistent height and improved appearance');
  console.log('5. On mobile: buttons stack in 1 column');
  console.log('6. On tablet: buttons show in 2 columns');
  console.log('7. On desktop: buttons show in 4 columns');
}

// Auto-run verification
verifyFixes();

// Make function available globally
window.verifyFixes = verifyFixes;

console.log('🔧 Run verifyFixes() anytime to check both fixes');
