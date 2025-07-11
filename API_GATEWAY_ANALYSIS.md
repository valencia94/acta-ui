# 🔍 ACTA API Gateway Analysis & Hardening Report

## 📊 **CURRENT API STRUCTURE ANALYSIS**

### **Identified Issues:**

#### 🚨 **CRITICAL SECURITY ISSUES:**
1. **Inconsistent Authentication Schemes**
   - `CognitoUserPoolAuthorizer` vs `ActaUiCognitoAuthorizer` (two different authorizers for same pool)
   - `/health` endpoint has NO authentication (security risk)
   - Mixed auth patterns across endpoints

2. **CORS Configuration Gaps**
   - Only gateway-level CORS for errors, missing method-level headers
   - Inconsistent OPTIONS responses
   - Missing CORS on many endpoints

3. **Improper HTTP Methods**
   - `HEAD` methods used where `GET` should be used
   - `x-amazon-apigateway-any-method` mixed with specific methods
   - `/send-approval-email` has both `HEAD` and `POST` (confusion)

#### ⚠️ **OPERATIONAL ISSUES:**
1. **Inconsistent Timeout Configurations**
   - Some endpoints: 29000ms, others: 60ms, many missing
   - `/handleApprovalCallback` has suspiciously low 60ms timeout

2. **Missing Error Handling**
   - Incomplete response definitions
   - Missing status codes for many endpoints
   - No standardized error responses

3. **Integration Type Inconsistencies**
   - Mix of `aws_proxy` and `aws` types
   - `/send-approval-email` HEAD method uses `aws` instead of `aws_proxy`

#### 🔧 **ENDPOINT-SPECIFIC ISSUES:**
1. **Redundant Routes:**
   - `/download-acta` vs `/download-acta/{id}` - should consolidate
   - `/check-document` vs `/check-document/{projectId}` - inconsistent naming

2. **Unused/Incomplete Endpoints:**
   - `/extract-project-place` - only OPTIONS, no implementation
   - `/project-summary` - only OPTIONS, no implementation  
   - `/timeline` - only OPTIONS, no implementation

## 🎯 **RECOMMENDED FIXES:**

### **1. Standardize Authentication**
- Use single Cognito authorizer: `CognitoUserPoolAuthorizer`
- Secure `/health` endpoint or make it internal-only
- Remove redundant `ActaUiCognitoAuthorizer`

### **2. Fix HTTP Methods**
- Replace inappropriate `HEAD` methods with `GET`
- Remove `x-amazon-apigateway-any-method` where specific methods exist
- Standardize method usage

### **3. Standardize CORS**
- Add consistent CORS headers to all method responses
- Ensure OPTIONS methods return proper CORS headers
- Align with CloudFront origin: `https://d7t9x3j66yd8k.cloudfront.net`

### **4. Fix Timeouts & Integrations**
- Set consistent 29000ms timeout for all data operations
- Set 10000ms for simple operations
- Use `aws_proxy` consistently
- Fix the 60ms timeout on `/handleApprovalCallback`

### **5. Consolidate Routes**
- Merge `/download-acta` patterns
- Standardize parameter naming (`id` vs `projectId`)
- Remove or implement incomplete endpoints
