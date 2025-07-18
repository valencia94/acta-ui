// AWS Amplify Configuration for Acta-UI (ES Module version)
// Based on the documentation single source of truth

const awsmobile = {
  // Basic AWS configuration
  aws_project_region: "us-east-2",
  aws_cognito_region: "us-east-2",

  // User Pool Configuration (for authentication)
  aws_user_pools_id: "us-east-2_FyHLtOhiY",
  aws_user_pools_web_client_id: "dshos5iou44tuach7ta3ici5m",

  // Identity Pool Configuration (for AWS service access)
  aws_cognito_identity_pool_id:
    "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",

  // API Gateway Configuration
  aws_cloud_logic_custom: [
    {
      name: "ActaAPI",
      endpoint: "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod",
      region: "us-east-2",
    },
  ],

  // S3 Storage Configuration
  aws_user_files_s3_bucket: "projectplace-dv-2025-x9a7b",
  aws_user_files_s3_bucket_region: "us-east-2",

  // Auth section combining both flows
  Auth: {
    // User Pool configuration
    userPoolId: "us-east-2_FyHLtOhiY",
    userPoolWebClientId: "dshos5iou44tuach7ta3ici5m",

    // Identity Pool configuration
    identityPoolId: "us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35",
    identityPoolRegion: "us-east-2",

    // Authentication settings
    authenticationFlowType: "USER_SRP_AUTH",
    mandatorySignIn: true,
    region: "us-east-2",
  },
};

export default awsmobile;
