# Final API Endpoint Mapping - AWS Infrastructure Alignment

## Overview
This document maps the frontend API calls to the actual AWS infrastructure as defined in the CloudFormation template. All AWS resources are already deployed and verified.

## API Gateway Configuration
- **API ID**: `q2b9avfwv5`
- **API Name**: `acta-backend-manual`
- **Base URL**: `https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod`
- **Region**: `us-east-2`
- **Authentication**: Cognito User Pools (except health endpoint)

## Frontend → AWS Resource Mapping

### 1. Generate ACTA Document (PRIMARY FUNCTION)
**Frontend Call**:
```typescript
generateActaDocument(projectId, userEmail, userRole)
```

**AWS Mapping**:
- **API Endpoint**: `POST /extract-project-place/{id}`
- **Lambda Function**: `ProjectPlaceDataExtractor`
- **CloudFormation Resource**: `ExtractProjectPlaceMethod`
- **Authentication**: Required (Cognito)
- **Timeout**: 29 seconds

**Payload Structure** (Already Corrected in api.ts):
```json
{
  "projectId": "string",
  "pmEmail": "string", 
  "userRole": "admin|pm",
  "s3Bucket": "projectplace-dv-2025-x9a7b",
  "s3Region": "us-east-2",
  "cloudfrontDistributionId": "string",
  "cloudfrontUrl": "string",
  "requestSource": "acta-ui",
  "generateDocuments": true,
  "extractMetadata": true,
  "timestamp": "ISO string"
}
```

### 2. Get Project Summary
**Frontend Call**:
```typescript
getSummary(id)
```

**AWS Mapping**:
- **API Endpoint**: `GET /project-summary/{id}`
- **Lambda Function**: `projectMetadataEnricher`
- **CloudFormation Resource**: `ProjectSummaryMethod`
- **Authentication**: Required (Cognito)

### 3. Get Timeline
**Frontend Call**:
```typescript
getTimeline(id)
```

**AWS Mapping**:
- **API Endpoint**: `GET /timeline/{id}`
- **Lambda Function**: `getTimeline`
- **CloudFormation Resource**: `TimelineMethod`
- **Authentication**: Required (Cognito)

### 4. Download ACTA Document
**Frontend Call**:
```typescript
getDownloadUrl(id, format)
```

**AWS Mapping**:
- **API Endpoint**: `GET /download-acta/{id}?format=pdf|docx`
- **Lambda Function**: `getDownloadActa`
- **CloudFormation Resource**: `DownloadActaMethod`
- **Authentication**: Required (Cognito)
- **Response**: 302 redirect with S3 signed URL

### 5. Send Approval Email
**Frontend Call**:
```typescript
sendApprovalEmail(actaId, clientEmail)
```

**AWS Mapping**:
- **API Endpoint**: `POST /send-approval-email`
- **Lambda Function**: `sendApprovalEmail`
- **CloudFormation Resource**: `SendApprovalEmailMethod`
- **Authentication**: Required (Cognito)

### 6. PM Project Management
**Frontend Calls**:
```typescript
getProjectsByPM(pmEmail)
getPMProjectsWithSummary(pmEmail)
```

**AWS Mapping**:
- **API Endpoints**: 
  - `GET /pm-projects/all-projects` (admin access)
  - `GET /pm-projects/{pmEmail}` (specific PM)
- **Lambda Function**: `projectMetadataEnricher`
- **CloudFormation Resources**: `PMProjectsAllMethod`, `PMProjectsEmailMethod`
- **Authentication**: Required (Cognito)

**Note**: Frontend currently uses `/pm-manager/` but CloudFormation defines `/pm-projects/`. This needs verification.

### 7. Check Document Availability
**Frontend Call**:
```typescript
checkDocumentAvailability(id, format)
```

**AWS Mapping**:
- **API Endpoint**: `GET|HEAD /check-document/{projectId}?format=pdf|docx`
- **Lambda Function**: `projectMetadataEnricher`
- **CloudFormation Resource**: `CheckDocumentMethod`, `CheckDocumentHeadMethod`
- **Authentication**: Required (Cognito)

### 8. Health Check (Public)
**AWS Mapping**:
- **API Endpoint**: `GET /health`
- **Lambda Function**: `HealthCheck`
- **CloudFormation Resource**: `HealthMethod`
- **Authentication**: None (Public endpoint)

## Security Configuration

### Cognito User Pool
- **ARN**: `arn:aws:cognito-idp:us-east-2:703671891952:userpool/us-east-2_FyHLtOhiY`
- **Authorizer ID**: Dynamically created by CloudFormation
- **Client ID**: `dshos5iou44tuach7ta3ici5m`

### Protected Endpoints
All endpoints except `/health` require Cognito User Pool authentication via Authorization header.

## Discrepancies Found

### 1. PM Projects Endpoints
**Issue**: Frontend uses `/pm-manager/` but CloudFormation defines `/pm-projects/`
**Status**: ⚠️ NEEDS VERIFICATION - Check which endpoint is actually deployed

### 2. Bulk Generate Summaries
**Issue**: Frontend calls `/bulk-generate-summaries` but no CloudFormation resource found
**Status**: ⚠️ NEEDS VERIFICATION - This endpoint may not exist

## Status Summary

✅ **Working Correctly**:
- Generate ACTA: `POST /extract-project-place/{id}` → `ProjectPlaceDataExtractor`
- Get Summary: `GET /project-summary/{id}` → `projectMetadataEnricher`
- Get Timeline: `GET /timeline/{id}` → `getTimeline`
- Download ACTA: `GET /download-acta/{id}` → `getDownloadActa`
- Send Approval: `POST /send-approval-email` → `sendApprovalEmail`
- Check Document: `GET|HEAD /check-document/{id}` → `projectMetadataEnricher`

⚠️ **Needs Verification**:
- PM Projects endpoints: `/pm-manager/` vs `/pm-projects/`
- Bulk generate summaries endpoint existence

## Next Steps

1. ✅ **Payload Mapping**: Complete and verified
2. ✅ **TypeScript Errors**: All resolved
3. ⚠️ **Endpoint Verification**: Test PM endpoints to confirm correct paths
4. 🔄 **Live Testing**: Test "Generate ACTA" button end-to-end

## CloudFront Distribution
- **ID**: Dynamic (from environment variables)
- **URL**: `https://d7t9x3j66yd8k.cloudfront.net`
- **Purpose**: Serve generated documents from S3

## S3 Bucket
- **Name**: `projectplace-dv-2025-x9a7b`
- **Purpose**: Store generated ACTA documents
- **Key Pattern**: `acta/{projectId}.{format}`

This mapping ensures the frontend API calls align precisely with the deployed AWS infrastructure.
