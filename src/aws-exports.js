const awsmobile = {
  aws_project_region:  import.meta.env.VITE_AWS_REGION,
  aws_user_pools_id:   import.meta.env.VITE_COGNITO_POOL_ID,
  aws_user_pools_web_client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  oauth: {
    domain: import.meta.env.VITE_COGNITO_DOMAIN,
    scope: ['email', 'openid'],
    redirectSignIn:  import.meta.env.VITE_APP_URL,
    redirectSignOut: import.meta.env.VITE_APP_URL,
    responseType: 'code'
  }
};
export default awsmobile;
