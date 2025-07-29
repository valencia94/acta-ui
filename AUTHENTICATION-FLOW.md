# ACTA-UI Authentication Flow Documentation

This document explains the dual authentication model used in the ACTA-UI application, covering both Cognito User Pool and Identity Pool authentication flows.

## Authentication Architecture

The ACTA-UI application uses a dual authentication model:

1. **Cognito User Pool Authentication**: For user sign-in and access to the dashboard
2. **Cognito Identity Pool Authentication**: For AWS service access, especially DynamoDB

### Authentication Flow Diagram

```ascii
┌─────────────┐     ┌───────────────┐     ┌─────────────────┐
│ Login Page  │────▶│ Cognito User  │────▶│ Dashboard Page  │
│             │     │ Pool Auth     │     │                 │
└─────────────┘     └───────────────┘     └────────┬────────┘
                           │                        │
                           ▼                        ▼
                    ┌───────────────┐     ┌─────────────────┐
                    │ ID Token      │     │ API Calls with  │
                    │ (JWT)         │────▶│ ID Token        │
                    └───────────────┘     └────────┬────────┘
                           │                        │
                           ▼                        ▼
                    ┌───────────────┐     ┌─────────────────┐
                    │ Cognito       │     │ AWS Services    │
                    │ Identity Pool │────▶│ (DynamoDB, etc) │
                    └───────────────┘     └─────────────────┘
```

## Configuration Requirements

For the dual authentication model to work correctly, both User Pool and Identity Pool must be properly configured:

### 1. AWS Exports Configuration

The `aws-exports.js` file must include:

```javascript
const awsmobile = {
  // Region Configuration
  aws_project_region: "us-east-2",

  // User Pool Configuration (for authentication)
  aws_user_pools_id: "us-east-2_FyHLtOhiY",
  aws_user_pools_web_client_id: "dshos5iou44tuach7ta3ici5m",

  // Identity Pool Configuration (for AWS service access)
  aws_cognito_identity_pool_id:
    "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",
  aws_cognito_region: "us-east-2",

  // Auth Flow Configuration
  Auth: {
    // Authentication flow for sign-in
    authenticationFlowType: "USER_SRP_AUTH",

    // Identity Pool configuration
    identityPoolId: "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",
    identityPoolRegion: "us-east-2",

    // User Pool configuration
    userPoolId: "us-east-2_FyHLtOhiY",
    userPoolWebClientId: "dshos5iou44tuach7ta3ici5m",

    mandatorySignIn: true,
    region: "us-east-2",
  },
};
```

### 2. Script Loading Order

The `aws-exports.js` file must be loaded before any other scripts in the `<head>` section of `index.html`:

```html
<head>
  <meta charset="UTF-8" />
  <title>Ikusi · Acta Platform</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/png" href="/assets/ikusi-logo.png" />
  <!-- CRITICAL: Load AWS configuration before any other scripts -->
  <script src="/aws-exports.js"></script>
  <!-- Other scripts follow -->
</head>
```

### 3. Amplify Configuration in main.tsx

The `main.tsx` file must configure Amplify with the `aws-exports.js` configuration:

```typescript
import { Amplify } from 'aws-amplify';

// Enhanced Amplify configuration with proper waiting
const configureAmplify = async () => {
  // Wait for aws-exports.js to load
  let attempts = 0;
  while (!window.awsmobile && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (window.awsmobile) {
    console.log('✅ AWS config found, configuring Amplify');
    Amplify.configure(window.awsmobile);
  } else {
    console.error('❌ aws-exports.js failed to load');
    // Fallback to imported aws-exports.js
    try {
      const awsExports = await import('@/aws-exports');
      Amplify.configure(awsExports.default);
    } catch (err) {
      console.error('❌ Failed to configure Amplify:', err);
    }
  }
};

// Configure Amplify before rendering
configureAmplify().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
```

## Authentication Process

### Step 1: User Authentication (User Pool)

1. User enters credentials on the login page
2. AWS Amplify `signIn()` function authenticates with Cognito User Pool
3. Upon successful authentication, an ID token (JWT) is received
4. The ID token is stored in localStorage as 'ikusi.jwt'

### Step 2: AWS Service Authentication (Identity Pool)

1. AWS Amplify automatically exchanges the User Pool token for Identity Pool credentials
2. These credentials allow the application to access AWS services
3. API calls include the ID token in the Authorization header
4. AWS API Gateway validates the token and allows access to the backend services
5. Lambda functions use the Identity Pool role to access DynamoDB

## Testing Authentication

To test both authentication flows:

1. Run `fix-auth-config.sh` to ensure proper configuration
2. Rebuild the application with `pnpm run build`
3. Deploy with `deploy-production.sh`
4. Test the authentication with `test-auth-flow.sh`

## Troubleshooting

If authentication fails, check:

1. **AWS Exports Configuration**: Ensure both User Pool and Identity Pool IDs are correctly set
2. **Script Loading Order**: Verify aws-exports.js loads before other scripts in the head
3. **Network Requests**: Check network requests for 401/403 errors
4. **Console Errors**: Look for "UserPool not configured" or similar errors
5. **Token Storage**: Verify the token is stored in localStorage
6. **API Access**: Check if API calls include the correct Authorization header

## Skip Auth Mode

For development, the application includes a "Skip Auth Mode" which bypasses the authentication process:

```typescript
if (skipAuth) {
  // In skip auth mode, just simulate login
  localStorage.setItem("ikusi.jwt", "dev-token");
  nav("/dashboard");
  return;
}
```

This mode can be enabled by setting `VITE_SKIP_AUTH=true` in the .env file.

---

For further assistance with authentication issues, please check the debug panel on the login page or run the `test-production.js` script to get a comprehensive diagnosis.
