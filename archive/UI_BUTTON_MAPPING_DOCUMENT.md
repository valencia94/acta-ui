# ACTA-UI Button Functionality Mapping Document

## 🎯 **COMPLETE BUTTON-TO-API-TO-LAMBDA MAPPING**

This document maps every UI button to its corresponding API endpoint and Lambda function to ensure complete functionality.

---

## 📱 **DASHBOARD BUTTONS**

### **1. GENERATE ACTA BUTTON**

- **UI Handler**: `handleGenerateActa()`
- **API Call**: `POST /extract-project-place/{projectId}`
- **Lambda Function**: `ProjectPlaceDataExtractor`
- **Purpose**: Generate ACTA document from project data
- **Auth Required**: ✅ Cognito User Pool
- **Response**: Document generation status

```javascript
// Frontend Implementation
const handleGenerateActa = async () => {
  const response = await api.post(`/extract-project-place/${projectId}`);
};
```

### **2. DOWNLOAD PDF BUTTON**

- **UI Handler**: `handleDownloadPdf()`
- **API Call**: `GET /download-acta/{projectId}?format=pdf`
- **Lambda Function**: `getDownloadActa`
- **Purpose**: Download ACTA document as PDF
- **Auth Required**: ✅ Cognito User Pool
- **Response**: PDF file download

```javascript
// Frontend Implementation
const handleDownloadPdf = async () => {
  const response = await api.get(`/download-acta/${projectId}?format=pdf`);
};
```

### **3. DOWNLOAD WORD BUTTON**

- **UI Handler**: `handleDownloadWord()`
- **API Call**: `GET /download-acta/{projectId}?format=docx`
- **Lambda Function**: `getDownloadActa`
- **Purpose**: Download ACTA document as Word document
- **Auth Required**: ✅ Cognito User Pool
- **Response**: DOCX file download

```javascript
// Frontend Implementation
const handleDownloadWord = async () => {
  const response = await api.get(`/download-acta/${projectId}?format=docx`);
};
```

### **4. PREVIEW PDF BUTTON**

- **UI Handler**: `handlePreviewPdf()`
- **API Call**: `GET /download-acta/{projectId}?format=pdf`
- **Lambda Function**: `getDownloadActa`
- **Purpose**: Preview ACTA document in PDF viewer modal
- **Auth Required**: ✅ Cognito User Pool
- **Response**: PDF data for viewer

```javascript
// Frontend Implementation
const handlePreviewPdf = async () => {
  const response = await api.get(`/download-acta/${projectId}?format=pdf`);
  setPdfPreviewUrl(response.data.url);
  setShowPdfPreview(true);
};
```

### **5. SEND FOR APPROVAL BUTTON**

- **UI Handler**: `handleSendApproval()`
- **API Call**: `POST /send-approval-email`
- **Lambda Function**: `sendApprovalEmail`
- **Purpose**: Send ACTA document for approval via email
- **Auth Required**: ✅ Cognito User Pool
- **Response**: Email send confirmation

```javascript
// Frontend Implementation
const handleSendApproval = async () => {
  const response = await api.post('/send-approval-email', {
    projectId,
    recipientEmail,
    documentUrl,
  });
};
```

---

## 📊 **PROJECT MANAGEMENT FUNCTIONS**

### **6. LOAD PROJECT DATA**

- **UI Handler**: `useEffect()` on project ID change
- **API Call**: `GET /project-summary/{projectId}`
- **Lambda Function**: `projectMetadataEnricher`
- **Purpose**: Load project details and metadata
- **Auth Required**: ✅ Cognito User Pool
- **Response**: Project data object

```javascript
// Frontend Implementation
useEffect(() => {
  const loadProjectData = async () => {
    const response = await api.get(`/project-summary/${projectId}`);
    setProjectData(response.data);
  };
}, [projectId]);
```

### **7. VIEW TIMELINE**

- **UI Handler**: `handleViewTimeline()`
- **API Call**: `GET /timeline/{projectId}`
- **Lambda Function**: `getTimeline`
- **Purpose**: Display project timeline and milestones
- **Auth Required**: ✅ Cognito User Pool
- **Response**: Timeline data array

```javascript
// Frontend Implementation
const handleViewTimeline = async () => {
  const response = await api.get(`/timeline/${projectId}`);
  setTimelineData(response.data);
  setShowTimeline(true);
};
```

---

## 🔍 **SUPPORT FUNCTIONS**

