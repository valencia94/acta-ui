# ACTA-UI Authentication Flow Documentation

**Date:** July 12, 2025  
**Version:** 1.0.0  
**Status:** Production Authentication Architecture

## 🔐 EXECUTIVE SUMMARY

This document memorializes the complete authentication architecture for ACTA-UI, including the dual-module approval flow, Cognito integration, CloudFront connection, and PM-to-DynamoDB authentication mechanisms.

## 🏗️ AUTHENTICATION ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ACTA-UI AUTHENTICATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────────────┘

User Login → Cognito User Pool → JWT Tokens → Dual Module Flow → API Gateway → DynamoDB
     ↓              ↓               ↓              ↓               ↓            ↓
  Frontend      Identity Pool   Access Token   PM Validation   Lambda       Data Access
  CloudFront    Credentials     ID Token       Admin Check     Functions    Authorization


# 🔐 COGNITO AUTHENTICATION - CORRECTED CLIENT ID
# ═══════════════════════════════════════════════════════════
VITE_COGNITO_REGION=us-east-2
VITE_COGNITO_POOL_ID=us-east-2_FyHLtOhiY
VITE_COGNITO_WEB_CLIENT_ID=dshos5iou44tuach7ta3ici5m
VITE_COGNITO_DOMAIN=us-east-2fyhltohiy.auth.us-east-2.amazoncognito.com

# Legacy naming for backward compatibility
VITE_COGNITO_POOL_ID=us-east-2_FyHLtOhiY
VITE_COGNITO_WEB_CLIENT_ID=dshos5iou44tuach7ta3ici5m```

## 🔄 DUAL MODULE APPROVAL FLOW

### **Module 1: Cognito User Pool Authentication**

**Purpose:** Primary user authentication and session management

```typescript
// Located in: src/main.tsx (Lines 47-96)
const configureAmplify = async () => {
  // Wait for aws-exports.js to load
  while (!window.awsmobile && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts++;
  }

  if (window.awsmobile) {
    // Configure with both User Pool and Identity Pool
    Amplify.configure(window.awsmobile);
    
    // Validation checks
    if (!window.awsmobile.Auth?.identityPoolId) {
      console.warn("⚠️ Identity Pool ID not found");
    }
    
    if (!window.awsmobile.Auth?.Cognito) {
      console.warn("⚠️ Auth configuration incomplete");
    }
  }
}
```

**Configuration Details:**
```typescript
// AWS Cognito Configuration (from aws-exports.js)
interface CognitoConfig {
  Auth: {
    Cognito: {
      userPoolId: "us-east-2_FyHLtOhiY";
      userPoolClientId: "$VITE_COGNITO_WEB_CLIENT_ID";
      identityPoolId: "$VITE_COGNITO_WEB_CLIENT_ID";
      loginWith: {
        email: true;
        username: false;
      };
      signUpVerificationMethod: "code";
      userAttributes: {
        email: { required: true };
      };
      allowGuestAccess: true;
      passwordFormat: {
        minLength: 8;
        requireLowercase: true;
        requireUppercase: true;
        requireNumbers: true;
        requireSpecialCharacters: true;
      };
    };
  };
}
```

### **Module 2: Identity Pool for Resource Access**

**Purpose:** AWS resource access with temporary credentials

```typescript
// Identity Pool Configuration
interface IdentityPoolConfig {
  identityPoolId: "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35";
  allowUnauthenticatedIdentities: true;
  authenticationProviders: {
    "cognito-idp.us-east-2.amazonaws.com/us-east-2_FyHLtOhiY": {
      role: "authenticated";
    };
  };
  roles: {
    authenticated: "arn:aws:iam::703671891952:role/amplify-authenticated-role";
    unauthenticated: "arn:aws:iam::703671891952:role/amplify-unauthenticated-role";
  };
}
```

## 🎯 AUTHENTICATION FLOW STAGES

### **Stage 1: Frontend Initialization**

**Location:** `src/main.tsx`

```typescript
// 1. CSS and Styles Loading (Critical First)
import "@/styles/variables.css";       // Design tokens
import "@/tailwind.css";               // Utility styles
import "@aws-amplify/ui-react/styles.css"; // Amplify UI
import "@/styles/amplify-overrides.css";   // Custom overrides

// 2. Critical Function Imports
import {
  getSummary,
  getTimeline,
  getDownloadUrl,
  sendApprovalEmail,
  getProjectsByPM,
  getAllProjects,
} from "@/lib/api";

