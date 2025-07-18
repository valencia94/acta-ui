# ACTA-UI Button Testing Guide

This guide explains how to test all buttons in the ACTA-UI application to ensure they are functioning correctly.

## Testing Methods

There are two ways to test the buttons in ACTA-UI:

1. **Button Test Runner**: A visual browser-based tool that runs all button tests in one place.
2. **Individual Test Scripts**: Direct console-based tests for specific functionality.

## Quick Start - Button Test Runner

The simplest way to test all buttons at once is to use the button test runner:

```bash
./test-buttons.sh
```

This will:

1. Start a local web server
2. Open your browser to the button test runner page
3. Allow you to run any of the test suites by clicking on the corresponding buttons

## Available Test Suites

### 1. Button Functionality Test

Tests if all UI buttons are present and functioning correctly:

- Generate button
- Send Approval button
- Word download button
- PDF Preview button
- PDF Download button

### 2. Navigation Button Test

Verifies that navigation buttons work correctly for moving between application views.

### 3. Production Readiness Validation

Comprehensive test of all UI systems for production readiness, including button functionality.

### 4. Comprehensive Auth & API Test

Tests authentication and API integrations including button action effects.

## Manual Testing (Console-Based)

If you prefer to run the tests directly in the browser console, you can:

1. Open the ACTA-UI application in your browser
2. Open the browser developer tools (F12 or Right-click > Inspect)
3. Go to the Console tab
4. Copy and paste one of these scripts:

```javascript
// Load button functionality test
var script = document.createElement("script");
script.src = "/public/button-functionality-test.js";
document.head.appendChild(script);
```

```javascript
// Load production readiness validation
var script = document.createElement("script");
script.src = "/public/production-readiness-validation.js";
document.head.appendChild(script);
```

```javascript
// Load navigation button test
var script = document.createElement("script");
script.src = "/public/navigation-button-test.js";
document.head.appendChild(script);
```

```javascript
// Load comprehensive auth & API test
var script = document.createElement("script");
script.src = "/public/comprehensive-auth-api-test.js";
document.head.appendChild(script);
```

## Expected Results

A successful test run will show:

- ✅ All buttons are present and correctly labeled
- ✅ Buttons enable/disable based on input validation
- ✅ Click handlers are attached to all buttons
- ✅ Navigation between different views works correctly
- ✅ API connections function when buttons are clicked

## Troubleshooting

If buttons are not working as expected:

1. Check browser console for JavaScript errors
2. Verify the aws-exports.js configuration is correct
3. Ensure API endpoints are accessible
4. Confirm Cognito authentication is working correctly
5. Check that the UI is built with the latest code changes

## Production Testing

For testing in the production environment:

1. Deploy the application to production
2. Access the application via the production URL
3. Open the browser developer tools
4. Load the test scripts as described above or use the button-test-runner.html if it has been deployed
