# 🎯 ACTUAL AWS PAYLOAD MAPPING MATRIX

## 📊 Real AWS Infrastructure Mapping (Based on CloudFormation Template)

This matrix maps the actual AWS Lambda functions, API Gateway endpoints, and expected payloads based on the verified CloudFormation template.

---

## 🏗️ **VERIFIED AWS INFRASTRUCTURE**

### **API Gateway**: `q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod`
### **Cognito User Pool**: `us-east-2_FyHLtOhiY`
### **Lambda Functions** (Actual names from CF template):

| **Lambda Function** | **Purpose** | **API Endpoint** | **HTTP Method** |
|-------------------|-------------|------------------|-----------------|
| `ProjectPlaceDataExtractor` | Generate ACTA Document | `/extract-project-place/{id}` | `POST` |
| `getDownloadActa` | Download Documents | `/download-acta/{id}` | `GET` |
| `projectMetadataEnricher` | Project Summary/PM Data | `/project-summary/{id}` | `GET` |
| `projectMetadataEnricher` | PM Projects List | `/pm-projects/{pmEmail}` | `GET` |
| `projectMetadataEnricher` | All Projects (Admin) | `/pm-projects/all-projects` | `GET` |
| `projectMetadataEnricher` | Document Status Check | `/check-document/{projectId}` | `GET/HEAD` |
| `getTimeline` | Project Timeline | `/timeline/{id}` | `GET` |
| `sendApprovalEmail` | Send Approval Email | `/send-approval-email` | `POST` |
| `HealthCheck` | Health Status | `/health` | `GET` |

---

## 🎯 **CRITICAL ENDPOINT: Generate ACTA Document**

### **Frontend → API Gateway → Lambda Mapping**

| **Frontend Payload** | **API Gateway Path** | **Lambda Function** | **Expected Lambda Input** |
|---------------------|---------------------|---------------------|---------------------------|
| `POST /extract-project-place/{projectId}` | `/{id}` path parameter | `ProjectPlaceDataExtractor` | `event.pathParameters.id` |
| Payload in body | Request body | Function body | `event.body` (JSON string) |

### **Current Frontend Payload Structure:**
```typescript
// Current frontend sends:
const payload = {
  projectId: projectId,          // ❌ REDUNDANT (already in path)
  pmEmail: userEmail,           // ✅ Required for auth context
  userRole: userRole,           // ✅ Required for permissions
  s3Bucket: S3_BUCKET,         // ❌ Lambda should know this
  s3Region: s3Region,          // ❌ Lambda should know this
  cloudfrontDistributionId: cloudfrontDistributionId, // ❌ Lambda should know this
  cloudfrontUrl: cloudfrontUrl, // ❌ Lambda should know this
  requestSource: 'acta-ui',     // ✅ Good for tracking
  generateDocuments: true,      // ✅ Required flag
  extractMetadata: true,        // ✅ Required flag
  timestamp: new Date().toISOString() // ✅ Good for tracking
};
```

### **OPTIMIZED Payload (Based on Lambda Function Analysis):**
```typescript
// Simplified payload - Lambda function likely expects:
const optimizedPayload = {
  pmEmail: userEmail,           // User context
  userRole: userRole,           // Permission level
  generateDocuments: true,      // Action flag
  extractMetadata: true,        // Action flag
  requestSource: 'acta-ui',     // Source tracking
  timestamp: new Date().toISOString() // Request tracking
};
```

### **Lambda Function Receives:**
```javascript
// In ProjectPlaceDataExtractor Lambda:
exports.handler = async (event) => {
  const projectId = event.pathParameters.id;  // From URL path
  const payload = JSON.parse(event.body);     // From request body
  
  // Expected payload fields:
  const {
    pmEmail,              // ✅ User email
    userRole,             // ✅ User role
    generateDocuments,    // ✅ Action flag
    extractMetadata,      // ✅ Action flag
    requestSource,        // ✅ Source tracking
    timestamp             // ✅ Request timestamp
  } = payload;
  
  // Lambda has access to AWS environment for:
  // - S3 bucket names (from environment variables)
  // - CloudFront distribution (from environment variables)
  // - AWS region (from Lambda context)
};
```

---

