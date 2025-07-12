// AWS Amplify Configuration for Acta-UI

const awsmobile = {
  aws_project_region: 'us-east-2',

  // ── Amplify v6 Auth Configuration ──────────────────────────────────────────
  Auth: {
    // Support both v5 and v6 config shapes
    userPoolId: 'us-east-2_FyHLtOhiY',
    userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
    identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
    region: 'us-east-2',

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

// Make awsmobile available globally for script tag loading
window.awsmobile = awsmobile;
window.amplifyConfig = awsmobile;
export default awsmobile;
