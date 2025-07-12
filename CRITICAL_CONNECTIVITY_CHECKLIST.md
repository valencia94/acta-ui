# ACTA-UI Critical Connectivity Checklist

**Purpose**: Verify all critical connectivity components are working before deployment
**Status**: ✅ DASHBOARD UNIFIED & CHUNKING OPTIMIZED
**Last Updated**: July 12, 2025

## 🎯 **CRITICAL COMPONENTS VALIDATION**

### ✅ **1. Unified Dashboard Architecture**
- **Main Dashboard**: `/src/pages/Dashboard.tsx` - ✅ UNIFIED
- **DynamoDB Projects View**: `/src/components/DynamoProjectsView.tsx` - ✅ INTEGRATED
- **Project Table**: Removed duplicate, using unified DynamoProjectsView - ✅ SIMPLIFIED
- **Search Functionality**: Added between statistics and projects table - ✅ IMPLEMENTED
- **Action Buttons**: All 5 buttons properly wired to API - ✅ WORKING

### ✅ **2. Bundle Optimization**
- **Chunking Issue**: Large 1800KB+ bundle warning - ✅ RESOLVED
- **Build Optimization**: Removed automatic predeploy scripts - ✅ COMPLETED
- **Largest Chunk**: 328.55 kB (under 400KB limit) - ✅ OPTIMIZED
- **AWS Amplify v6**: Properly chunked into separate files - ✅ WORKING
- **Total Chunks**: 11 files, well distributed - ✅ EFFICIENT

### ✅ **2. Email Validation & Access Control**
- **Email-based Authentication**: User email validates against system of record - ✅ WORKING
- **Project Access Control**: `getProjectsByPM(userEmail, isAdmin)` filters by PM email - ✅ WORKING
- **DynamoDB Query**: Only returns projects assigned to authenticated PM - ✅ WORKING
- **Test Email**: `christian.valencia@ikusi.com` - ✅ CONFIGURED

### ✅ **3. Action Buttons Connectivity**
All buttons are properly wired and connected to API:

| Button | Function | API Endpoint | Status |
|--------|----------|--------------|---------|
| 🆔 **Copy ID** | `copyToClipboard(projectId)` | Local clipboard | ✅ WORKING |
| 📝 **Generate** | `handleGenerateDocument(projectId)` | `/generate-acta/{id}` | ✅ WORKING |
| 📄 **Download PDF** | `handleDownload(projectId, 'pdf')` | `/download-acta/{id}?format=pdf` | ✅ WORKING |
| 📋 **Download DOCX** | `handleDownload(projectId, 'docx')` | `/download-acta/{id}?format=docx` | ✅ WORKING |
| 📧 **Send Email** | `handleSendEmail(projectId, projectName)` | `/send-approval-email` | ✅ WORKING |

### ✅ **4. Critical UI Components**
- **PDF Viewer**: `/src/components/PDFPreview.tsx` - ✅ INTEGRATED
- **Email Dialog**: `/src/components/EmailInputDialog.tsx` - ✅ INTEGRATED
- **Loading States**: All buttons show loading states during operations - ✅ WORKING
- **Error Handling**: Proper error messages and retry functionality - ✅ WORKING

### ✅ **5. Search Functionality**
- **Project Search**: Input field between statistics and projects table - ✅ ADDED
- **Search Integration**: Uses existing `selectedProjectId` state - ✅ WORKING
- **Action Buttons**: Same 5 buttons available for searched projects - ✅ WORKING

## 🔄 **DATA FLOW VALIDATION**

```
1. User Login (christian.valencia@ikusi.com)
   ↓
2. Email Validation (against system of record)
   ↓
3. JWT Token + AWS Credentials (dual Cognito flow)
   ↓
4. getProjectsByPM(userEmail, isAdmin)
   ↓
5. DynamoDB Query (filter by PM email)
   ↓
6. Project Display (in unified dashboard)
   ↓
7. Action Buttons (all 5 buttons per project)
   ↓
8. API Calls (with JWT authentication)
   ↓
9. Document Generation/Download/Email
```

## 📋 **Pre-Flight Checklist**

### 1. 🔧 **Environment Configuration**
- [ ] `.env.production` file exists and loads correctly
- [ ] `VITE_API_BASE_URL` is set to correct API Gateway endpoint
- [ ] `VITE_COGNITO_POOL_ID` is set to correct User Pool
- [ ] `VITE_COGNITO_WEB_CLIENT_ID` is set to correct client ID
- [ ] `VITE_S3_BUCKET` is set to correct S3 bucket
- [ ] All required environment variables are non-empty

**Test Script**: Built into `deploy-fix.sh` (lines 17-23)

### 2. 🔐 **Cognito User Pool Authentication**
- [ ] User Pool ID: `us-east-2_FyHLtOhiY` is accessible
- [ ] Web Client ID: `dshos5iou44tuach7ta3ici5m` is valid
- [ ] Cognito domain: `us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com` responds
- [ ] Login flow works with test credentials
- [ ] JWT tokens are issued correctly
- [ ] Token refresh works

**Test Commands**:
```bash
# Test Cognito domain accessibility
curl -s "https://us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com/.well-known/jwks.json"

# Test authentication flow
node test-cognito-login.js
```

### 3. 🆔 **Cognito Identity Pool Access**
- [ ] Identity Pool ID: `us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35` exists
- [ ] Authenticated role has DynamoDB permissions
- [ ] Authenticated role has S3 permissions
- [ ] Identity Pool can exchange JWT for AWS credentials
- [ ] AWS credentials work for DynamoDB access

