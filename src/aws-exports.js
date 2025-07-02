// src/aws-exports.js
const awsmobile = {
  aws_project_region: 'us-east-2', // ── Cognito ─────────────────────────────────────────────────────────────
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',

  // ── CloudWatch Policy ID ───────────────────────────────────────────────
  // Policy ID for monitoring: WDnzkPmx3dKaEAQgFKx2jj

  // OAuth configuration disabled until custom domain is properly configured
  // This will use the default Cognito hosted UI without custom domain
  // oauth: {
  //   domain: 'your-custom-domain.auth.us-east-2.amazoncognito.com',
  //   scope: ['email', 'openid'],
  //   redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
  //   redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/login',
  //   responseType: 'code',
  // },
};

export default awsmobile;