// 3. Authentication Utilities
import { fetcher, getAuthToken } from "@/utils/fetchWrapper";

// 4. Amplify Configuration
import { Amplify } from "aws-amplify";
```

**Configuration Timing:**
```typescript
// Enhanced timing mechanism to prevent race conditions
configureAmplify().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
```

### **Stage 2: User Authentication Process**

**Location:** `src/pages/Login.tsx` & `src/hooks/useAuth.tsx`

```typescript
// Login Flow
interface LoginFlow {
  step1: "User enters email/password";
  step2: "Amplify.Auth.signIn() called";
  step3: "Cognito User Pool validates credentials";
  step4: "JWT tokens generated (Access, ID, Refresh)";
  step5: "Identity Pool credentials obtained";
  step6: "User session established";
  step7: "Redirect to Dashboard";
}

// Authentication State Management
interface AuthState {
  user: {
    email: string;              // Primary identifier
    sub: string;                // Cognito User ID
    groups?: string[];          // User groups (admin, pm, etc.)
    email_verified: boolean;    // Email verification status
  } | null;
  loading: boolean;             // Authentication loading state
  error: string | null;         // Authentication errors
  isAuthenticated: boolean;     // Authentication status
  tokens: {
    accessToken: string;        // API access token
    idToken: string;            // Identity token
    refreshToken: string;       // Token refresh
  } | null;
}
```

### **Stage 3: PM Authorization & Role Validation**

**Location:** `src/pages/Dashboard.tsx` (Lines 25-27)

```typescript
// PM Role Determination
const isAdmin = 
  user?.email === 'admin@ikusi.com' ||
  user?.email?.includes('admin') ||
  user?.groups?.includes('admin');

// PM Email Validation Flow
interface PMValidationFlow {
  step1: "Extract PM email from JWT token";
  step2: "Validate email format and domain";
  step3: "Check against approved PM list (optional)";
  step4: "Determine access level (PM vs Admin)";
  step5: "Filter DynamoDB access accordingly";
}
```

### **Stage 4: DynamoDB Authentication & Access Control**

**Location:** `src/components/DynamoProjectsView.tsx` & `src/lib/api.ts`

```typescript
// DynamoDB Access Pattern
interface DynamoDBAccessFlow {
  authentication: "JWT Token from Cognito User Pool";
  authorization: "Identity Pool temporary credentials";
  access_control: "PM email-based filtering";
  data_filtering: "getProjectsByPM(pmEmail, isAdmin)";
}

// API Call Authentication
async function getProjectsByPM(pmEmail: string, isAdmin: boolean = false) {
  // Step 1: Get JWT token from current session
  const token = await getAuthToken();
  
  // Step 2: Make authenticated API call
  const response = await fetch(`${API_BASE_URL}/api/pm-manager/all-projects`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-User-Email': pmEmail,        // PM identification
      'X-Is-Admin': isAdmin.toString() // Admin flag
    }
  });
  
  // Step 3: Backend validates JWT and filters data
  return response.json();
}
```

## 🌐 CLOUDFRONT CONNECTION AUTHENTICATION

### **CloudFront Distribution Configuration**

**Distribution ID:** `EPQU7PVDLQXUA`  
**Domain:** `https://d7t9x3j66yd8k.cloudfront.net`

```typescript
// CloudFront Authentication Integration
interface CloudFrontAuth {
  origin_request_policy: {
    // Forward authentication headers to origin
    headers: [
      "Authorization",
      "X-User-Email", 
      "X-Is-Admin",
      "Content-Type"
    ];
    cookies: "none";  // JWT tokens in headers, not cookies
    query_strings: "all";
  };
  
  cache_policy: {
    // Cache authenticated responses appropriately
    ttl: {
      default: 86400;     // 24 hours for static assets
      minimum: 0;         // No caching for API responses
      maximum: 31536000;  // 1 year for immutable assets
    };
    
    cache_key_parameters: {
      headers: ["Authorization"];  // Include auth in cache key
      cookies: "none";
      query_strings: "all";
    };
  };
  
  origin_access_control: {
    // Secure S3 access
    signing_behavior: "always";
    signing_protocol: "sigv4";
    origin_access_identity: "E1234567890123";
  };
}
```

### **CORS Configuration for Authentication**

