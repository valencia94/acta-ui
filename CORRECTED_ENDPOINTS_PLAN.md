# CORRECTED Backend API Endpoints Analysis & Fix Plan

## 🔍 **REAL vs EXPECTED Endpoints**

### ✅ **What ACTUALLY EXISTS (from deploy-wiring.sh):**
```bash
# These Lambda functions are deployed:
GetTimeline                   -> /timeline/{id}           ✅ EXISTS (502 Lambda error)
GetDownloadActa              -> /download-acta/{id}       ✅ EXISTS (404 route issue)  
GetProjectSummary            -> /project-summary/{id}     ✅ EXISTS (502 Lambda error)
SendApprovalEmail            -> /send-approval-email      ✅ EXISTS (not tested)
ProjectPlaceDataExtractor    -> /extract-project-place/{id} ✅ EXISTS (timeout)
HealthCheck                  -> /health                   ✅ EXISTS & WORKING
```

### ❌ **What FRONTEND EXPECTS but DOESN'T EXIST:**
```typescript
// From src/lib/api.ts - these are NOT deployed:
GET /projects                     // ❌ NO LAMBDA EXISTS
GET /pm-projects/all-projects     // ❌ NO LAMBDA EXISTS
GET /pm-projects/{pmEmail}        // ❌ NO LAMBDA EXISTS
HEAD /check-document/{id}         // ❌ NO LAMBDA EXISTS
GET /check-document/{id}          // ❌ NO LAMBDA EXISTS
GET /s3-download-url/{id}         // ❌ NO LAMBDA EXISTS
```

---

## 🔧 **ROOT CAUSE ANALYSIS**

### **Problem 1: Lambda Function Errors (502)**
- `GetTimeline` and `GetProjectSummary` Lambda functions exist but are failing
- **Fix:** Debug CloudWatch logs for these specific functions

### **Problem 2: Download Route Mismatch (404)**  
- `GetDownloadActa` function exists but route returns 404
- **Fix:** Check API Gateway deployment or route configuration

### **Problem 3: Missing Project Management**
- Frontend expects project listing but **NO Lambda function exists for this**
- **Fix:** Create new Lambda function OR modify frontend

### **Problem 4: Missing Document Status**
- Frontend expects S3 document checking but **NO Lambda function exists**
- **Fix:** Create new Lambda function OR modify frontend

---

## 🎯 **CORRECTION PLAN - 3 Options**

### **Option A: Fix Existing Only (QUICK - 2 hours)**
Focus on making existing functions work:

1. **Fix Lambda 502 Errors:**
   ```bash
   # Debug these specific functions in CloudWatch:
   - GetTimeline (Request ID: c547c108-3e7b-440a-b3e9-51d380a14731)
   - GetProjectSummary (Request ID: 4c0bbe54-e4ad-41bf-a277-bdba3e4ab79a)
   ```

2. **Fix Download 404 Error:**
   ```bash
   # Check API Gateway deployment status
   # Verify /download-acta/{id} route is properly deployed
   ```

3. **Modify Frontend to Remove Missing Features:**
   ```typescript
   // Remove or mock these calls in src/lib/api.ts:
   - getProjectsByPM()          // Mock with hardcoded data
   - checkDocumentInS3()        // Remove S3 status checking
   - getPMProjectsWithSummary() // Simplify dashboard
   ```

### **Option B: Create Missing Functions (COMPLETE - 1-2 days)**
Create all missing Lambda functions:

1. **New Lambda Functions to Create:**
   ```python
   # projects-manager-lambda.py
   import json
   def lambda_handler(event, context):
       # Mock project data for now
       return {
           'statusCode': 200,
           'body': json.dumps({
               'projects': [
                   {'project_id': 'test', 'project_name': 'Test Project', 'pm': 'test@example.com'}
               ]
           })
       }
   
   # document-status-lambda.py  
   import json
   import boto3
   def lambda_handler(event, context):
       # Check S3 document status
       project_id = event['pathParameters']['projectId']
       format = event['queryStringParameters'].get('format', 'pdf')
       
       # Mock S3 check for now
       return {
           'statusCode': 200,
           'body': json.dumps({
               'exists': True,
               'status': 'ready',
               'last_modified': '2025-06-27T22:00:00Z'
           })
       }
   ```

2. **Updated CloudFormation Template:**
   ```yaml
   # Add to deploy-wiring.sh parameters:
   ProjectsManagerArn=arn:aws:lambda:us-east-2:703671891952:function:ProjectsManager
   DocumentStatusArn=arn:aws:lambda:us-east-2:703671891952:function:DocumentStatus
   ```

### **Option C: Hybrid Fix (RECOMMENDED - 4-6 hours)**  
Fix existing + add critical missing functions:

1. **Phase 1:** Fix existing Lambda 502 errors
2. **Phase 2:** Create minimal projects list function
3. **Phase 3:** Add document status checking
4. **Phase 4:** Test end-to-end workflow

---

## 🚀 **STEP-BY-STEP CORRECTION**

### **IMMEDIATE (Fix 502 Errors):**

1. **Check CloudWatch Logs:**
   ```bash
   # In AWS Console CloudWatch:
   # Search for GetTimeline function logs
   # Search for GetProjectSummary function logs
   # Look for these Request IDs:
   # - c547c108-3e7b-440a-b3e9-51d380a14731 (Timeline)
   # - 4c0bbe54-e4ad-41bf-a277-bdba3e4ab79a (ProjectSummary)
   ```

2. **Common Lambda Fixes:**
   ```python
   # Likely issues in Lambda functions:
   # 1. Incorrect environment variables
   # 2. Missing IAM permissions  
   # 3. Timeout too short (default 3 seconds)
   # 4. Memory allocation too low
   # 5. Missing dependencies or imports
   ```

### **SHORT-TERM (Add Critical Missing Endpoints):**

1. **Create Projects Manager Lambda:**
   ```python
   # Save as projects-manager.py and deploy
   import json
   import os
   
   def lambda_handler(event, context):
       try:
           path = event.get('path', '')
           method = event.get('httpMethod', 'GET')
           
           # Handle different project endpoints
           if '/pm-projects/all-projects' in path:
               return get_all_projects()
           elif '/pm-projects/' in path:
               pm_email = event['pathParameters']['pmEmail']
               return get_projects_by_pm(pm_email)
           elif '/projects' in path:
               return get_projects_list()
               
           return {
               'statusCode': 404,
               'body': json.dumps({'error': 'Endpoint not found'})
           }
           
       except Exception as e:
           return {
               'statusCode': 500,
               'body': json.dumps({'error': str(e)})
           }
   
   def get_all_projects():
       # TODO: Connect to your actual data source
       mock_projects = [
           {'project_id': 'PRJ001', 'project_name': 'Sample Project 1', 'pm': 'pm1@example.com'},
           {'project_id': 'PRJ002', 'project_name': 'Sample Project 2', 'pm': 'pm2@example.com'},
       ]
       return {
           'statusCode': 200,
           'headers': {
               'Content-Type': 'application/json',
               'Access-Control-Allow-Origin': '*'
           },
           'body': json.dumps({
               'total_projects': len(mock_projects),
               'projects': mock_projects
           })
       }
   
   def get_projects_by_pm(pm_email):
       # TODO: Filter by actual PM email
       mock_projects = [
           {'project_id': 'PRJ001', 'project_name': 'PM Specific Project', 'pm': pm_email}
       ]
       return {
           'statusCode': 200,
           'headers': {
               'Content-Type': 'application/json', 
               'Access-Control-Allow-Origin': '*'
           },
           'body': json.dumps({
               'total_projects': len(mock_projects),
               'projects': mock_projects
           })
       }
   
   def get_projects_list():
       return get_all_projects()
   ```

2. **Create Document Status Lambda:**
   ```python
   # Save as document-status.py and deploy
   import json
   import boto3
   from botocore.exceptions import ClientError
   
   def lambda_handler(event, context):
       try:
           project_id = event['pathParameters']['projectId']
           format = event.get('queryStringParameters', {}).get('format', 'pdf')
           method = event.get('httpMethod', 'GET')
           
           # Check S3 for document
           s3_client = boto3.client('s3')
           bucket_name = 'projectplace-dv-2025-x9a7b'  # Your S3 bucket
           object_key = f"acta-documents/{project_id}.{format}"
           
           try:
               response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
               document_exists = True
               last_modified = response['LastModified'].isoformat()
               size = response['ContentLength']
           except ClientError as e:
               if e.response['Error']['Code'] == '404':
                   document_exists = False
                   last_modified = None
                   size = 0
               else:
                   raise e
           
           if method == 'HEAD':
               return {
                   'statusCode': 200 if document_exists else 404,
                   'headers': {
                       'Content-Type': 'application/json',
                       'Access-Control-Allow-Origin': '*'
                   }
               }
           else:
               return {
                   'statusCode': 200,
                   'headers': {
                       'Content-Type': 'application/json',
                       'Access-Control-Allow-Origin': '*'
                   },
                   'body': json.dumps({
                       'exists': document_exists,
                       'status': 'ready' if document_exists else 'not_found',
                       'last_modified': last_modified,
                       'size': size,
                       'format': format,
                       'project_id': project_id
                   })
               }
               
       except Exception as e:
           return {
               'statusCode': 500,
               'headers': {
                   'Content-Type': 'application/json',
                   'Access-Control-Allow-Origin': '*'
               },
               'body': json.dumps({'error': str(e)})
           }
   ```

3. **Updated CloudFormation Template:**