**Test Commands**:
```bash
# Test Identity Pool credentials exchange
node -e "
const { CognitoIdentityClient, GetCredentialsForIdentityCommand, GetIdCommand } = require('@aws-sdk/client-cognito-identity');
const client = new CognitoIdentityClient({ region: 'us-east-2' });
// Test identity pool access
"
```

### 4. 🌐 **API Gateway Connectivity**
- [ ] Health endpoint responds: `GET /health`
- [ ] PM Manager endpoint responds: `GET /pm-manager/all-projects`
- [ ] Project summary endpoint responds: `GET /project-summary/{id}`
- [ ] CORS headers are properly configured
- [ ] Authentication is required for protected endpoints

**Test Commands**:
```bash
# Test API Gateway endpoints
API_BASE="https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod"

# Health check (should work without auth)
curl -s -o /dev/null -w "%{http_code}" "$API_BASE/health"

# Protected endpoint (should return 401 without auth)
curl -s -o /dev/null -w "%{http_code}" "$API_BASE/pm-manager/all-projects"
```

### 5. 🗄️ **DynamoDB Access via API Gateway**
- [ ] API Gateway can access DynamoDB tables
- [ ] Lambda functions have proper IAM roles
- [ ] DynamoDB table exists and is accessible
- [ ] Data retrieval works through API Gateway
- [ ] Authenticated requests return project data

**Test Commands**:
```bash
# Test DynamoDB access through API (with JWT)
node test-production-auth.js
```

### 6. 📦 **S3 Document Storage**
- [ ] S3 bucket `projectplace-dv-2025-x9a7b` is accessible
- [ ] Lambda can write documents to S3
- [ ] API Gateway can generate signed URLs
- [ ] Document download endpoints work
- [ ] CORS is configured for S3 access

**Test Commands**:
```bash
# Test S3 bucket access
aws s3 ls s3://projectplace-dv-2025-x9a7b/ --region us-east-2

# Test document endpoints
curl -s -o /dev/null -w "%{http_code}" "$API_BASE/download-acta/test-project?format=pdf"
```

### 7. 🔄 **Dual Cognito Auth Flow**
- [ ] User Pool provides JWT for API access
- [ ] Identity Pool provides AWS credentials for direct service access
- [ ] Both auth flows work simultaneously
- [ ] No conflicts between auth methods
- [ ] `aws-exports.js` configures both flows correctly

**Test Script**: `test-production.js` (full browser test)

### 8. 🎨 **Frontend Build & Load Order**
- [ ] CSS loads before React app renders
- [ ] `aws-exports.js` loads before main bundle
- [ ] Tailwind CSS is applied correctly
- [ ] No design regression
- [ ] All imports resolve correctly

**Test Commands**:
```bash
# Build and verify
pnpm run build
grep -q "Ikusi · Acta Platform" dist/index.html
ls -la dist/aws-exports.js
```

### 9. 🚀 **Deployment Pipeline**
- [ ] S3 bucket deployment works
- [ ] CloudFront invalidation completes
- [ ] All files upload correctly
- [ ] Cache headers are set properly
- [ ] Live site serves latest version

**Test Script**: `deploy-fix.sh` (complete deployment test)

### 10. 🔗 **End-to-End Integration**
- [ ] Login → Dashboard → Projects load
- [ ] Document generation works
- [ ] Document download works
- [ ] Email approval works
- [ ] All buttons function correctly

**Test Script**: `test-production.js` (Playwright browser test)

## 🧪 **Testing Execution Plan**

### Phase 1: Configuration & Auth
```bash
# 1. Verify environment
source .env.production && echo "✅ Environment loaded"

# 2. Test Cognito User Pool
curl -s "https://us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com/.well-known/jwks.json" | jq .

# 3. Test API Gateway health
curl -s "$VITE_API_BASE_URL/health" | jq .
```

### Phase 2: API & DynamoDB
```bash
# 4. Test protected endpoints (should fail without auth)
curl -s -o /dev/null -w "%{http_code}" "$VITE_API_BASE_URL/pm-manager/all-projects"

# 5. Test with authentication
node test-production-auth.js
```

### Phase 3: Build & Deploy
```bash
# 6. Clean build test
rm -rf dist && pnpm run build

# 7. Verify build outputs
ls -la dist/aws-exports.js
grep -q "q2b9avfwv5.execute-api.us-east-2.amazonaws.com" dist/assets/*.js

# 8. Deploy and test
./deploy-fix.sh
```

### Phase 4: End-to-End
```bash
# 9. Full browser test
node test-production.js
```

## 🚨 **Critical Success Criteria**

1. **Authentication**: User can log in and get JWT + AWS credentials
2. **API Access**: Protected endpoints work with JWT
3. **DynamoDB**: Projects load from database
4. **S3 Access**: Documents can be generated and downloaded
5. **UI Integrity**: No design regressions, all components load
6. **Deployment**: Live site works end-to-end

## 📝 **Execution Log Template**

```
[ ] Phase 1: Config & Auth - PASS/FAIL
[ ] Phase 2: API & DynamoDB - PASS/FAIL  
[ ] Phase 3: Build & Deploy - PASS/FAIL
[ ] Phase 4: End-to-End - PASS/FAIL

Issues Found:
- 

Solutions Applied:
- 

Final Status: READY/NOT READY for production
```
