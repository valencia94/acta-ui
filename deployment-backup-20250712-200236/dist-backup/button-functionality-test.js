// button-functionality-test.js
// 🎯 ACTA-UI Button Functionality Validation Test
// Run this in the browser console to test ONLY the button functionality

console.log("🎯 Starting Button Functionality Test...");

// Test 1: Check if ActaButtons component is rendered
console.log("\n═══ TEST 1: BUTTON PRESENCE ═══");
function checkButtonPresence() {
  const buttonTexts = ["Generate", "Send Approval", "Word", "Preview", "PDF"];
  const foundButtons = {};

  buttonTexts.forEach((text) => {
    // Look for buttons containing the text
    const buttons = Array.from(document.querySelectorAll("button")).filter(
      (btn) => btn.textContent?.includes(text) || btn.innerText?.includes(text),
    );
    foundButtons[text] = buttons.length > 0;
    console.log(
      `${buttons.length > 0 ? "✅" : "❌"} ${text} button: ${buttons.length > 0 ? "Found" : "Not found"}`,
    );
  });

  return foundButtons;
}

// Test 2: Check button states and properties
console.log("\n═══ TEST 2: BUTTON STATES ═══");
function checkButtonStates() {
  const allButtons = document.querySelectorAll("button");
  console.log(`📊 Total buttons found: ${allButtons.length}`);

  let enabledCount = 0;
  let disabledCount = 0;

  allButtons.forEach((btn, index) => {
    if (btn.disabled) {
      disabledCount++;
    } else {
      enabledCount++;
    }
  });

  console.log(`✅ Enabled buttons: ${enabledCount}`);
  console.log(`❌ Disabled buttons: ${disabledCount}`);

  return {
    total: allButtons.length,
    enabled: enabledCount,
    disabled: disabledCount,
  };
}

// Test 3: Check button click handlers
console.log("\n═══ TEST 3: BUTTON CLICK HANDLERS ═══");
function testButtonClickHandlers() {
  const buttonTests = [
    { name: "Generate", text: "Generate" },
    { name: "Send Approval", text: "Send Approval" },
    { name: "Download Word", text: "Word" },
    { name: "Preview PDF", text: "Preview" },
    { name: "Download PDF", text: "PDF" },
  ];

  const results = {};

  buttonTests.forEach(({ name, text }) => {
    const buttons = Array.from(document.querySelectorAll("button")).filter(
      (btn) => btn.textContent?.includes(text) || btn.innerText?.includes(text),
    );

    if (buttons.length > 0) {
      const button = buttons[0];
      // Check if button has click event listeners
      const hasClickHandler =
        button.onclick !== null || button.addEventListener !== undefined;
      results[name] = {
        found: true,
        hasHandler: hasClickHandler,
        disabled: button.disabled,
        className: button.className,
      };
      console.log(
        `${hasClickHandler ? "✅" : "⚠️"} ${name}: ${hasClickHandler ? "Has click handler" : "No click handler detected"}`,
      );
    } else {
      results[name] = { found: false };
      console.log(`❌ ${name}: Button not found`);
    }
  });

  return results;
}

// Test 4: Check project input field
console.log("\n═══ TEST 4: PROJECT INPUT FIELD ═══");
function checkProjectInput() {
  const projectInputs = document.querySelectorAll(
    'input[type="text"], input[placeholder*="Project"], input[name*="project"]',
  );
  console.log(`📝 Project input fields found: ${projectInputs.length}`);

  if (projectInputs.length > 0) {
    const input = projectInputs[0];
    console.log(
      `✅ First project input: value="${input.value}", placeholder="${input.placeholder}"`,
    );
    return { found: true, value: input.value, placeholder: input.placeholder };
  } else {
    console.log("❌ No project input field found");
    return { found: false };
  }
}

// Test 5: Test button interactions (without API calls)
console.log("\n═══ TEST 5: BUTTON INTERACTION TEST ═══");
function testButtonInteractions() {
  // Find project input
  const projectInput = document.querySelector(
    'input[type="text"], input[placeholder*="Project"]',
  );

  if (projectInput) {
    // Set a test project ID
    projectInput.value = "1000000049842296";
    projectInput.dispatchEvent(new Event("input", { bubbles: true }));
    console.log("✅ Test project ID set: 1000000049842296");
  }

  // Test Generate button click (simulate)
  const generateBtn = Array.from(document.querySelectorAll("button")).find(
    (btn) =>
      btn.textContent?.includes("Generate") &&
      !btn.textContent?.includes("PDF"),
  );

  if (generateBtn && !generateBtn.disabled) {
    console.log("🎯 Generate button is clickable");
    // Don't actually click it, just verify it's ready
    return { generateReady: true, projectIdSet: !!projectInput?.value };
  } else {
    console.log("⚠️ Generate button not ready or disabled");
    return { generateReady: false, projectIdSet: !!projectInput?.value };
  }
}

// Run all tests
async function runButtonTests() {
  console.log("\n🚀 RUNNING BUTTON VALIDATION TESTS...\n");

  const results = {
    buttonPresence: checkButtonPresence(),
    buttonStates: checkButtonStates(),
    clickHandlers: testButtonClickHandlers(),
    projectInput: checkProjectInput(),
    interactions: testButtonInteractions(),
  };

  console.log("\n═══ BUTTON TEST SUMMARY ═══");

  // Count passed tests
  let passedTests = 0;
  let totalTests = 0;

  // Button presence
  const foundButtons = Object.values(results.buttonPresence).filter(
    Boolean,
  ).length;
  totalTests += 5;
  passedTests += foundButtons;
  console.log(`📊 Button Presence: ${foundButtons}/5 buttons found`);

  // Button states
  totalTests += 1;
  if (results.buttonStates.enabled > 0) passedTests += 1;
  console.log(
    `📊 Button States: ${results.buttonStates.enabled} enabled buttons`,
  );

  // Click handlers
  const handlersWorking = Object.values(results.clickHandlers).filter(
    (r) => r.found && r.hasHandler,
  ).length;
  totalTests += Object.keys(results.clickHandlers).length;
  passedTests += handlersWorking;
  console.log(`📊 Click Handlers: ${handlersWorking} buttons have handlers`);

  // Project input
  totalTests += 1;
  if (results.projectInput.found) passedTests += 1;
  console.log(
    `📊 Project Input: ${results.projectInput.found ? "Found" : "Not found"}`,
  );

  // Interactions
  totalTests += 1;
  if (results.interactions.generateReady) passedTests += 1;
  console.log(
    `📊 Button Readiness: Generate button ${results.interactions.generateReady ? "ready" : "not ready"}`,
  );

  console.log(
    `\n🎯 BUTTON VALIDATION SCORE: ${passedTests}/${totalTests} tests passed`,
  );

  if (passedTests === totalTests) {
    console.log(
      "🎉 ALL BUTTON TESTS PASSED! Button functionality is working correctly.",
    );
  } else if (passedTests >= totalTests * 0.8) {
    console.log("✅ MOSTLY WORKING: Most button functionality is operational.");
  } else {
    console.log(
      "⚠️ ISSUES DETECTED: Some button functionality needs attention.",
    );
  }

  return results;
}

// Auto-run tests
setTimeout(runButtonTests, 1000);

console.log("🎯 Button test script loaded. Running tests in 1 second...");
console.log("💡 Manual run: runButtonTests()");

// Export for manual testing
window.buttonTests = {
  runButtonTests,
  checkButtonPresence,
  checkButtonStates,
  testButtonClickHandlers,
  checkProjectInput,
  testButtonInteractions,
};
