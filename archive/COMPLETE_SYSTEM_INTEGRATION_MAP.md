# ACTA-UI Complete System Integration Map

## Lambda Functions, API Endpoints, and UI Feature Mapping

This document provides a comprehensive mapping of every UI feature to its corresponding Lambda function and API endpoint, ensuring complete Amplify Auth integration.

---

## 🔐 AUTHENTICATION FLOW

### Cognito Configuration

- **User Pool ID**: `us-east-2_FyHLtOhiY`
- **Web Client ID**: `1hdn8b19ub2kmfkuse8rsjpv8e`
- **Region**: `us-east-2`

### Auth Headers

- **Frontend**: Automatically adds `Authorization: Bearer <JWT_TOKEN>` to all API calls
- **Backend**: Validates JWT tokens via Cognito User Pool Authorizer

---

## 📋 COMPLETE ENDPOINT & FUNCTION MAPPING

### 1. Health Check (Public)

| UI Feature    | API Endpoint | HTTP Method | Lambda Function | Auth Required |
| ------------- | ------------ | ----------- | --------------- | ------------- |
| System Health | `/health`    | GET         | `HealthCheck`   | ❌ No         |

**Purpose**: System monitoring and availability check
**UI Location**: Background health checks
**Expected Response**: `{"status":"ok"}`

---

### 2. Project Management (Protected)

| UI Feature                 | API Endpoint                | HTTP Method | Lambda Function   | Auth Required |
| -------------------------- | --------------------------- | ----------- | ----------------- | ------------- |
| Load Project List          | `/projects`                 | GET         | `ProjectsManager` | ✅ Yes        |
| PM Project List (All)      | `/pm-projects/all-projects` | GET         | `ProjectsManager` | ✅ Yes        |
| PM Project List (By Email) | `/pm-projects/{email}`      | GET         | `ProjectsManager` | ✅ Yes        |

**Purpose**: Load and manage project lists, PM-specific project access
**UI Location**: Dashboard project loading, PM admin features
**Auth Context**: User email from JWT token used for PM-specific filtering

---

### 3. Project Summary (Protected)

| UI Feature        | API Endpoint            | HTTP Method | Lambda Function           | Auth Required |
| ----------------- | ----------------------- | ----------- | ------------------------- | ------------- |
| Load Project Data | `/project-summary/{id}` | GET         | `projectMetadataEnricher` | ✅ Yes        |

**Purpose**: Load detailed project information and metadata
**UI Location**: Dashboard project details display
**Button Mapping**: Triggered when entering Project ID in dashboard
**Expected Response**: Project details, PM info, status, completion percentage

---

### 4. Timeline Management (Protected)

| UI Feature        | API Endpoint     | HTTP Method | Lambda Function | Auth Required |
| ----------------- | ---------------- | ----------- | --------------- | ------------- |
| Generate Timeline | `/timeline/{id}` | GET         | `GetTimeline`   | ✅ Yes        |

**Purpose**: Generate and retrieve project timeline data
**UI Location**: Timeline view in dashboard
**Button Mapping**: Timeline generation and display
**Expected Response**: Array of timeline milestones with dates and activities

---

### 5. Document Generation & Downloads (Protected)

| UI Feature             | API Endpoint                      | HTTP Method | Lambda Function             | Auth Required |
| ---------------------- | --------------------------------- | ----------- | --------------------------- | ------------- |
| Generate ACTA          | `/extract-project-place/{id}`     | POST        | `ProjectPlaceDataExtractor` | ✅ Yes        |
| Download Word Document | `/download-acta/{id}?format=docx` | GET         | `GetDownloadActa`           | ✅ Yes        |
| Download PDF Document  | `/download-acta/{id}?format=pdf`  | GET         | `GetDownloadActa`           | ✅ Yes        |

**Purpose**: Generate and download ACTA documents in various formats
**UI Location**: Dashboard action buttons
**Button Mapping**:

- **Generate Button**: Calls `/extract-project-place/{id}` (POST)
- **Word Button**: Calls `/download-acta/{id}?format=docx` (GET)
- **PDF Button**: Calls `/download-acta/{id}?format=pdf` (GET)

---

### 6. Document Preview (Protected)

| UI Feature  | API Endpoint                     | HTTP Method | Lambda Function   | Auth Required |
| ----------- | -------------------------------- | ----------- | ----------------- | ------------- |
| PDF Preview | `/download-acta/{id}?format=pdf` | GET         | `GetDownloadActa` | ✅ Yes        |

**Purpose**: Display PDF document in preview modal
**UI Location**: PDF Preview modal component
**Button Mapping**: **Preview Button** - Opens PDF in modal viewer
**UI Components**:

- `PDFPreview.tsx`
- `PDFViewerCore.tsx`

---

### 7. Document Status Checking (Protected)

| UI Feature            | API Endpoint           | HTTP Method | Lambda Function  | Auth Required |
| --------------------- | ---------------------- | ----------- | ---------------- | ------------- |
| Check Document Status | `/check-document/{id}` | GET         | `DocumentStatus` | ✅ Yes        |
| Check Document (HEAD) | `/check-document/{id}` | HEAD        | `DocumentStatus` | ✅ Yes        |

**Purpose**: Verify document availability and status before download
**UI Location**: Background checks before enabling download buttons
**Button Mapping**: Automatic checks before download operations

---

### 8. Approval Workflow (Protected)

| UI Feature          | API Endpoint           | HTTP Method | Lambda Function     | Auth Required |
| ------------------- | ---------------------- | ----------- | ------------------- | ------------- |
| Send Approval Email | `/send-approval-email` | POST        | `SendApprovalEmail` | ✅ Yes        |