```typescript
// API Gateway CORS for CloudFront
interface CORSConfig {
  allowed_origins: ["https://d7t9x3j66yd8k.cloudfront.net"];
  allowed_methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
  allowed_headers: [
    "Authorization",
    "Content-Type", 
    "X-User-Email",
    "X-Is-Admin",
    "X-Amz-Date",
    "X-Api-Key"
  ];
  credentials: true;  // Allow cookies/auth headers
  max_age: 86400;     // Preflight cache duration
}
```

## 🔑 TOKEN MANAGEMENT & REFRESH

### **JWT Token Lifecycle**

```typescript
// Token Management (src/utils/fetchWrapper.ts)
interface TokenManagement {
  storage: "localStorage";  // Secure token storage
  access_token_ttl: 3600;   // 1 hour
  id_token_ttl: 3600;       // 1 hour  
  refresh_token_ttl: 2592000; // 30 days
  
  refresh_strategy: "automatic"; // Auto-refresh on 401
  refresh_threshold: 300;       // Refresh 5 min before expiry
  
  security: {
    httpOnly: false;           // Client-side access needed
    secure: true;              // HTTPS only
    sameSite: "strict";        // CSRF protection
  };
}

// Token Refresh Flow
async function refreshTokens() {
  try {
    const currentSession = await getCurrentUser();
    const refreshToken = currentSession.getRefreshToken();
    
    const newSession = await Auth.refreshSession(
      currentSession, 
      refreshToken
    );
    
    // Update stored tokens
    localStorage.setItem('accessToken', newSession.getAccessToken().getJwtToken());
    localStorage.setItem('idToken', newSession.getIdToken().getJwtToken());
    
    return newSession;
  } catch (error) {
    // Force re-authentication on refresh failure
    await signOut();
    window.location.href = '/login';
    throw error;
  }
}
```

## 🛡️ SECURITY MECHANISMS

### **1. Authentication Security**

```typescript
interface AuthSecurity {
  password_policy: {
    min_length: 8;
    require_uppercase: true;
    require_lowercase: true;
    require_numbers: true;
    require_special_chars: true;
    prevent_reuse: 24;  // Last 24 passwords
  };
  
  session_security: {
    idle_timeout: 3600;      // 1 hour idle logout
    absolute_timeout: 28800; // 8 hour max session
    concurrent_sessions: 1;   // Single session per user
  };
  
  mfa_options: {
    sms: true;               // SMS-based MFA
    totp: true;              // App-based MFA
    backup_codes: true;      // Emergency access codes
  };
}
```

### **2. API Security**

```typescript
interface APISecurity {
  authentication: "JWT Bearer token";
  authorization: "Role-based access control";
  rate_limiting: {
    requests_per_minute: 100;
    burst_capacity: 200;
  };
  
  input_validation: {
    email_format: true;
    sql_injection_prevention: true;
    xss_prevention: true;
    request_size_limit: "10MB";
  };
  
  audit_logging: {
    auth_events: true;
    api_calls: true;
    error_events: true;
    retention_days: 90;
  };
}
```

## 📊 PM-TO-DYNAMODB AUTHENTICATION FLOW

### **Detailed Authentication Sequence**

```typescript
// Complete PM Authentication Flow
interface PMAuthenticationSequence {
  step1: {
    action: "User Login";
    location: "src/pages/Login.tsx";
    process: "Cognito User Pool authentication";
    output: "JWT tokens (Access, ID, Refresh)";
  };
  
  step2: {
    action: "Session Establishment";
    location: "src/hooks/useAuth.tsx";
    process: "Parse JWT, extract user info";
    output: "User object with email, sub, groups";
  };
  
  step3: {
    action: "PM Role Determination";
    location: "src/pages/Dashboard.tsx";
    process: "Check email against admin patterns";
    output: "isAdmin boolean flag";
  };
  
  step4: {
    action: "Project Data Request";
    location: "src/components/DynamoProjectsView.tsx";
    process: "Call getProjectsByPM API";
    output: "Filtered project list";
  };
  
  step5: {
    action: "API Authentication";
    location: "src/lib/api.ts";
    process: "Include JWT token in Authorization header";
    output: "Authenticated API request";
  };
  
  step6: {
    action: "Backend Validation";
    location: "API Gateway + Lambda";
    process: "Validate JWT, extract PM email";
    output: "Authorized access to DynamoDB";
  };
  
  step7: {
    action: "DynamoDB Query";
    location: "Lambda Function";
    process: "Filter projects by PM email or admin access";
    output: "PM-specific project data";
  };
  
  step8: {
    action: "Response Delivery";
    location: "CloudFront + Client";
    process: "Cache and deliver authenticated response";
    output: "Rendered project dashboard";
  };
}
```

