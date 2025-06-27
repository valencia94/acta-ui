// src/aws-exports.js
const awsmobile = {
  aws_project_region: 'us-east-2',

  // ── Cognito ─────────────────────────────────────────────────────────────
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: '1hdn8b19ub2kmfkuse8rsjpv8e',

  oauth: {
    // NO https://  and NO trailing slash on the domain line
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
    scope: ['email', 'openid'],
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/',
    responseType: 'code',
  },
};

export default awsmobile;
