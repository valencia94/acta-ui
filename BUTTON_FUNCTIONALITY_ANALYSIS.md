# 🎯 ACTA-UI BUTTON FUNCTIONALITY ANALYSIS & CORRECTION PLAN

## 📊 CURRENT STATE ANALYSIS

### 🔍 AWS LAMBDA FUNCTIONS (Existing)
```
✅ Deployed Functions:
- handleApprovalCallback
- sendApprovalEmail           ← MATCHES CloudFormation expectation  
- ProjectPlaceDataExtractor   ← MATCHES CloudFormation expectation
- projectMetadataEnricher     ← Used for project summary
- autoApprovePending
- getTimeline                 ← MATCHES CloudFormation expectation
- getDownloadActa             ← MATCHES CloudFormation expectation  
- HealthCheck                 ← MATCHES CloudFormation expectation
- projectMetadataEnricherById
- getProjectSummary           ← Alternative function exists
- ProjectPlaceDataExtractor-stag

❌ Missing Functions (CloudFormation expects):
- DocumentStatus              ← MISSING
- ProjectsManager             ← MISSING  
- GetTimeline                 ← EXISTS as 'getTimeline' (case mismatch)
- GetDownloadActa             ← EXISTS as 'getDownloadActa' (case mismatch)
- SendApprovalEmail           ← EXISTS as 'sendApprovalEmail' (case mismatch)
```

### 🎯 BUTTON FUNCTIONALITY MAPPING

**Based on BUTTON_TESTING_GUIDE.md and src/lib/api.ts:**

| Button | UI Function | API Endpoint | Expected Lambda | Current Lambda Status |
|--------|-------------|--------------|----------------|----------------------|
| **Generate ACTA** | `extractProjectPlaceData()` | `POST /extract-project-place/{id}` | ProjectPlaceDataExtractor | ✅ EXISTS |
| **Download Word** | `getDownloadUrl(..., 'docx')` | `GET /download-acta/{id}?format=docx` | GetDownloadActa | ⚠️ EXISTS as 'getDownloadActa' |
| **Download PDF** | `getDownloadUrl(..., 'pdf')` | `GET /download-acta/{id}?format=pdf` | GetDownloadActa | ⚠️ EXISTS as 'getDownloadActa' |
| **Preview PDF** | `getDownloadUrl(..., 'pdf')` | `GET /download-acta/{id}?format=pdf` | GetDownloadActa | ⚠️ EXISTS as 'getDownloadActa' |
| **Send Approval** | `sendApprovalEmail()` | `POST /send-approval-email` | SendApprovalEmail | ⚠️ EXISTS as 'sendApprovalEmail' |
| **Timeline** | `getTimeline()` | `GET /timeline/{id}` | GetTimeline | ⚠️ EXISTS as 'getTimeline' |
| **Project Summary** | `getSummary()` | `GET /project-summary/{id}` | projectMetadataEnricher | ✅ EXISTS |
| **Projects List** | (via ProjectManager) | `GET /projects` | ProjectsManager | ❌ MISSING |
| **Document Check** | (status check) | `GET /check-document/{id}` | DocumentStatus | ❌ MISSING |

## 🔧 CORRECTIVE ACTIONS REQUIRED

### 1. 🏷️ **FUNCTION NAME ALIGNMENT** 
CloudFormation expects PascalCase, but functions exist in camelCase:

```bash
# Required renames/aliases:
getTimeline          → GetTimeline
getDownloadActa      → GetDownloadActa  
sendApprovalEmail    → SendApprovalEmail
```

### 2. 📦 **MISSING FUNCTION CREATION**

**A. DocumentStatus Function**
- **Purpose**: Check if ACTA document exists for project
- **Source**: Use `lambda-functions/document-status.py`
- **API Endpoint**: `GET /check-document/{projectId}`

**B. ProjectsManager Function**  
- **Purpose**: Manage project lists and PM project queries
- **Source**: Use `lambda-functions/projects-manager.py`
- **API Endpoints**: 
  - `GET /projects`
  - `GET /pm-projects/all-projects`
  - `GET /pm-projects/{pmEmail}`

### 3. 🔒 **COGNITO AUTHENTICATION INTEGRATION**

**Current Issue**: API functions exist, but Cognito authorization is not properly wired to buttons.

**Evidence from AUTHENTICATION_DEPLOYMENT_SUCCESS.md:**
- Timeline, Project Summary, Download, Generate, Send Approval now return 401 (secured)
- But buttons still not working → Auth headers not being sent from UI

## 🚀 EXECUTION PLAN

### Phase 1: Lambda Function Corrections
1. Create DocumentStatus function
2. Create ProjectsManager function  
3. Create aliases/copies with correct PascalCase names

### Phase 2: CloudFormation Stack Deployment
1. Deploy corrected CloudFormation template
2. Verify API Gateway → Lambda mappings
3. Test Cognito authorizer integration

### Phase 3: UI Authentication Wiring
1. Verify Authorization headers in API calls
2. Test button → API → Lambda flow
3. Validate end-to-end button functionality

## 📋 CRITICAL REQUIREMENTS

### UI Button Functions (from api.ts):
- `getSummary(id)` → `/project-summary/{id}` → projectMetadataEnricher
- `getTimeline(id)` → `/timeline/{id}` → GetTimeline  
- `getDownloadUrl(id, format)` → `/download-acta/{id}` → GetDownloadActa
- `sendApprovalEmail(actaId, email)` → `/send-approval-email` → SendApprovalEmail
- `extractProjectPlaceData(id)` → `/extract-project-place/{id}` → ProjectPlaceDataExtractor

### Expected Button Behavior:
1. **All buttons respond** to clicks
2. **All API calls include Authorization: Bearer {token}** 
3. **All endpoints return 200 (success) or meaningful errors**
4. **UI provides feedback** for all operations

## 🎯 SUCCESS CRITERIA

✅ **All 5 core buttons functional:**
- Generate ACTA Button
- Download Word Button  
- Download PDF Button
- Preview PDF Button
- Send Approval Button

✅ **Authentication flow complete:**
- Cognito login → JWT token → Authorization headers → API Gateway → Lambda

✅ **API Gateway properly configured:**
- All protected endpoints require Cognito authorization
- Correct Lambda function mappings
- Proper CORS configuration

---

**NEXT ACTION**: Execute corrective deployment plan to achieve full button functionality with Cognito authentication.
