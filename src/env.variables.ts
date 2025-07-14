export const counterDefaultValue = import.meta.env.VITE_COUNTER
  ? +import.meta.env.VITE_COUNTER
  : 0;

// Base URL for the production API Gateway
// This repo currently targets the production endpoints directly
export const apiBaseUrl =
  'https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod';

export const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