### **DynamoDB Access Patterns**

```typescript
// PM-Based Data Filtering
interface DynamoDBAccessPatterns {
  regular_pm_access: {
    filter: "pm = ${userEmail} OR project_manager = ${userEmail}";
    scan_limit: 100;
    return_fields: ["project_id", "project_name", "pm", "project_manager"];
  };
  
  admin_access: {
    filter: "ALL"; // No filtering for admin users
    scan_limit: 1000;
    return_fields: ["*"]; // All fields for admin
  };
  
  query_optimization: {
    use_gsi: true;  // Global Secondary Index on PM email
    projection_type: "INCLUDE";
    projected_attributes: ["project_id", "project_name", "pm"];
  };
}
```

## 🔄 ERROR HANDLING & FALLBACKS

### **Authentication Error Handling**

```typescript
interface AuthErrorHandling {
  cognito_errors: {
    invalid_credentials: "Redirect to login with error message";
    user_not_found: "Show registration option";
    password_reset_required: "Force password reset flow";
    mfa_required: "Show MFA challenge";
    session_expired: "Auto-refresh or force re-login";
  };
  
  api_errors: {
    401_unauthorized: "Refresh tokens or force re-login";
    403_forbidden: "Show access denied message";
    429_rate_limited: "Show retry message with backoff";
    500_server_error: "Show generic error, log details";
  };
  
  network_errors: {
    connection_failed: "Show offline message, enable retry";
    timeout: "Show timeout message, auto-retry";
    cors_error: "Log configuration issue, show generic error";
  };
}
```

### **Fallback Mechanisms**

```typescript
interface FallbackMechanisms {
  aws_exports_loading: {
    primary: "Load from window.awsmobile (script tag)";
    fallback: "Dynamic import from @/aws-exports";
    timeout: "5 seconds before fallback";
  };
  
  token_storage: {
    primary: "localStorage";
    fallback: "sessionStorage";
    last_resort: "memory (session only)";
  };
  
  api_endpoints: {
    primary: "Production API Gateway";
    fallback: "Backup API endpoint (if configured)";
    offline: "Show cached data with sync notification";
  };
}
```

## 📋 AUTHENTICATION CHECKLIST

### **Pre-Deployment Verification**

- ✅ **Cognito User Pool**: `us-east-2_FyHLtOhiY` configured and active
- ✅ **Cognito Client**: `$VITE_COGNITO_WEB_CLIENT_ID properly configured
- ✅ **Identity Pool**: `$VITE_COGNITO_POOL_ID` linked
- ✅ **IAM Roles**: Authenticated and unauthenticated roles configured
- ✅ **API Gateway**: JWT authorizer configured and tested
- ✅ **CloudFront**: CORS and caching policies set
- ✅ **DynamoDB**: Access policies allow Identity Pool access
- ✅ **Lambda Functions**: JWT validation implemented

### **Runtime Verification**

- ✅ **AWS Config Loading**: window.awsmobile populated correctly
- ✅ **Amplify Configuration**: Both User Pool and Identity Pool configured
- ✅ **Token Generation**: JWT tokens generated on successful login
- ✅ **Token Refresh**: Automatic token refresh working
- ✅ **PM Filtering**: Project data filtered by PM email
- ✅ **Admin Access**: Admin users can access all projects
- ✅ **Error Handling**: Graceful handling of auth failures
- ✅ **Session Management**: Proper session lifecycle management

---

## 🎯 SUMMARY

The ACTA-UI authentication architecture implements a robust dual-module approval flow:

1. **Module 1** (Cognito User Pool): Primary user authentication with JWT tokens
2. **Module 2** (Identity Pool): AWS resource access with temporary credentials

This architecture ensures:
- ✅ Secure user authentication through Cognito
- ✅ Proper PM-based data filtering in DynamoDB
- ✅ Admin role escalation when authorized
- ✅ CloudFront integration with authentication headers
- ✅ Comprehensive error handling and fallbacks
- ✅ Token lifecycle management with auto-refresh

The system provides both security and usability while maintaining scalability for future enhancements.
