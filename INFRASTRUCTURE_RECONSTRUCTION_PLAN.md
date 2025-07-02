# 🏗️ ACTA-UI Infrastructure Reconstruction Plan

## 🚨 CURRENT STATE: INFRASTRUCTURE DISASTER

The repository cleanup revealed that while we have working AWS resources (as proven by successful test reports), the **infrastructure as code** is completely disorganized and missing critical deployment configurations.

## 📊 WORKING RESOURCES (From Test Reports)

### ✅ AWS Resources Currently Live & Working:
- **Cognito User Pool**: `us-east-2_FyHLtOhiY`
- **App Client**: `dshos5iou44tuach7ta3ici5m`
- **CloudFront Distribution**: `d7t9x3j66yd8k.cloudfront.net`
- **API Gateway**: Multiple endpoints responding correctly
- **Lambda Functions**: All core functions deployed and working
- **S3 Buckets**: Document storage working (`projectplace-dv-2025-x9a7b`)

### ❌ Missing Infrastructure Code:
- **Amplify Configuration**: No `amplify.yml` or proper Amplify setup
- **CloudFormation Templates**: Multiple versions in `/infra` - unclear which is production
- **Deployment Scripts**: No automated deployment pipeline
- **Environment Management**: Missing proper env file structure
- **CDK/Terraform**: No infrastructure as code framework

---

## 🎯 RECONSTRUCTION PRIORITY PLAN

### **PHASE 1: IMMEDIATE CRITICAL FIXES**

#### 1.1 Create Proper Amplify Configuration
```yaml
# amplify.yml - MISSING
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build: 
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

#### 1.2 Organize CloudFormation Templates  
Current `/infra` folder has 12+ templates - need to:
- ✅ Identify which template matches the working deployment
- ✅ Create a single master template
- ✅ Remove duplicate/obsolete templates

#### 1.3 Create Deployment Pipeline
- ✅ AWS CodePipeline configuration
- ✅ GitHub Actions workflow  
- ✅ Automated testing integration

### **PHASE 2: INFRASTRUCTURE STANDARDIZATION**

#### 2.1 Choose Infrastructure Framework
**Options:**
- **AWS CDK** (Recommended - TypeScript native)
- **Terraform** (Multi-cloud flexibility)
- **CloudFormation** (AWS native, what we currently have)
- **Amplify CLI** (Easiest for frontend-focused teams)

#### 2.2 Environment Management
```bash
# Missing proper environment structure
├── .env.development
├── .env.staging  
├── .env.production
├── amplify/
│   ├── backend/
│   │   ├── auth/
│   │   ├── api/
│   │   └── function/
│   └── team-provider-info.json
```

#### 2.3 Secret Management
- ✅ AWS Secrets Manager integration
- ✅ Environment-specific configurations
- ✅ Secure API key handling

### **PHASE 3: MONITORING & MAINTENANCE**

#### 3.1 Observability Stack
- ✅ CloudWatch dashboards
- ✅ Application insights
- ✅ Error tracking (LogRocket/Sentry)

#### 3.2 Backup & Disaster Recovery
- ✅ Infrastructure state backup
- ✅ Database backup strategies
- ✅ Recovery procedures documentation

---

## 🔥 IMMEDIATE ACTION REQUIRED

### **STEP 1: Audit Working vs. Code**
We need to **reverse engineer** the working AWS resources to understand:
1. Which CloudFormation template actually deployed the working system?
2. What Amplify configuration was used?
3. Which Lambda functions are actually deployed?
4. What IAM roles and policies are in place?

### **STEP 2: Infrastructure Audit Commands**
```bash
# Check current AWS resources
aws cognito-idp describe-user-pool --user-pool-id us-east-2_FyHLtOhiY
aws apigateway get-rest-apis
aws lambda list-functions --region us-east-2
aws cloudfront list-distributions
aws s3 ls
```

### **STEP 3: Create Master Deployment Template**
Based on working resources, create a single source of truth CloudFormation template.

---

## 💡 RECOMMENDED NEXT STEPS

1. **🚨 URGENT**: Audit current AWS resources vs. code
2. **📋 IMMEDIATE**: Create proper `amplify.yml` 
3. **🔧 CRITICAL**: Consolidate CloudFormation templates
4. **🚀 IMPORTANT**: Set up automated deployment pipeline
5. **📊 MONITORING**: Implement proper observability

---

## ⚠️ RISKS OF CURRENT STATE

- **🔥 No Infrastructure as Code**: Cannot reproduce environment
- **💥 Manual Deployments**: High risk of configuration drift  
- **🔒 Security Gaps**: Unclear what policies are actually applied
- **🎯 No Rollback**: Cannot easily revert to previous working state
- **📊 No Monitoring**: Limited visibility into system health

---

## 🎯 SUCCESS CRITERIA

✅ **Single Source of Truth**: One master deployment template
✅ **Automated Deployment**: Push-to-deploy pipeline working
✅ **Environment Parity**: Dev/staging/prod environments identical
✅ **Disaster Recovery**: Can rebuild entire infrastructure from code
✅ **Monitoring**: Full observability of system health

---

*This reconstruction is CRITICAL for production stability and maintenance.*
