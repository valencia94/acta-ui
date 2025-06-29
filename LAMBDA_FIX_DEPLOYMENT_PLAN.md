# 🔧 Lambda Function Fixes & Deployment Plan

## 🔍 **Root Cause Analysis:**

Based on testing and documentation review:

### **502 Lambda Errors:**

- `/project-summary/{id}` → routing to wrong Lambda (should be `projectMetadataEnricher`)
- `/timeline/{id}` → `getTimeline` Lambda has internal errors
- `/download-acta/{id}` → `getDownloadActa` Lambda has internal errors

### **504 Timeout:**

- `/extract-project-place/{id}` → needs memory/timeout increase

### **400 Errors:**

- `/send-approval-email` → needs proper payload format

## ✅ **Deployment Plan:**

### **Phase 1: Fix API Gateway Routing**

Update CloudFormation to route project-summary to correct Lambda

### **Phase 2: Deploy Enhanced Lambda Functions**

Deploy the enhanced Lambda functions we've created in `/lambda-functions/`

### **Phase 3: Update Infrastructure**

Deploy CloudFormation stack with corrected mappings

### **Phase 4: Test & Verify**

Run comprehensive tests to verify all button functionality
