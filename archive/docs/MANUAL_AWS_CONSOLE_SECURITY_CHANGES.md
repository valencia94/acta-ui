# MANUAL AWS CONSOLE CHANGES FOR SECURE API GATEWAY AUTHENTICATION

## Step-by-Step Guide to Enable Cognito Authorization

**⚠️ IMPORTANT**: These changes are made directly in AWS Console to avoid CloudFormation conflicts and preserve existing infrastructure.

---

## 🎯 OBJECTIVE

Enable Cognito User Pool authorization for all protected API endpoints while preserving existing functionality.

**Current Issue**: Some endpoints are accessible without authentication (security vulnerability)
**Solution**: Add Cognito User Pool Authorizer to API Gateway and configure protected endpoints

---

## 📋 STEP 1: CREATE COGNITO USER POOL AUTHORIZER

### Navigate to API Gateway Console

1. Go to **AWS Console** → **API Gateway**
2. Select region: **us-east-2**
3. Find API: **acta-backend-manual** (ID: q2b9avfwv5)
4. Click on the API name to open it

### Create the Authorizer

1. In the left sidebar, click **Authorizers**
2. Click **Create New Authorizer**
3. Configure the following settings:

```
Name: CognitoUserPoolAuthorizer
Type: Cognito
Cognito User Pool: us-east-2_FyHLtOhiY
Token Source: Authorization
Token Validation: (leave empty)
Result TTL in seconds: 300
```

4. Click **Create**
5. **Test the Authorizer** (optional):
   - Click **Test**
   - Enter a valid JWT token from your app's localStorage
   - Should return 200 if working correctly

---

## 🔒 STEP 2: SECURE INDIVIDUAL ENDPOINTS

For each endpoint that should be protected, follow these steps:

### Endpoints to Secure:

- `/timeline/{id}` - GET
- `/project-summary/{id}` - GET
- `/download-acta/{id}` - GET
- `/extract-project-place/{id}` - POST
- `/send-approval-email` - POST

### For Each Endpoint:

1. In API Gateway console, navigate to **Resources**
2. Find the specific resource and method (e.g., `/timeline/{id}` → GET)
3. Click on the **GET** method
4. Click **Method Request**
5. Click the pencil icon next to **Authorization**
6. Change from **AWS_IAM** or **None** to **CognitoUserPoolAuthorizer**
7. Click the checkmark to save
8. Repeat for all methods that need protection

### Specific Resources to Update:

**Timeline Endpoint:**

- Resource: `/timeline/{id}`
- Method: `GET`
- Change Authorization to: `CognitoUserPoolAuthorizer`

**Project Summary Endpoint:**

- Resource: `/project-summary/{id}`
- Method: `GET`
- Change Authorization to: `CognitoUserPoolAuthorizer`

**Download ACTA Endpoint:**

- Resource: `/download-acta/{id}`
- Method: `GET`
- Change Authorization to: `CognitoUserPoolAuthorizer`

**Extract Project Place Endpoint:**

- Resource: `/extract-project-place/{id}`
- Method: `POST`
- Change Authorization to: `CognitoUserPoolAuthorizer`

**Send Approval Email Endpoint:**

- Resource: `/send-approval-email`
- Method: `POST`
- Change Authorization to: `CognitoUserPoolAuthorizer`

---

## 🚀 STEP 3: DEPLOY CHANGES

**CRITICAL**: After making all authorization changes:

1. Click **Actions** → **Deploy API**
2. Select **Deployment stage**: `prod`
3. Add **Deployment description**: "Added Cognito authorization to secure endpoints"
4. Click **Deploy**

⚠️ **Wait 2-3 minutes** for changes to propagate across all regions.

---

## ✅ STEP 4: VERIFICATION

### Test Secured Endpoints (Should Return 403):

```bash
# These should now return 403 Forbidden
curl -s https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/timeline/1000000049842296
curl -s https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/project-summary/1000000049842296
curl -s https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/download-acta/1000000049842296
```

### Test Public Endpoint (Should Still Work):

```bash
# This should still return 200 OK
curl -s https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health
```

### Test UI Functionality:

1. Start dev server: `pnpm dev`
2. Login with: valencia942003@gmail.com
3. Navigate to dashboard
4. Enter Project ID: 1000000049842296
5. Test all buttons - they should work normally
6. Check Network tab - API calls should include `Authorization: Bearer ...` headers

---

## 🛡️ SECURITY STATUS AFTER CHANGES

### Before Changes:

- ❌ Some endpoints accessible without authentication
- ❌ Mixed security model
- ❌ Data exposure risk

### After Changes:

- ✅ All protected endpoints require Cognito authentication
- ✅ Consistent security model
- ✅ Authorization headers validated
- ✅ User context available in Lambda functions

---

## 🔧 TROUBLESHOOTING

### If UI Stops Working After Changes:

1. Check browser console for authentication errors
2. Verify user is logged in (check localStorage for JWT token)
3. Check Network tab - API calls should have Authorization headers
4. If needed, clear browser cache and re-login

### If Endpoints Return 500 Errors:

1. Check CloudWatch logs for Lambda functions
2. Verify Lambda functions can handle Cognito context
3. May need to update Lambda function code to process `event.requestContext.authorizer.claims`

### If Authorization Headers Missing:

1. Verify `src/aws-exports.js` has `custom_header` function
2. Check that Amplify is properly configured in `src/main.tsx`
3. Ensure user session is valid

---

## 📊 ENDPOINTS CONFIGURATION SUMMARY

| Endpoint                      | Method | Auth Required | Status              |
| ----------------------------- | ------ | ------------- | ------------------- |
| `/health`                     | GET    | ❌ No         | Public health check |
| `/projects`                   | GET    | ✅ Yes        | Already secured     |
| `/timeline/{id}`              | GET    | ✅ Yes        | **Needs securing**  |
| `/project-summary/{id}`       | GET    | ✅ Yes        | **Needs securing**  |
| `/download-acta/{id}`         | GET    | ✅ Yes        | **Needs securing**  |
| `/extract-project-place/{id}` | POST   | ✅ Yes        | **Needs securing**  |
| `/send-approval-email`        | POST   | ✅ Yes        | **Needs securing**  |
| `/pm-projects/all-projects`   | GET    | ✅ Yes        | Already secured     |
| `/pm-projects/{email}`        | GET    | ✅ Yes        | Already secured     |
| `/check-document/{id}`        | GET    | ✅ Yes        | Already secured     |

---

## 🎉 COMPLETION CHECKLIST

- [ ] Created Cognito User Pool Authorizer in API Gateway
- [ ] Updated timeline endpoint authorization
- [ ] Updated project-summary endpoint authorization
- [ ] Updated download-acta endpoint authorization
- [ ] Updated extract-project-place endpoint authorization
- [ ] Updated send-approval-email endpoint authorization
- [ ] Deployed API changes to prod stage
- [ ] Verified endpoints return 403 without auth
- [ ] Tested UI functionality with authentication
- [ ] Confirmed Authorization headers in Network tab

**Result**: Complete security implementation without CloudFormation risks!
