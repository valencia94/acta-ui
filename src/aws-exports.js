const awsmobile = {
  aws_project_region: 'us-east-2',
  aws_cognito_region: 'us-east-2',

  aws_user_pools_id: 'us-east-2_FyHLtOhiY',
  aws_user_pools_web_client_id: 'dshos5iou44tuach7ta3ici5m',

  aws_cognito_identity_pool_id: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',

  Auth: {
    region: 'us-east-2',
    userPoolId: 'us-east-2_FyHLtOhiY',
    userPoolWebClientId: 'dshos5iou44tuach7ta3ici5m',
    identityPoolId: 'us-east-2:1d50fa9e-c72f-4a3d-acfd-7b36ea065f35',
    authenticationFlowType: 'USER_SRP_AUTH',
    mandatorySignIn: true
  },

  oauth: {
    domain: 'us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'https://d7t9x3j66yd8k.cloudfront.net/',
    redirectSignOut: 'https://d7t9x3j66yd8k.cloudfront.net/login',
    responseType: 'code'
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
    S3: { bucket: 'projectplace-dv-2025-x9a7b', region: 'us-east-2' }
  }
};

export default awsmobile;

// Auth config duplicated intentionally to support both Amplify v6 modular + legacy use
``` |

---

### 📄 `src/App.tsx`

**🟡 Reviewed — Copilot Suggestion Partially Rejected**

| Issue | Feedback |
|-------|----------|
| Removed conditional logic from `/login` route | ⚠️ Risk: allows signed-in users to revisit login form |
| ✅ AIGOR Recommendation | Restore this logic:
```tsx
<Route
  path="/login"
  element={skipAuth || isAuthed ? <Navigate to="/dashboard" /> : <Login />}
/>
