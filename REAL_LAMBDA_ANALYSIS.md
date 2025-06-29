# REAL Lambda Functions Analysis - Updated with Actual Endpoints

## 🔍 **EXISTING Lambda Functions (from your infrastructure):**

### ✅ **What ACTUALLY EXISTS:**

```yaml
# Real deployed Lambda functions:
1. ProjectPlaceDataExtractor    → POST /extract-project-place/{id}     ✅ EXISTS (timeout issue)
2. SendApprovalEmail           → POST /send-approval-email             ✅ EXISTS (not tested)
3. GetTimeline                 → GET /timeline/{id}                    ✅ EXISTS (502 error)
4. HandleApprovalCallback      → POST /handleApprovalCallback          ✅ EXISTS (not in our analysis!)
5. GetDownloadActa            → GET /download-acta/{id}                ✅ EXISTS (404 error)
6. HealthCheck                → GET /health                            ✅ EXISTS & WORKING
```

### ❌ **What's MISSING for Frontend:**

```typescript
// Frontend expects these but NO Lambda functions exist:
GET / projects; // ❌ NO LAMBDA FUNCTION
GET / pm - projects / all - projects; // ❌ NO LAMBDA FUNCTION
GET / pm - projects / { pmEmail }; // ❌ NO LAMBDA FUNCTION
GET / project - summary / { id }; // ❌ NO LAMBDA FUNCTION (we thought this existed!)
HEAD / check - document / { projectId }; // ❌ NO LAMBDA FUNCTION
GET / check - document / { projectId }; // ❌ NO LAMBDA FUNCTION
```

## 🚨 **CORRECTED ANALYSIS:**

### **Problem 1: Missing GetProjectSummary Lambda**

- Frontend calls: `getSummary(id)` → `/project-summary/{id}`
- **Reality: NO Lambda function exists for project summary!**
- This explains the 502 error - there's no function to call

### **Problem 2: Missing Projects Management**

- Frontend calls: `getProjectsByPM()`, `getPMProjectsWithSummary()`
- **Reality: NO Lambda functions exist for projects management!**

### **Problem 3: Missing Document Status**

- Frontend calls: `checkDocumentInS3()`
- **Reality: NO Lambda function exists for document status!**

### **Problem 4: We Missed HandleApprovalCallback**

- **Exists but not in our analysis:** `/handleApprovalCallback`
- This might be used by email approval workflows

## 🔧 **CORRECTED Lambda Functions to CREATE:**

```python
# 1. GetProjectSummary (MISSING - explains 502 error)
def lambda_handler(event, context):
    project_id = event['pathParameters']['id']
    # TODO: Implement actual project summary logic
    return {
        'statusCode': 200,
        'body': json.dumps({
            'project_id': project_id,
            'project_name': f'Project {project_id}',
            'pm': 'test@example.com'
        })
    }

# 2. ProjectsManager (MISSING - for all projects endpoints)
def lambda_handler(event, context):
    # Handle /projects, /pm-projects/* endpoints
    # (Already created this one)

# 3. DocumentStatus (MISSING - for document checking)
def lambda_handler(event, context):
    # Handle /check-document/{id} endpoints
    # (Already created this one)
```

## 🎯 **TESTING PLAN - Updated:**

### **Test EXISTING Functions:**

```bash
# These should work once Lambda issues are fixed:
curl "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health"                      # ✅ WORKS
curl -X POST "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/extract-project-place/test"  # ⏰ TIMEOUT
curl "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/timeline/test"              # ❌ 502 (Lambda issue)
curl "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/download-acta/test"         # ❌ 404 (route issue)
curl -X POST "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/send-approval-email" # ❓ UNTESTED
curl -X POST "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/handleApprovalCallback" # ❓ UNTESTED

# These will return 404 - NO Lambda functions exist:
curl "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/project-summary/test"       # ❌ NO LAMBDA
curl "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/projects"                   # ❌ NO LAMBDA
curl "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/pm-projects/all-projects"   # ❌ NO LAMBDA
curl "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/check-document/test"        # ❌ NO LAMBDA
```

## 🔄 **UPDATED CloudFormation Template:**

```yaml
# deploy-wiring.sh needs these Lambda ARNs that DON'T EXIST:
GetProjectSummaryArn=arn:aws:lambda:us-east-2:703671891952:function:GetProjectSummary     # ❌ DOESN'T EXIST

# But these DO exist and work:
GetTimelineArn=arn:aws:lambda:us-east-2:703671891952:function:GetTimeline                 # ✅ EXISTS
GetDownloadActaArn=arn:aws:lambda:us-east-2:703671891952:function:GetDownloadActa         # ✅ EXISTS
SendApprovalEmailArn=arn:aws:lambda:us-east-2:703671891952:function:SendApprovalEmail     # ✅ EXISTS
ProjectPlaceDataExtractorArn=arn:aws:lambda:us-east-2:703671891952:function:ProjectPlaceDataExtractor # ✅ EXISTS
HealthCheckArn=arn:aws:lambda:us-east-2:703671891952:function:HealthCheck                 # ✅ EXISTS

# Missing from deploy script:
HandleApprovalCallbackArn=arn:aws:lambda:us-east-2:703671891952:function:HandleApprovalCallback # ✅ EXISTS but not used
```

## 🎯 **CORRECTED ACTION PLAN:**

### **Phase 1: Create Missing Critical Lambda Functions**

```bash
# Must create these Lambda functions:
1. GetProjectSummary           # For /project-summary/{id}
2. ProjectsManager            # For /projects, /pm-projects/*
3. DocumentStatus             # For /check-document/{id}
```

### **Phase 2: Fix Existing Lambda Issues**

```bash
# Debug these existing functions:
1. GetTimeline                # 502 error - check CloudWatch logs
2. ProjectPlaceDataExtractor  # Timeout - increase memory/timeout
3. GetDownloadActa           # 404 error - check API Gateway routes
```

### **Phase 3: Update CloudFormation**

```bash
# Add missing routes and Lambda integrations
# Include HandleApprovalCallback in wiring
```

This is a much clearer picture now! The main issue is that several Lambda functions that the frontend expects simply **don't exist yet**.
