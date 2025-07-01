# Manual Workflow Testing Guide - ACTA-UI

## Overview

This guide helps you test the ACTA-UI manual workflows when the backend API is unavailable. The frontend should remain functional for manual entry and individual ACTA generation workflows.

## Prerequisites

- ✅ ACTA-UI is deployed to CloudFront: https://d7t9x3j66yd8k.cloudfront.net
- ✅ User is authenticated (logged in)
- ⚠️ Backend API may be unavailable (expected condition)

## Testing Steps

### 1. Access the Dashboard

1. Navigate to: https://d7t9x3j66yd8k.cloudfront.net
2. **Expected:** Should redirect to login if not authenticated
3. **Expected:** Should show dashboard if authenticated
4. **Visual Check:** Header shows user email and logout button

### 2. Test Mode Toggle

1. Look for "Dashboard Mode" toggle with two options:
   - "PM Projects"
   - "Manual Entry"
2. **Click "Manual Entry"**
3. **Expected:** UI switches to manual entry mode
4. **Visual Check:** Project ID input field appears

### 3. Test Manual Entry Interface

1. **Visual Check:** Manual Entry section should show:
   - Project ID input field
   - "Generate Acta" button
   - "Download PDF" button
   - "Download Word" button
   - "Preview PDF" button
   - "Send for Approval" button
   - "Backend Status" section with "Test Backend" button

### 4. Test Project ID Input

1. Enter a test Project ID: `1000000064013473`
2. **Expected:** Input accepts the value
3. **Expected:** Action buttons should become enabled (not grayed out)
4. **Visual Check:** All ACTA action buttons are clickable

### 5. Test Backend Status

1. **Click "Test Backend" button**
2. **Expected:** Should show backend connectivity status
3. **Expected:** May show "Backend unavailable" message (this is expected)

### 6. Test Button Functionality (Limited Mode)

When backend is unavailable, buttons should show appropriate error messages:

#### Test Generate Acta Button

1. **Click "Generate Acta"**
2. **Expected:** Loading state appears
3. **Expected:** Error toast appears indicating API unavailable
4. **Check:** UI remains responsive, no crashes

#### Test Download Buttons

1. **Click "Download PDF"**
2. **Expected:** Loading state appears
3. **Expected:** Error message about document not found or API unavailable
4. **Repeat for "Download Word"**

#### Test Preview PDF Button

1. **Click "Preview PDF"**
2. **Expected:** Error message about preview unavailable

#### Test Send for Approval

1. **Click "Send for Approval"**
2. **Expected:** Error message about email service unavailable

### 7. Test Authentication Persistence

1. **Refresh the page**
2. **Expected:** Should remain logged in
3. **Expected:** Should return to dashboard without requiring re-login

### 8. Test Navigation

1. **Click on different sections** (if available)
2. **Test "Profile" link** (should show coming soon page)
3. **Avoid "Admin Panel"** (requires backend API)

## Browser Console Testing

### Run Automated Test Script

1. **Open browser Developer Tools (F12)**
2. **Go to Console tab**
3. **Paste and run this command:**

```javascript
// Load the test script
fetch('/manual-workflow-test.js')
  .then((response) => response.text())
  .then((script) => eval(script))
  .catch(() =>
    console.log('Manual test script not found, running basic checks...')
  );
```

### Manual Console Commands

If the script doesn't load, run these manual checks:

```javascript
// Check authentication
console.log('JWT Token:', !!localStorage.getItem('ikusi.jwt'));

// Check current page
console.log('Current Path:', window.location.pathname);

// Check if manual entry input exists
console.log(
  'Project ID Input:',
  !!document.querySelector('input[id="projectId"]')
);

// Check if action buttons exist
const buttons = Array.from(document.querySelectorAll('button'))
  .map((b) => b.textContent)
  .filter(
    (text) =>
      text.includes('Generate') ||
      text.includes('Download') ||
      text.includes('Preview')
  );
console.log('Action Buttons:', buttons);
```

## Expected Results Summary

### ✅ Should Work (Frontend Only)

- ✅ User authentication and login
- ✅ Dashboard navigation
- ✅ Mode switching (PM Projects ↔ Manual Entry)
- ✅ Project ID input
- ✅ Button state management (enabled/disabled)
- ✅ Error handling and toast notifications
- ✅ UI responsiveness and loading states

### ⚠️ Expected Limitations (Backend Unavailable)

- ⚠️ "Generate Acta" will show API error
- ⚠️ Downloads will fail with "document not found"
- ⚠️ Email sending will fail
- ⚠️ PM Projects mode may not load project list
- ⚠️ Admin panel will show "Access Denied"

### ❌ Should NOT Happen

- ❌ White screen or app crash
- ❌ Unable to login
- ❌ Cannot switch to Manual Entry mode
- ❌ Buttons permanently disabled
- ❌ No error messages for failed actions

## Troubleshooting

### If Manual Entry Mode Not Visible

1. Check if you're logged in properly
2. Refresh the page
3. Clear browser cache
4. Check browser console for JavaScript errors

### If Buttons Don't Respond

1. Enter a valid Project ID first
2. Check browser console for errors
3. Verify page is fully loaded
4. Try refreshing the page

### If Authentication Issues

1. Clear localStorage: `localStorage.clear()`
2. Navigate to login page manually
3. Complete the login flow again

## Success Criteria

The test is successful if:

1. ✅ User can access the dashboard when authenticated
2. ✅ Can switch to Manual Entry mode
3. ✅ Can enter Project ID and enable buttons
4. ✅ Buttons show proper loading states and error messages
5. ✅ UI remains functional despite backend unavailability
6. ✅ No critical errors that break the application

## Documentation

- Full button integration: `ACTA_UI_BUTTON_INTEGRATION_SUCCESS.md`
- API endpoint mapping: `BUTTON_TESTING_GUIDE.md`
- Production deployment: `DEPLOYMENT_COMPLETE_STATUS.md`
- Limited API mode: `PRODUCTION_TESTING_LIMITED_API.md`
