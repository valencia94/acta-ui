// AWS Amplify Configuration for Acta-UI
// Provides both legacy and Amplify v6 formats

const awsmobile = {
  aws_project_region: "us-east-2",
  aws_cognito_region: "us-east-2",

  // ── Legacy Cognito Fields ─────────────────────────────────────────────────-
  aws_user_pools_id: "us-east-2_FyHLtOhiY",
  aws_user_pools_web_client_id: "dshos5iou44tuach7ta3ici5m",
  aws_cognito_identity_pool_id:
    "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",

  // ── OAuth Configuration ────────────────────────────────────────────────────
  oauth: {
    domain: "us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com",
    scope: ["email", "openid", "profile"],
    redirectSignIn: "https://d7t9x3j66yd8k.cloudfront.net/",
    redirectSignOut: "https://d7t9x3j66yd8k.cloudfront.net/login",
    responseType: "code",
  },

  // ── API Gateway Legacy Format ─────────────────────────────────────────────-
  aws_cloud_logic_custom: [
    {
      name: "ActaAPI",
      endpoint: "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod",
      region: "us-east-2",
    },
  ],

  // ── S3 Storage Legacy Format ───────────────────────────────────────────────
  aws_user_files_s3_bucket: "projectplace-dv-2025-x9a7b",
  aws_user_files_s3_bucket_region: "us-east-2",

  // ── Amplify v6 Configuration ───────────────────────────────────────────────
  Auth: {
    userPoolId: "us-east-2_FyHLtOhiY",
    userPoolWebClientId: "dshos5iou44tuach7ta3ici5m",
    identityPoolId: "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",
    identityPoolRegion: "us-east-2",
    authenticationFlowType: "USER_SRP_AUTH",
    mandatorySignIn: true,
    region: "us-east-2",

    Cognito: {
      userPoolId: "us-east-2_FyHLtOhiY",
      userPoolClientId: "dshos5iou44tuach7ta3ici5m",
      identityPoolId: "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",
      signUpVerificationMethod: "code",
      loginWith: {
        email: true,
        phone: false,
        username: false,
        oauth: {
          domain: "us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com",
          scopes: ["email", "openid", "profile"],
          redirectSignIn: ["https://d7t9x3j66yd8k.cloudfront.net/"],
          redirectSignOut: ["https://d7t9x3j66yd8k.cloudfront.net/login"],
          responseType: "code",
        },
      },
      userAttributes: {
        email: { required: true },
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
        endpoint: "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod",
        region: "us-east-2",
      },
    },
  },

  Storage: {
    S3: {
      bucket: "projectplace-dv-2025-x9a7b",
      region: "us-east-2",
    },
  },
};

// Expose configuration for both module imports and script tag usage
window.awsmobile = awsmobile;
window.amplifyConfig = awsmobile;
export default awsmobile;
