# 🏥 ACTA-UI Surgical Intervention Guide

## Overview

This surgical intervention approach fixes your production ACTA-UI deployment with minimal risk by separating changes by AWS control plane. Each script targets a specific component to avoid scope bleed and enable precise rollbacks.

## 🎯 Problem Analysis

Your current production issues:
- **CORS Errors**: Frontend can't communicate with API Gateway
- **Auth Header Loss**: CloudFront not forwarding Authorization headers  
- **Direct API Access**: Potentially insecure without CloudFront restriction

## 🔧 Solution Architecture

### Control Plane Separation
| Script | Control Plane | What It Fixes | Risk Level |
|--------|---------------|---------------|------------|
| `cloudfront-header-fix.sh` | CloudFront | Authorization header forwarding | Low |
| `apigateway-cors-fix.sh` | API Gateway | CORS OPTIONS methods | Low |
| `apigateway-security-policy.sh` | IAM/Resource Policy | CloudFront-only access | Medium |

## 🚀 Execution Steps

### Option 1: Full Automated Fix
```bash
# Run the master script that orchestrates everything
./scripts/surgical-intervention.sh
```

### Option 2: Step-by-Step Manual Fix
```bash
# Step 1: Fix API Gateway CORS (immediate user impact)
./scripts/apigateway-cors-fix.sh

# Step 2: Fix CloudFront header forwarding (auth flow)
./scripts/cloudfront-header-fix.sh

# Step 3: Optional security policy (recommended but optional)
./scripts/apigateway-security-policy.sh
```

### Option 3: Individual Component Testing
```bash
# Test just CORS without other changes
./scripts/apigateway-cors-fix.sh

# Verify results
./scripts/verify-surgical-fix.sh
```

## 📋 Current Infrastructure

- **CloudFront Distribution**: `EPQU7PVDLQXUA`
- **API Gateway**: `q2b9avfwv5` (us-east-2)
- **Cognito User Pool**: `us-east-2_FyHLtOhiY`
- **Frontend Origin**: `https://d7t9x3j66yd8k.cloudfront.net`

## 🧪 Verification

After running the fixes:

```bash
# Run comprehensive verification
./scripts/verify-surgical-fix.sh

# Manual CORS test
curl -H "Origin: https://d7t9x3j66yd8k.cloudfront.net" \
     -X OPTIONS \
     "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod/health"

# Should return HTTP 200 with CORS headers
```

## ⏰ Timeline Expectations

| Component | Propagation Time | Test Method |
|-----------|------------------|-------------|
| API Gateway CORS | Immediate | `curl` OPTIONS test |
| CloudFront Headers | 5-15 minutes | Auth request test |
| Resource Policy | Immediate | Direct access test |

## 🔄 Rollback Procedures

### Undo CloudFront Changes
```bash
# Remove custom origin request policy
aws cloudfront get-distribution --id EPQU7PVDLQXUA
# Note the current policy ID, then update to default
```

### Undo API Gateway CORS
```bash
# Remove OPTIONS methods (if needed)
aws apigateway delete-method --rest-api-id q2b9avfwv5 --resource-id <RESOURCE_ID> --http-method OPTIONS
```

### Undo Resource Policy
```bash
# Remove resource policy entirely
aws apigateway update-rest-api --rest-api-id q2b9avfwv5 --patch-ops op=remove,path=/policy
```

## 📊 Success Criteria

### ✅ API Gateway CORS Fix Success
- OPTIONS requests return HTTP 200
- CORS headers present in response
- Frontend can make authenticated requests

### ✅ CloudFront Header Fix Success  
- Authorization headers forwarded to API Gateway
- Cognito auth tokens reach Lambda functions
- No auth failures in CloudWatch logs

### ✅ Security Policy Success
- Direct API access returns HTTP 403 (if policy applied)
- CloudFront access still works
- Health checks still function

## 🔍 Troubleshooting

### CORS Still Failing
```bash
# Check if deployment was successful
aws apigateway get-deployments --rest-api-id q2b9avfwv5

# Verify OPTIONS method exists
aws apigateway get-method --rest-api-id q2b9avfwv5 --resource-id <ID> --http-method OPTIONS
```

### CloudFront Not Forwarding Headers
```bash
# Check current origin request policy
aws cloudfront get-distribution --id EPQU7PVDLQXUA --query 'Distribution.DistributionConfig.DefaultCacheBehavior.OriginRequestPolicyId'

# Wait for propagation (can take up to 15 minutes)
```

### Auth Still Failing
```bash
# Check Cognito configuration
aws cognito-idp describe-user-pool --user-pool-id us-east-2_FyHLtOhiY

# Check Lambda logs for auth errors
aws logs filter-log-events --log-group-name /aws/lambda/projectMetadataEnricher
```

## 🛡️ Safety Features

- **Backup Logging**: All changes logged to `logs/surgical_fix_TIMESTAMP.log`
- **Incremental Approach**: Each fix can be applied independently
- **Verification Script**: `verify-surgical-fix.sh` confirms all changes
- **Rollback Documentation**: Clear undo procedures for each change

## 📞 Emergency Contacts

If something goes wrong:
1. Check the log file in `logs/surgical_fix_TIMESTAMP.log`
2. Run `./scripts/verify-surgical-fix.sh` to diagnose
3. Use rollback procedures above
4. Worst case: AWS Console manual fixes documented in `archive/docs/`

---

**Ready to proceed?** Run `./scripts/surgical-intervention.sh` and follow the prompts.