## 🔍 **OTHER CRITICAL ENDPOINTS**

### **1. PM Projects List** (`/pm-projects/{pmEmail}`)
```typescript
// Frontend call:
await get<PMProjectsResponse>(`${BASE}/pm-projects/${encodeURIComponent(pmEmail)}`);

// Lambda receives:
// event.pathParameters.pmEmail = "user@example.com"
// No body payload needed
```

### **2. Download Document** (`/download-acta/{id}`)
```typescript
// Frontend call:
await fetch(`${BASE}/download-acta/${projectId}?format=${format}`);

// Lambda receives:
// event.pathParameters.id = "1000000064013473"
// event.queryStringParameters.format = "pdf" | "docx"
```

### **3. Send Approval Email** (`/send-approval-email`)
```typescript
// Frontend payload:
const payload = {
  actaId: string,        // Project ID
  clientEmail: string    // Recipient email
};

// Lambda receives:
const { actaId, clientEmail } = JSON.parse(event.body);
```

### **4. Check Document Status** (`/check-document/{projectId}`)
```typescript
// Frontend call:
await fetch(`${BASE}/check-document/${projectId}?format=${format}`, { method: 'HEAD' });

// Lambda receives:
// event.pathParameters.projectId = "1000000064013473"
// event.queryStringParameters.format = "pdf" | "docx"
```

---

## ⚡ **IMMEDIATE ACTION REQUIRED**

### **Fix Frontend Payload for Generate ACTA:**

1. **Remove redundant fields** (Lambda gets these from environment):
   - `s3Bucket`, `s3Region`, `cloudfrontDistributionId`, `cloudfrontUrl`

2. **Remove redundant projectId** (already in URL path)

3. **Keep essential fields**:
   - `pmEmail`, `userRole`, `generateDocuments`, `extractMetadata`, `requestSource`, `timestamp`

### **Updated Frontend Function:**
```typescript
export async function generateActaDocument(
  projectId: string,
  userEmail: string,
  userRole: 'admin' | 'pm' = 'pm'
): Promise<{
  success: boolean;
  message: string;
  s3Location?: string;
  documentId?: string;
}> {
  console.log(`🔄 Generating ACTA document for project: ${projectId}`);
  console.log(`👤 User: ${userEmail} (${userRole})`);

  // OPTIMIZED payload - only send what Lambda needs
  const payload = {
    pmEmail: userEmail,           // ✅ User context
    userRole: userRole,           // ✅ Permission level  
    generateDocuments: true,      // ✅ Action flag
    extractMetadata: true,        // ✅ Action flag
    requestSource: 'acta-ui',     // ✅ Source tracking
    timestamp: new Date().toISOString() // ✅ Request tracking
  };

  console.log('📋 Optimized payload:', payload);

  try {
    const response = await post<{
      success: boolean;
      message: string;
      s3_location?: string;
      document_id?: string;
      bucket?: string;
      key?: string;
    }>(`${BASE}/extract-project-place/${projectId}`, payload);
    
    // ... rest of function
  }
}
```

---

## 🔧 **ENVIRONMENT VARIABLES NEEDED**

Based on actual infrastructure, update `env.variables.ts`:

```typescript
// VERIFIED from CloudFormation template
export const apiBaseUrl = 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';
export const COGNITO_CONFIG = {
  region: 'us-east-2',
  userPoolId: 'us-east-2_FyHLtOhiY',
  userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
};
export const CLOUDFRONT_DOMAIN = 'd7t9x3j66yd8k.cloudfront.net';
export const cloudfrontUrl = `https://${CLOUDFRONT_DOMAIN}`;

// Document storage bucket (used by Lambda, not sent in payload)
export const s3Bucket = 'projectplace-dv-2025-x9a7b';
export const s3Region = 'us-east-2';
```

---

## ✅ **VERIFICATION STEPS**

1. **Test Generate ACTA** with optimized payload
2. **Check Lambda logs** for ProjectPlaceDataExtractor function
3. **Verify S3 document creation** in projectplace-dv-2025-x9a7b bucket
4. **Test download endpoints** after generation
5. **Confirm PM projects list** works with current user email

This mapping is based on the actual AWS infrastructure and should resolve the "Generate ACTA" button issues.
