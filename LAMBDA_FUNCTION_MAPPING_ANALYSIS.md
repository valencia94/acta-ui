# AWS Lambda Functions → CloudFormation Stack Mapping Analysis

## 🔍 Current AWS Lambda Functions (July 1, 2025)
```
✅ handleApprovalCallback
✅ sendApprovalEmail               
✅ ProjectPlaceDataExtractor       
✅ projectMetadataEnricher         
✅ autoApprovePending              
✅ getTimeline                     
✅ getDownloadActa                 
✅ HealthCheck                     
✅ projectMetadataEnricherById     
✅ getProjectSummary               
✅ ProjectPlaceDataExtractor-stag  
✅ DocumentStatus                  
```

## 🎯 CloudFormation Template Expected Functions
From the failed stack deployment:
```
❌ GetTimeline           → EXISTS as: getTimeline
❌ GetDownloadActa       → EXISTS as: getDownloadActa  
❌ SendApprovalEmail     → EXISTS as: sendApprovalEmail
❌ ProjectsManager       → NO EQUIVALENT (MISSING)
❌ DocumentStatus        → ✅ EXISTS as: DocumentStatus
```

## 📋 Button → Function Mapping (Reverse Engineering)

### UI Buttons in Dashboard:
1. **Generate ACTA Button** → `handleGenerateActa()`
2. **Download Word Button** → `handleWordDownload()`
3. **Download PDF Button** → `handlePdfDownload()`
4. **Preview PDF Button** → `handlePreviewPdf()`
5. **Send Approval Button** → `handleSendApproval()`

### API Calls from Button Handlers:
1. **Generate ACTA**: `POST /extract-project-place/{id}` → `ProjectPlaceDataExtractor`
2. **Download Word**: `GET /download-acta/{id}?format=docx` → `getDownloadActa`
3. **Download PDF**: `GET /download-acta/{id}?format=pdf` → `getDownloadActa`
4. **Preview PDF**: `GET /download-acta/{id}?format=pdf` → `getDownloadActa`
5. **Send Approval**: `POST /send-approval-email` → `sendApprovalEmail`

### Additional API Endpoints:
- **Timeline**: `GET /timeline/{id}` → `getTimeline`
- **Project Summary**: `GET /project-summary/{id}` → `projectMetadataEnricher`
- **Document Status**: `GET /check-document/{id}` → `DocumentStatus`
- **Health Check**: `GET /health` → `HealthCheck`
- **Projects List**: `GET /projects` → **NEEDS: ProjectsManager (MISSING)**
- **PM Projects**: `GET /pm-projects/*` → **NEEDS: ProjectsManager (MISSING)**

## 🔧 CORRECTED CloudFormation Template Parameters

### Existing Functions (Correct Names):
```yaml
  GetTimelineArn:
    Default: arn:aws:lambda:us-east-2:703671891952:function:getTimeline
    
  GetDownloadActaArn:
    Default: arn:aws:lambda:us-east-2:703671891952:function:getDownloadActa
    
  SendApprovalEmailArn:
    Default: arn:aws:lambda:us-east-2:703671891952:function:sendApprovalEmail
    
  ProjectPlaceDataExtractorArn:
    Default: arn:aws:lambda:us-east-2:703671891952:function:ProjectPlaceDataExtractor
    
  DocumentStatusArn:
    Default: arn:aws:lambda:us-east-2:703671891952:function:DocumentStatus
    
  HealthCheckArn:
    Default: arn:aws:lambda:us-east-2:703671891952:function:HealthCheck
    
  GetProjectSummaryArn:
    Default: arn:aws:lambda:us-east-2:703671891952:function:getProjectSummary
```

### Missing Function (Needs Creation):
```yaml
  ProjectsManagerArn:
    Default: arn:aws:lambda:us-east-2:703671891952:function:projectMetadataEnricher
    # TEMPORARY: Use projectMetadataEnricher as it can handle multiple endpoints
    # BETTER: Create dedicated ProjectsManager function
```

## 🚨 Key Findings:

1. **Case Sensitivity Issues**: CloudFormation expected PascalCase, AWS has camelCase
2. **One Missing Function**: `ProjectsManager` for `/projects` and `/pm-projects/*` endpoints
3. **Workaround Available**: `projectMetadataEnricher` can handle projects endpoints temporarily
4. **All Button Functions Exist**: Core button functionality is covered by existing functions

## ✅ Solution Strategy:

1. **Fix CloudFormation Template**: Use correct existing function names
2. **Map Projects Endpoints**: Use `projectMetadataEnricher` for now (it's designed as a multipurpose function)
3. **Deploy Stack**: Should work with corrected function ARNs
4. **Optional**: Create dedicated `ProjectsManager` later for better separation of concerns
