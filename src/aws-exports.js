// src/aws-exports.js
import { fetchAuthSession } from 'aws-amplify/auth';

const awsmobile = {
  aws_project_region: 'us-east-2',

  // ── Cognito ─────────────────────────────────────────────────────────────
  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',

  oauth: {
    // NO https://  and NO trailing slash on the domain line
    domain: 'acta-ui-prod.auth.us-east-2.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'https://d13zx5u8i7fdt7.cloudfront.net/callback/',
    redirectSignOut: 'https://d13zx5u8i7fdt7.cloudfront.net/logout/',
    responseType: 'code',
  },

  // ── API Gateway ─────────────────────────────────────────────────────────
  aws_api_gateway_endpoint:
    'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod',
  aws_api_gateway_region: 'us-east-2',
  custom_header: async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return {};
    }
  },
};

export default awsmobile;
