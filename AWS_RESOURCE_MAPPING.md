# 🎯 ACCURATE AWS Resource Mapping

## 📋 **REAL AWS RESOURCES DISCOVERED**

### **Lambda Functions:**
- `ProjectPlaceDataExtractor` ← **The main function we're calling**
- `projectMetadataEnricher`
- `getProjectSummary` 
- `getTimeline`
- `getDownloadActa`
- `DocumentStatus`
- `sendApprovalEmail`
- `handleApprovalCallback`
- `HealthCheck`

### **API Gateway Endpoints:**
- `POST /extract-project-place/{id}` ← **Our target endpoint**
  - Resource ID: `j6ci0c` 
  - Integration: `AWS_PROXY` to `ProjectPlaceDataExtractor`
  - Auth: `COGNITO_USER_POOLS`
  - Timeout: `29000ms`

### **Lambda Environment Variables:**
```json
{
  "SECRET_NAME": "ProjectPlaceAPICredentials",
  "DYNAMODB_TABLE_NAME": "ProjectPlace_DataExtractor_landing_table_v3", 
  "S3_BUCKET_NAME": "projectplace-dv-2025-x9a7b"
}
```

---

## 🔄 **ACTUAL PAYLOAD MAPPING**

### **Frontend → API Gateway → Lambda**

| **Frontend Field** | **API Gateway** | **Lambda Function** | **Purpose** |
|-------------------|-----------------|---------------------|-------------|
| `projectId` | `{id}` (path param) | `event.pathParameters.id` | Project identifier |
| `pmEmail` | `body.pmEmail` | `event.body.pmEmail` | User authentication |
| `userRole` | `body.userRole` | `event.body.userRole` | Permission level |
| `s3Bucket` | `body.s3Bucket` | `event.body.s3Bucket` | Target S3 bucket |
| `generateDocuments` | `body.generateDocuments` | `event.body.generateDocuments` | Document creation flag |

### **Current Frontend Payload (ACCURATE):**
```typescript
// ✅ This is what we're actually sending
const payload = {
  projectId: projectId,          // → {id} path parameter  
  pmEmail: userEmail,           // → body.pmEmail
  userRole: userRole,           // → body.userRole
  s3Bucket: S3_BUCKET,         // → body.s3Bucket
  s3Region: s3Region,          // → body.s3Region
  cloudfrontDistributionId: cloudfrontDistributionId, // → body.cloudfrontDistributionId
  cloudfrontUrl: cloudfrontUrl, // → body.cloudfrontUrl
  requestSource: 'acta-ui',     // → body.requestSource
  generateDocuments: true,      // → body.generateDocuments
  extractMetadata: true,        // → body.extractMetadata
  timestamp: new Date().toISOString() // → body.timestamp
};

// API Call: POST /extract-project-place/{projectId}
const response = await post(`${BASE}/extract-project-place/${projectId}`, payload);
```

### **What ProjectPlaceDataExtractor Lambda Receives:**
```json
{
  "pathParameters": {
    "id": "1000000064013473"
  },
  "body": "{\"pmEmail\":\"user@example.com\",\"userRole\":\"pm\",\"s3Bucket\":\"projectplace-dv-2025-x9a7b\",\"generateDocuments\":true,...}",
  "headers": {
    "Authorization": "Bearer <cognito-jwt-token>",
    "Content-Type": "application/json"
  },
  "requestContext": {
    "authorizer": {
      "claims": {
        "email": "user@example.com",
        "cognito:username": "..."
      }
    }
  }
}
```

---

## 🔍 **DEBUGGING QUESTIONS**

### **1. Lambda Function Processing**
The `ProjectPlaceDataExtractor` Lambda should:
1. ✅ Extract `projectId` from `event.pathParameters.id`
2. ✅ Parse JSON body to get `pmEmail`, `userRole`, etc.
3. ✅ Access S3 bucket: `projectplace-dv-2025-x9a7b`
4. ✅ Generate documents if `generateDocuments: true`
5. ❓ **Return what response format?**

### **2. Expected Lambda Response**
What should `ProjectPlaceDataExtractor` return?
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"success\":true,\"message\":\"...\",\"s3_location\":\"...\"}"
}
```

### **3. Current Issues**
- ❓ Does Lambda parse the body correctly?
- ❓ Does Lambda generate documents to S3?
- ❓ What's the actual response format?
- ❓ Are there CloudWatch logs showing errors?

---

## 🧪 **TESTING STRATEGY**

### **1. Test Lambda Function Directly**
```bash
aws lambda invoke \
  --function-name ProjectPlaceDataExtractor \
  --region us-east-2 \
  --payload '{"pathParameters":{"id":"1000000064013473"},"body":"{\"pmEmail\":\"test@example.com\",\"generateDocuments\":true}"}' \
  --output json \
  response.json
```

### **2. Check CloudWatch Logs**
```bash
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/ProjectPlaceDataExtractor" \
  --region us-east-2
```

### **3. Test API Gateway Endpoint**
```bash
curl -X POST \
  "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/extract-project-place/1000000064013473" \
  -H "Authorization: Bearer <cognito-token>" \
  -H "Content-Type: application/json" \
  -d '{"pmEmail":"test@example.com","generateDocuments":true}'
```

---

## 🎯 **NEXT STEPS**

1. **Test Lambda Function**: Invoke directly to see actual response
2. **Check CloudWatch Logs**: Look for Lambda execution errors  
3. **Verify S3 Integration**: Check if documents are being created
4. **Test API Response**: Ensure proper JSON response format
5. **Update Frontend**: Handle actual response structure
