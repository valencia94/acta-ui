// src/aws-exports.js
const awsmobile = {
  aws_project_region: 'us-east-2',

  // ── Cognito ─────────────────────────────────────────────────────────────
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: '1hdn8b19ub2kmfkuse8rsjpv8e',

  oauth: {
    // NO https://  and NO trailing slash on the domain line
    domain: 'us-east-2fyhltohiy.auth.us-east-2.amazoncognito.com',
    scope: ['email', 'openid'],
    redirectSignIn: 'https://d1pdn8jj8kyfw8.cloudfront.net/',
    redirectSignOut: 'https://d1pdn8jj8kyfw8.cloudfront.net/',
    responseType: 'code',
  },
};

export default awsmobile;