**Purpose**: Send approval emails to stakeholders
**UI Location**: Dashboard approval workflow
**Button Mapping**: **Send Approval** button
**Required Data**: Client email, project details, approval context

---

## 🎛️ UI COMPONENT MAPPING

### Dashboard Buttons (`src/components/ActaButtons/ActaButtons.tsx`)

```typescript
// All buttons require project ID and authentication
const buttons = [
  {
    id: 'generate',
    label: 'Generate ACTA',
    endpoint: '/extract-project-place/{id}',
    method: 'POST',
    function: 'ProjectPlaceDataExtractor',
  },
  {
    id: 'word',
    label: 'Download Word',
    endpoint: '/download-acta/{id}?format=docx',
    method: 'GET',
    function: 'GetDownloadActa',
  },
  {
    id: 'pdf',
    label: 'Download PDF',
    endpoint: '/download-acta/{id}?format=pdf',
    method: 'GET',
    function: 'GetDownloadActa',
  },
  {
    id: 'preview',
    label: 'Preview PDF',
    endpoint: '/download-acta/{id}?format=pdf',
    method: 'GET',
    function: 'GetDownloadActa',
    ui: 'Opens PDFPreview modal',
  },
];
```

### Authentication Components

- **Login**: `src/pages/Login.tsx` - Cognito authentication
- **AuthDebugger**: `src/components/AuthDebugger.tsx` - Auth debugging info
- **Protected Routes**: Authentication wrapper for all dashboard features

### PDF Viewer Components

- **PDFPreview**: `src/components/PDFPreview/PDFPreview.tsx` - PDF modal
- **PDFViewerCore**: `src/components/PDFPreview/PDFViewerCore.tsx` - PDF renderer

---

## 🔒 SECURITY IMPLEMENTATION

### API Gateway Security

```yaml
# All protected endpoints use:
AuthorizationType: COGNITO_USER_POOLS
AuthorizerId: !Ref CognitoAuthorizer

# Cognito Authorizer configuration:
CognitoAuthorizer:
  Type: AWS::ApiGateway::Authorizer
  Properties:
    Type: COGNITO_USER_POOLS
    ProviderARNs:
      - arn:aws:cognito-idp:us-east-2:703671891952:userpool/us-east-2_FyHLtOhiY
```

### Lambda Security Context

Each Lambda function receives Cognito user context:

```json
{
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "user-id",
        "email": "user@example.com",
        "cognito:groups": ["admin", "pm"]
      }
    }
  }
}
```

---

## 🧪 TESTING PROCEDURES

### 1. Authentication Testing

- **Unauthenticated**: All protected endpoints return HTTP 403
- **Authenticated**: All endpoints return proper responses with valid JWT

### 2. UI Button Testing

```javascript
// Browser console testing commands
clickButton('generate'); // Should trigger POST to /extract-project-place
clickButton('word'); // Should trigger GET to /download-acta?format=docx
clickButton('pdf'); // Should trigger GET to /download-acta?format=pdf
clickButton('preview'); // Should open PDF modal
```

### 3. Network Request Validation

- All API calls include `Authorization: Bearer <token>` header
- No 403 errors for authenticated users
- Proper error handling for expired tokens

---

## 🎯 PM-SPECIFIC FEATURES

### Automated Project Loading

- **Trigger**: User login with PM email
- **Function**: `projectMetadataEnricher`
- **Endpoint**: `/pm-projects/{email}`
- **Purpose**: Auto-load projects assigned to specific PM

### Admin Features

- **All Projects View**: `/pm-projects/all-projects`
- **User Management**: Cognito user pool administration
- **Project Assignment**: PM-specific project filtering

---

## 🚀 DEPLOYMENT STATUS

### Infrastructure Components

- ✅ **API Gateway**: Configured with Cognito authorizer
- ✅ **Lambda Functions**: All functions deployed and accessible
- ✅ **Cognito User Pool**: Configured for authentication
- ✅ **Frontend**: Authorization headers configured

### Security Status

- ✅ **Protected Endpoints**: Require authentication
- ✅ **Public Endpoints**: Health check accessible
- ✅ **JWT Validation**: Cognito User Pool authorizer
- ✅ **UI Integration**: Authorization headers sent automatically

---

## 📋 MAINTENANCE CHECKLIST

### Regular Verification

- [ ] All protected endpoints return 403 without auth
- [ ] UI login process works without errors
- [ ] All dashboard buttons function correctly
- [ ] PDF preview modal operates properly
- [ ] Document downloads work when available
- [ ] Network requests include Authorization headers
- [ ] Lambda functions process requests successfully
- [ ] CloudWatch logs show no authentication errors

### Security Auditing

- [ ] Cognito User Pool configuration
- [ ] API Gateway authorizer settings
- [ ] Lambda function permissions
- [ ] JWT token expiration handling
- [ ] Error message security (no sensitive data exposure)

---

## 🎉 COMPLETE INTEGRATION SUMMARY

This system provides **complete end-to-end integration** of:

1. **Amplify Auth** with Cognito User Pools
2. **API Gateway** with proper authorization
3. **Lambda Functions** with security context
4. **UI Components** with automatic auth headers
5. **PDF Generation** and preview capabilities
6. **Document Management** with status checking
7. **PM-specific features** with role-based access
8. **Comprehensive testing** and validation

Every UI button, API endpoint, and Lambda function is properly integrated with the authentication system, ensuring secure and functional operation of the entire ACTA-UI application.