### **8. HEALTH CHECK (PUBLIC)**

- **UI Handler**: Background health monitoring
- **API Call**: `GET /health`
- **Lambda Function**: `HealthCheck`
- **Purpose**: System health monitoring
- **Auth Required**: ❌ Public endpoint
- **Response**: System status

### **9. DOCUMENT STATUS CHECK**

- **UI Handler**: Background document verification
- **API Call**: `GET /check-document/{projectId}`
- **Lambda Function**: `projectMetadataEnricher`
- **Purpose**: Check if documents exist and are valid
- **Auth Required**: ✅ Cognito User Pool
- **Response**: Document status

### **10. PROJECT LIST (PM FUNCTIONS)**

- **UI Handler**: PM dashboard project loading
- **API Call**: `GET /projects` or `GET /pm-projects/all-projects`
- **Lambda Function**: `projectMetadataEnricher`
- **Purpose**: Load project lists for project managers
- **Auth Required**: ✅ Cognito User Pool
- **Response**: Project list array

---

## 🔐 **AUTHENTICATION FLOW**

### **Amplify Integration:**

```javascript
// src/index.js
const cognitoAuthConfig = {
  authority: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_FyHLtOhiY',
  client_id: 'dshos5iou44tuach7ta3ici5m',
  redirect_uri: 'https://d7t9x3j66yd8k.cloudfront.net',
  response_type: 'code',
  scope: 'email openid phone',
};
```

### **API Authorization Headers:**

```javascript
// All protected API calls include:
headers: {
  'Authorization': `Bearer ${userToken}`,
  'Content-Type': 'application/json'
}
```

---

## 🏗️ **CLOUDFORMATION ENDPOINT MAPPING**

| **Button Action** | **HTTP Method** | **API Gateway Resource**      | **Lambda Permission**           |
| ----------------- | --------------- | ----------------------------- | ------------------------------- |
| Generate ACTA     | POST            | `/extract-project-place/{id}` | `ExtractProjectPlacePermission` |
| Download PDF      | GET             | `/download-acta/{id}`         | `DownloadActaPermission`        |
| Download Word     | GET             | `/download-acta/{id}`         | `DownloadActaPermission`        |
| Preview PDF       | GET             | `/download-acta/{id}`         | `DownloadActaPermission`        |
| Send Approval     | POST            | `/send-approval-email`        | `SendApprovalEmailPermission`   |
| Load Project      | GET             | `/project-summary/{id}`       | `ProjectSummaryPermission`      |
| View Timeline     | GET             | `/timeline/{id}`              | `TimelinePermission`            |
| Health Check      | GET             | `/health`                     | `HealthPermission`              |
| Check Document    | GET             | `/check-document/{id}`        | `CheckDocumentPermission`       |
| List Projects     | GET             | `/projects`                   | `ProjectsPermission`            |

---

## 🧪 **TESTING CHECKLIST**

### **Pre-Deployment Testing:**

- [ ] All Lambda functions exist in AWS
- [ ] All function names match CloudFormation template
- [ ] Cognito User Pool is accessible
- [ ] API Gateway ID is correct

### **Post-Deployment Testing:**

- [ ] User can log in with Cognito
- [ ] Generate ACTA button creates document
- [ ] Download PDF button downloads file
- [ ] Download Word button downloads file
- [ ] Preview PDF button opens viewer
- [ ] Send Approval button sends email
- [ ] Timeline loads project data
- [ ] All buttons show proper loading states
- [ ] Error handling works for failed requests

### **Error Scenarios to Test:**

- [ ] Unauthenticated user access (should return 401)
- [ ] Invalid project ID (should return 404)
- [ ] Network timeout (should show error message)
- [ ] Document not ready (should show appropriate message)

---

## 🔄 **WORKFLOW SEQUENCE**

### **Typical User Flow:**

1. **Login** → Cognito authentication
2. **Enter Project ID** → Triggers project data loading
3. **Generate ACTA** → Creates document (if not exists)
4. **Preview/Download** → Access generated document
5. **Send Approval** → Email notification to stakeholders

### **API Call Sequence:**

1. `GET /project-summary/{id}` - Load project data
2. `POST /extract-project-place/{id}` - Generate document
3. `GET /download-acta/{id}?format=pdf` - Download/preview
4. `POST /send-approval-email` - Send for approval

This mapping ensures complete coverage of all button functionality with proper authentication and Lambda function integration.
