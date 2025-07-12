// AWS Amplify v6 Configuration for Acta-UI (Browser-compatible version)
// This file sets window.awsmobile for browser consumption

window.awsmobile = {
  aws_project_region: 'us-east-2',

  // ── Amplify v6 Auth Configuration ──────────────────────────────────────────
  Auth: {
    // Top-level fields allow Amplify to work with either v5 or v6 format
    userPoolId: 'us-east-2_FyHLtOhiY',
    userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
    identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
    region: 'us-east-2',

    // Nested Cognito block is the structure expected by Amplify v6
    Cognito: {
      userPoolId: 'us-east-2_FyHLtOhiY',
      userPoolClientId: 'dshos5iou44tuach7ta3ici5m',
      identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
        phone: false,
        username: false,
        oauth: {
          domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: ['https://d7t9x3j66yd8k.cloudfront.net/'],
          redirectSignOut: ['https://d7t9x3j66yd8k.cloudfront.net/login'],
          responseType: 'code',
        },
      },
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },

  // ── API Gateway v6 Configuration ───────────────────────────────────────────
  API: {
    REST: {
      ActaAPI: {
        endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
        region: 'us-east-2',
      },
    },
  },

  // ── S3 Storage Configuration ───────────────────────────────────────────────
  Storage: {
    S3: {
      bucket: 'projectplace-dv-2025-x9a7b',
      region: 'us-east-2',
    },
  },
};

console.log('✅ AWS Cognito config loaded successfully!');
