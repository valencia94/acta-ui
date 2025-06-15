const config = {
  Auth: {
    region: import.meta.env.VITE_COGNITO_REGION,
    userPoolId: import.meta.env.VITE_COGNITO_POOL_ID,
    userPoolWebClientId: import.meta.env.VITE_COGNITO_WEB_CLIENT,
  },
};

export default config;
