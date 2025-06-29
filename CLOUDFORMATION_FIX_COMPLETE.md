# 🚨 CLOUDFORMATION DEPLOYMENT FIX

## ❌ **PROBLEM IDENTIFIED:**

The CloudFormation deployment failed with `UPDATE_ROLLBACK_IN_PROGRESS` because the template was trying to create API Gateway resources that already exist from our manual setup:

```
Failed resources: CheckDocHeadAliasPermission, ProjectsAliasPermission, 
PMManagerResource, ProjectsManagerPermission, PMManagerAllProjectsPermission, 
PMManagerByEmailPermission, DocumentValidatorGetPermission, 
PMProjectsAllAliasPermission, ProjectMetadataEnricherPermission, 
CheckDocRootResource, ProjectsResource, PMProjectsByEmailAliasPermission, 
DocumentValidatorHeadPermission, CheckDocGetAliasPermission
```

## ✅ **SOLUTION IMPLEMENTED:**

### **1. New Permissions-Only Template**
Created `infra/template-permissions-only.yaml` that:
- ✅ **Only manages Lambda permissions** (no API Gateway resource creation)
- ✅ **Works with existing manually created API Gateway resources**
- ✅ **Includes all required Lambda permissions for all endpoints**
- ✅ **Creates API deployment to make changes active**

### **2. Updated GitHub Actions Workflow**
Modified `build_deploy.yml` to use the new template:
- ✅ **Uses `template-permissions-only.yaml`** instead of `template-conflict-free.yaml`
- ✅ **Same deployment process** but without resource conflicts
- ✅ **All other steps remain unchanged**

### **3. CloudFormation Recovery Script**
Created `fix-cloudformation-stack.sh` to:
- ✅ **Check current stack status**
- ✅ **Wait for rollback completion if needed**
- ✅ **Provide guidance for next steps**

## 🔧 **IMMEDIATE ACTIONS REQUIRED:**

### **Option 1: Wait for Automatic Recovery (Recommended)**
The GitHub Actions workflow has built-in logic to handle stuck stacks:
```yaml
# Wait / cancel busy stack
- name: ⏳ Ensure backend stack free
  env:
    STACK_NAME: acta-api-wiring-stack-manual
    REGION: ${{ secrets.AWS_REGION }}
  run: |
    # Automatically waits for rollbacks to complete
```

1. **Monitor GitHub Actions**: The workflow will automatically wait for the rollback to complete
2. **Then deploy**: Once rollback completes, it will deploy with the new permissions-only template

### **Option 2: Manual Recovery (If Needed)**
If you have AWS CLI access:

```bash
# Run the recovery script
./fix-cloudformation-stack.sh

# Then trigger deployment manually
gh workflow run build_deploy.yml
```

## 📋 **WHAT THE NEW TEMPLATE DOES:**

### **✅ Lambda Permissions (Managed by CloudFormation):**
- `GET /projects` → Lambda permission
- `GET /pm-manager/all-projects` → Lambda permission  
- `GET /pm-manager/{pmEmail}` → Lambda permission
- `GET /check-document/{projectId}` → Lambda permission
- `GET /project/{projectId}/generate-acta` → Lambda permission
- `POST /project/{projectId}/send-approval` → Lambda permission
- All OPTIONS methods for CORS

### **✅ API Gateway Resources (Already Exist Manually):**
- `/pm-manager` resource ✅ (created manually)
- `/pm-manager/all-projects` resource ✅ (created manually)
- `/pm-manager/{pmEmail}` resource ✅ (created manually)
- All methods and integrations ✅ (created manually)

## 🎯 **EXPECTED OUTCOME:**

1. **✅ CloudFormation Deployment Success**: Only manages Lambda permissions
2. **✅ No Resource Conflicts**: Doesn't try to create existing API Gateway resources
3. **✅ All Endpoints Working**: Same functionality as before
4. **✅ Automated Deployments**: GitHub Actions workflow continues to work

## 🔍 **MONITORING:**

### **GitHub Actions Progress:**
1. Go to: https://github.com/valencia94/acta-ui/actions
2. Watch for "Build and Deploy" workflow
3. Should show: ✅ Build → ✅ Deploy Backend → ✅ Deploy Frontend

### **CloudFormation Status:**
- Stack: `acta-api-wiring-stack-manual`
- Expected final status: `UPDATE_COMPLETE`
- Resources: Only Lambda permissions (no API Gateway resources)

## 💡 **WHY THIS APPROACH:**

1. **✅ Preserves Manual Setup**: Keeps all manually created and tested API Gateway resources
2. **✅ Eliminates Conflicts**: CloudFormation only manages what it should
3. **✅ Maintains Functionality**: All endpoints continue to work exactly as before
4. **✅ Future-Proof**: Can be extended safely without conflicts

---

## 🚀 **NEXT STEPS:**

1. **Let the workflow complete** - It will handle the stuck stack automatically
2. **Verify endpoints** - All should continue working as before  
3. **Monitor logs** - Check for any unexpected issues
4. **Document success** - Update deployment documentation

**The system will be fully operational once the new deployment completes! 🎉**
