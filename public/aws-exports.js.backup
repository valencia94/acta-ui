// AWS Amplify Configuration for Acta-UI (Browser-compatible version)
// This file sets window.awsmobile for browser consumption

window.awsmobile = {
  aws_project_region: 'us-east-2',
  aws_cognito_region: 'us-east-2',
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',
  aws_cognito_identity_pool_id: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_FyHLtOhiY',
      userPoolClientId: 'dshos5iou44tuach7ta3ici5m',
      identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
      loginWith: {
        email: true,
        phone: false,
        username: false,
      },
      signUpVerificationMethod: 'code',
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
  API: {
    REST: {
      ActaAPI: {
        endpoint: 'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
        region: 'us-east-2'
      }
    }
  },
  Storage: {
    S3: {
      bucket: 'projectplace-dv-2025-x9a7b',
      region: 'us-east-2'
    }
  }
};

console.log('✅ AWS Cognito config loaded successfully!');
