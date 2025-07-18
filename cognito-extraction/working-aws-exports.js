// aws-exports.js - PRODUCTION CONFIGURATION
const awsmobile = {
  aws_project_region: "us-east-2",
  aws_user_pools_id: "us-east-2_FyHLtOhiY",
  aws_user_pools_web_client_id: "dshos5iou44tuach7ta3ici5m",
  oauth: {
    domain: "us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com",
    scope: ["email", "openid", "profile"],
    redirectSignIn: "https://d7t9x3j66yd8k.cloudfront.net/",
    redirectSignOut: "https://d7t9x3j66yd8k.cloudfront.net/login",
    responseType: "code",
  },
  aws_cloud_logic_custom: [
    {
      name: "ActaAPI",
      endpoint: "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod",
      region: "us-east-2",
    },
  ],
  aws_user_files_s3_bucket: "projectplace-dv-2025-x9a7b",
  aws_user_files_s3_bucket_region: "us-east-2",
};

export default awsmobile;
