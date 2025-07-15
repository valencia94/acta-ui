# Final API Gateway to Lambda Mapping (Corrected)

Based on the actual CloudFormation template `amplify.yml`, here are the exact API Gateway endpoints and their corresponding Lambda functions:

## API Gateway Endpoints (From CloudFormation)

### 1. Document Generation
- **Endpoint**: `/documents/generate`
- **Method**: POST
- **Lambda**: `DocumentGeneratorPDF`
- **Purpose**: Generate ACTA documents and store in S3

**Request Payload**:
```json
{
  "project_id": "string",      // Required
  "pm_email": "string",        // Required
  "acta_type": "standard",     // Optional: standard|consolidated|summary
  "format_preferences": {      // Optional
    "include_timeline": true,
    "include_budget": true,
    "include_attachments": false
  },
  "approval_workflow": {       // Optional
    "enable_approval": false,
    "approver_emails": [],
    "deadline_days": 7
  }
}
```

**Response**:
```json
{
  "document_id": "string",
  "s3_url": "string",
  "cloudfront_url": "string",
  "generation_timestamp": "string",
  "expires_at": "string",
  "status": "generated"
}
```

### 2. PM Projects Management
- **Endpoint**: `/pm-projects/{pmEmail}`
- **Method**: GET
- **Lambda**: `projectMetadataEnricher`
- **Purpose**: Get projects assigned to a PM with enhanced metadata

**Response**:
```json
{
  "pm_email": "string",
  "total_projects": 0,
  "projects": [
    {
      "project_id": "string",
      "project_name": "string", 
      "pm_email": "string",
      "project_status": "string",
      "has_acta_document": false,
      "acta_status": "missing",
      "priority_level": "medium",
      "days_since_update": 0
    }
  ],
  "summary": {
    "with_acta": 0,
    "without_acta": 0, 
    "recently_updated": 0
  }
}
```

### 3. All Projects (Admin)
- **Endpoint**: `/pm-projects/all-projects`
- **Method**: GET
- **Lambda**: `projectMetadataEnricher`
- **Purpose**: Get all projects for admin users

### 4. Document Status Check
- **Endpoint**: `/documents/{documentId}`
- **Method**: GET
- **Lambda**: `DocumentGeneratorPDF`
- **Purpose**: Check document generation status

### 5. Legacy Endpoints (Still Active)
- **Endpoint**: `/project-summary/{id}`
- **Method**: GET
- **Lambda**: `generateSummary`
- **Purpose**: Get project summary data

- **Endpoint**: `/timeline/{id}`
- **Method**: GET
- **Lambda**: `getTimeline`
- **Purpose**: Get project timeline

- **Endpoint**: `/download-acta/{id}`
- **Method**: GET
- **Lambda**: `downloadAcata` (sic)
- **Purpose**: Download ACTA document (302 redirect to S3)

- **Endpoint**: `/send-approval-email`
- **Method**: POST
- **Lambda**: `sendApprovalEmail`
- **Purpose**: Send approval emails

## Frontend to API Mapping Updates

### Updated api.ts Functions:

1. **generateActaDocument()**: 
   - Endpoint: `/documents/generate`
   - Payload: Simplified, focused on required fields
   - Response: CloudFront URLs and S3 locations

2. **getProjectsByPM()**:
   - Endpoint: `/pm-projects/{pmEmail}` or `/pm-projects/all-projects`
   - Enhanced metadata from projectMetadataEnricher

3. **getActaDocumentStatus()**:
   - Endpoint: `/documents/{documentId}`
   - Check generation status

## Key Changes Made:

1. ✅ **Corrected endpoint paths** to match CloudFormation template
2. ✅ **Simplified payloads** to essential fields only
3. ✅ **Updated response handling** for new Lambda output format
4. ✅ **Maintained backward compatibility** for legacy endpoints
5. ✅ **Enhanced error handling** with Lambda-specific messages

## No AWS Changes Required:

- All Lambda functions exist and are correctly configured
- API Gateway routes are properly mapped
- S3 bucket and CloudFront distribution are operational
- Only frontend API calls needed updating to match existing infrastructure

## Testing Verification:

Run these endpoints to verify the mapping:
- `GET /pm-projects/{pmEmail}` - Should return PM project list
- `POST /documents/generate` - Should trigger document generation
- `GET /documents/{documentId}` - Should return document status

This mapping ensures the frontend correctly communicates with the existing AWS infrastructure without any backend changes.
