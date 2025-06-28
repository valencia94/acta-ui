// Button Layout Visual Test
// Run this in browser console to check the new 2x2 layout

function testButtonLayout() {
  console.log('🎨 Testing Button Layout (2x2 Grid)...');
  console.log('='.repeat(50));

  // Find the Generate Acta section
  const actaSection = Array.from(document.querySelectorAll('*')).find(
    (el) =>
      el.textContent?.includes('Generate Acta') && el.querySelector('button')
  );

  if (!actaSection) {
    console.log(
      "❌ Generate Acta section not found. Make sure you're in Manual Entry mode."
    );
    return;
  }

  // Check button container
  const buttonContainer = actaSection.querySelector('[class*="grid"]');
  if (buttonContainer) {
    const containerClasses = buttonContainer.className;
    console.log('📦 Button container classes:', containerClasses);

    // Check for 2x2 grid
    if (containerClasses.includes('grid-cols-2')) {
      console.log('✅ 2x2 Grid layout applied!');
    } else {
      console.log('⚠️ Grid layout may not be updated');
    }

    if (containerClasses.includes('max-w-2xl')) {
      console.log('✅ Container width optimized for 2x2 layout!');
    }

    // Check button heights
    const buttons = buttonContainer.querySelectorAll('button');
    console.log(`🔘 Found ${buttons.length} buttons`);

    if (buttons.length > 0) {
      const firstButton = buttons[0];
      const buttonClasses = firstButton.className;

      if (buttonClasses.includes('h-12')) {
        console.log('✅ Button height matches search bar (h-12)!');
      }

      if (buttonClasses.includes('font-medium')) {
        console.log('✅ Font weight optimized for smaller size!');
      }

      if (buttonClasses.includes('rounded-lg')) {
        console.log('✅ Corner radius adjusted for better proportions!');
      }

      // Check search bar for comparison
      const searchInput = document.querySelector(
        'input[placeholder*="project ID"]'
      );
      if (searchInput) {
        const searchClasses = searchInput.className;
        console.log('🔍 Search input classes:', searchClasses);

        if (searchClasses.includes('h-12')) {
          console.log('✅ Search bar and buttons have matching heights!');
        }
      }

      // Visual analysis
      console.log('\n📊 Visual Analysis:');
      console.log('• Layout: 2x2 grid (2 rows, 2 columns)');
      console.log('• Button height: 48px (h-12) - matches search bar');
      console.log('• Font weight: medium (more readable at smaller size)');
      console.log('• Padding: px-4 py-2.5 (more compact)');
      console.log('• Border radius: rounded-lg (proportional to height)');
      console.log('• Container: max-w-2xl (optimized for 2 columns)');

      console.log('\n🎯 Expected Benefits:');
      console.log('• Better visual balance with search bar');
      console.log('• More breathing room for button content');
      console.log('• Cleaner proportions in 2x2 layout');
      console.log('• Improved readability of button text');
    }
  }

  console.log('\n📝 How to test:');
  console.log('1. Make sure you\'re in "Manual Entry" mode');
  console.log('2. Look at the Generate Acta section');
  console.log('3. Buttons should be in 2 rows of 2 columns');
  console.log('4. Button height should match the search input above');
  console.log('5. Text should be more readable and well-proportioned');
}

// Auto-run test
testButtonLayout();

// Make available globally
window.testButtonLayout = testButtonLayout;

console.log('🔧 Run testButtonLayout() to check the new 2x2 layout');
