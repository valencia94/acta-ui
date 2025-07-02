# Manual Button Testing Checklist - Live Environment

## Live Site URL

https://d7t9x3j66yd8k.cloudfront.net

## Pre-Testing Setup

1. Open browser developer tools (F12)
2. Navigate to Network tab to monitor API calls
3. Clear console and network logs
4. Ensure user is authenticated (check for auth tokens)

## Button Testing Checklist

### 1. Generate ACTA Button

- **Location**: Main dashboard
- **Expected API Call**: `POST /generate-acta`
- **Expected Endpoint**: `https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/generate-acta`
- **Expected Headers**:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- **Test Steps**:
  - [ ] Click "Generate ACTA" button
  - [ ] Check Network tab for API call
  - [ ] Verify Authorization header is present
  - [ ] Check response status (should be 200 or appropriate)
  - [ ] Verify UI feedback/loading state
  - [ ] Note any errors in console

### 2. Download Word Document Button

- **Location**: Document actions section
- **Expected API Call**: `GET /download-acta?format=word`
- **Expected Endpoint**: `https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/download-acta`
- **Test Steps**:
  - [ ] Click "Download Word" button
  - [ ] Check Network tab for API call
  - [ ] Verify Authorization header is present
  - [ ] Check if file download initiates
  - [ ] Verify response headers for file download
  - [ ] Note any errors in console

### 3. Download PDF Button

- **Location**: Document actions section
- **Expected API Call**: `GET /download-acta?format=pdf`
- **Expected Endpoint**: `https://api.acta.ikusii.com/download-acta`
- **Test Steps**:
  - [ ] Click "Download PDF" button
  - [ ] Check Network tab for API call
  - [ ] Verify Authorization header is present
  - [ ] Check if file download initiates
  - [ ] Verify response headers for file download
  - [ ] Note any errors in console

### 4. Preview PDF Button

- **Location**: Document preview section
- **Expected API Call**: `GET /download-acta?format=pdf&preview=true`
- **Expected Endpoint**: `https://api.acta.ikusii.com/download-acta`
- **Test Steps**:
  - [ ] Click "Preview PDF" button
  - [ ] Check Network tab for API call
  - [ ] Verify Authorization header is present
  - [ ] Check if PDF preview opens/displays
  - [ ] Verify response content type is PDF
  - [ ] Note any errors in console

### 5. Send Approval Button

- **Location**: Approval workflow section
- **Expected API Call**: `POST /send-approval-email`
- **Expected Endpoint**: `https://api.acta.ikusii.com/send-approval-email`
- **Test Steps**:
  - [ ] Click "Send Approval" button
  - [ ] Check Network tab for API call
  - [ ] Verify Authorization header is present
  - [ ] Check request payload (should include email data)
  - [ ] Verify response indicates email sent
  - [ ] Check for success/confirmation message in UI
  - [ ] Note any errors in console

### 6. Timeline Button

- **Location**: Project tracking section
- **Expected API Call**: `GET /timeline`
- **Expected Endpoint**: `https://api.acta.ikusii.com/timeline`
- **Test Steps**:
  - [ ] Click "Timeline" button
  - [ ] Check Network tab for API call
  - [ ] Verify Authorization header is present
  - [ ] Check response data structure
  - [ ] Verify timeline data displays in UI
  - [ ] Note any errors in console

### 7. Project Summary Button

- **Location**: Dashboard overview
- **Expected API Call**: `GET /project-summary`
- **Expected Endpoint**: `https://api.acta.ikusii.com/project-summary`
- **Test Steps**:
  - [ ] Click "Project Summary" button
  - [ ] Check Network tab for API call
  - [ ] Verify Authorization header is present
  - [ ] Check response data structure
  - [ ] Verify summary data displays in UI
  - [ ] Note any errors in console

### 8. Document Status Button

- **Location**: Status tracking section
- **Expected API Call**: `GET /check-document`
- **Expected Endpoint**: `https://api.acta.ikusii.com/check-document`
- **Test Steps**:
  - [ ] Click "Document Status" button
  - [ ] Check Network tab for API call
  - [ ] Verify Authorization header is present
  - [ ] Check response data structure
  - [ ] Verify status information displays in UI
  - [ ] Note any errors in console

## Authentication Testing

- **Test Steps**:
  - [ ] Verify Cognito/Amplify authentication is working
  - [ ] Check that auth tokens are present in requests
  - [ ] Test API calls return 401/403 when unauthenticated
  - [ ] Verify token refresh functionality

## General API Testing

- **Health Check**:
  - [ ] Test `GET /health` endpoint
  - [ ] Verify CORS headers are present
  - [ ] Check response time and status

## Error Handling Testing

- **Test Steps**:
  - [ ] Test button clicks when offline/network error
  - [ ] Verify proper error messages display
  - [ ] Check loading states and spinners
  - [ ] Test timeout scenarios

## Results Documentation

For each button test, document:

1. **Status**: ✅ Pass / ❌ Fail / ⚠️ Partial
2. **API Call Made**: Yes/No + actual endpoint called
3. **Authorization Header**: Present/Missing + token format
4. **Response Status**: HTTP status code
5. **UI Feedback**: Appropriate loading/success/error states
6. **Issues Found**: Any problems or unexpected behavior

## Test Environment Details

- **Date**: **\_**
- **Browser**: **\_**
- **User Agent**: **\_**
- **Auth Status**: Authenticated/Unauthenticated
- **Network Conditions**: Normal/Slow/Offline

## Notes Section

Use this section to record any additional observations, performance issues, or recommendations for improvement.
