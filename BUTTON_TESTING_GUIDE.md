# 🧪 COMPREHENSIVE BUTTON TESTING GUIDE

## 🎯 **TESTING OBJECTIVE**

Verify that all dashboard buttons in ACTA-UI are making proper API calls and producing expected results in the UI after the authentication security implementation.

---

## 🚀 **TESTING SETUP**

### **Step 1: Access the Application**

- **URL**: http://localhost:3000
- **Login Credentials**:
  - Email: `valencia942003@gmail.com`
  - Password: `PdYb7TU7HvBhYP7$`

### **Step 2: Prepare Browser for Testing**

1. **Open Browser Developer Tools** (F12)
2. **Go to Network Tab** - This will show all API requests
3. **Open Console Tab** - Enhanced testing script will automatically run
4. **Clear Network Tab** - Click "Clear" to start fresh

### **Step 3: Login and Navigate**

1. Login with the credentials above
2. Navigate to the Dashboard
3. **Enter Test Project ID**: `1000000049842296`

---

## 🖱️ **BUTTON TESTING PROCEDURE**

### **For EACH Button, Test the Following:**

#### **🔵 GENERATE ACTA Button**

**Expected Behavior:**

- ✅ Shows loading spinner or toast notification
- ✅ Makes POST request to `/extract-project-place/1000000049842296`
- ✅ Request includes `Authorization: Bearer <token>` header
- ✅ Either succeeds (200) or shows meaningful error message
- ✅ UI updates to reflect success/failure

**Test Steps:**

1. Click "Generate ACTA" button
2. Watch Network tab for new request
3. Check request headers for Authorization
4. Note response status and UI feedback

---

#### **🔵 DOWNLOAD WORD Button**

**Expected Behavior:**

- ✅ Makes GET request to `/download-acta/1000000049842296?format=docx`
- ✅ Request includes Authorization header
- ✅ Either downloads file (200) or shows "Generate first" message (404)
- ✅ No silent failures

**Test Steps:**

1. Click "Download Word" button
2. Check Network tab for download request
3. Verify Authorization header present
4. Check if file downloads or error shown

---

#### **🔵 DOWNLOAD PDF Button**

**Expected Behavior:**

- ✅ Makes GET request to `/download-acta/1000000049842296?format=pdf`
- ✅ Request includes Authorization header
- ✅ Either downloads file (200) or shows "Generate first" message (404)
- ✅ No silent failures

**Test Steps:**

1. Click "Download PDF" button
2. Check Network tab for download request
3. Verify Authorization header present
4. Check if file downloads or error shown

---

#### **🔵 PREVIEW PDF Button**

**Expected Behavior:**

- ✅ Makes GET request to `/download-acta/1000000049842296?format=pdf`
- ✅ Request includes Authorization header
- ✅ Either opens PDF preview modal (200) or shows error (404)
- ✅ PDF modal displays properly if document exists

**Test Steps:**

1. Click "Preview PDF" button
2. Check Network tab for PDF request
3. Verify Authorization header present
4. Check if modal opens with PDF content or shows error

---

#### **🔵 SEND APPROVAL Button**

**Expected Behavior:**

- ✅ Makes POST request to `/send-approval-email`
- ✅ Request includes Authorization header
- ✅ Shows success message or meaningful error
- ✅ UI feedback indicates operation result

**Test Steps:**

1. Click "Send Approval" button
2. Check Network tab for POST request
3. Verify Authorization header present
4. Check for success/error messages in UI

---

## 🔍 **DEBUGGING CHECKLIST**

### **❌ IF BUTTON DOESN'T RESPOND:**

- [ ] Check browser console for JavaScript errors
- [ ] Verify project ID is entered in input field
- [ ] Check if button is disabled or hidden
- [ ] Look for any React/UI framework errors

### **❌ IF NO API CALL IS MADE:**

- [ ] Confirm button click is registered (console logs)
- [ ] Check if onclick handlers are attached
- [ ] Verify network connectivity
- [ ] Look for JavaScript errors preventing execution

### **❌ IF API CALL FAILS:**

- [ ] **Status 401**: Authentication problem - check Authorization header
- [ ] **Status 403**: Permission denied - check user permissions
- [ ] **Status 404**: Document not found - may need to generate first
- [ ] **Status 500**: Server error - check Lambda function logs
- [ ] **Status 504**: Timeout - Lambda function taking too long

### **❌ IF UI DOESN'T UPDATE:**

- [ ] Check if API call succeeded but UI didn't reflect changes
- [ ] Look for React state update issues
- [ ] Verify error handling is working
- [ ] Check for missing user feedback mechanisms

---

## 🧪 **AUTOMATED TESTING COMMANDS**

### **In Browser Console, run:**

```javascript
// Run complete test suite
testButtonFunctionality.runAllTests();

// View all network requests made
testButtonFunctionality.getNetworkRequests();

// Clear request log
testButtonFunctionality.clearNetworkRequests();

// Test individual button functions (if they exist)
clickButton('generate');
clickButton('word');
clickButton('pdf');
clickButton('preview');
```

---

## 📊 **EXPECTED RESULTS SUMMARY**

### **✅ SUCCESS INDICATORS:**

1. **All buttons respond** when clicked
2. **Network requests appear** in Network tab
3. **Authorization headers present** in all API calls
4. **Appropriate status codes**: 200 (success), 404 (not found), 401 only if auth fails
5. **UI feedback provided** for all operations
6. **Error messages are meaningful** and actionable

### **❌ FAILURE INDICATORS:**

1. **Buttons don't respond** to clicks
2. **No network requests** generated
3. **Missing Authorization headers** in requests
4. **Silent failures** without user feedback
5. **JavaScript errors** in console
6. **Broken UI components** or modals

---

## 📝 **TEST REPORT TEMPLATE**

**Please report results for each button:**

```
🔵 GENERATE ACTA BUTTON:
- Responds to click: [YES/NO]
- Makes API call: [YES/NO]
- Authorization header: [PRESENT/MISSING]
- Response status: [200/404/401/500/etc]
- UI feedback: [DESCRIPTION]
- Issues found: [DESCRIPTION]

🔵 DOWNLOAD WORD BUTTON:
- Responds to click: [YES/NO]
- Makes API call: [YES/NO]
- Authorization header: [PRESENT/MISSING]
- Response status: [200/404/401/500/etc]
- UI feedback: [DESCRIPTION]
- Issues found: [DESCRIPTION]

... (repeat for all buttons)
```

---

## 🎯 **CRITICAL SUCCESS METRICS**

**For the testing to be considered successful:**

- ✅ **100% of buttons must respond** to clicks
- ✅ **100% of button clicks must generate API calls**
- ✅ **100% of API calls must include Authorization headers**
- ✅ **100% of operations must provide UI feedback**

**Any failures in these areas indicate issues that need to be resolved.**

---

## 🚀 **START TESTING!**

1. **Open**: http://localhost:3000
2. **Login**: valencia942003@gmail.com / PdYb7TU7HvBhYP7$
3. **Enter Project ID**: 1000000049842296
4. **Test each button systematically**
5. **Report findings using the template above**

The enhanced test script will automatically monitor and log all network activity, making it easy to see exactly what's happening when each button is clicked!
