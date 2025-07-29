// src/env.variables.ts
// ACTA-UI Environment Configuration
// 🔧 Centralized environment variable management

// Counter (optional UI fallback)
export const counterDefaultValue = import.meta.env.VITE_COUNTER
  ? +import.meta.env.VITE_COUNTER
  : 0;

// API Configuration
export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined"
    ? (window as any).awsmobile?.API?.REST?.ActaAPI?.endpoint
    : undefined) ||
  "https://q2b9avfwv5.execute-api.us-east-2.amazonaws.com/prod";
export const apiGatewayId = import.meta.env.VITE_API_GATEWAY_ID || "q2b9avfwv5";
export const apiStage = import.meta.env.VITE_API_STAGE || "prod";

// Authentication
// Skip authentication only if explicitly set to true in development
// export const skipAuth =
//   import.meta.env.VITE_SKIP_AUTH === "true" && import.meta.env.DEV;
export const skipAuth = false; // Disabled for production resilience
// export const isDemo = import.meta.env.VITE_IS_DEMO === "true";
export const isDemo = false; // Disabled for production resilience
export const authDebug = import.meta.env.VITE_AUTH_DEBUG === "true";

// AWS Configuration
export const awsRegion =
  import.meta.env.VITE_AWS_REGION ||
  import.meta.env.VITE_COGNITO_REGION ||
  import.meta.env.AWS_REGION ||
  "us-east-2";
export const awsAccountId = import.meta.env.AWS_ACCOUNT_ID || "703671891952";

// Cognito Configuration
export const cognitoRegion = import.meta.env.VITE_COGNITO_REGION || "us-east-2";
export const cognitoPoolId =
  import.meta.env.VITE_COGNITO_POOL_ID || "us-east-2_FyHLtOhiY";
export const cognitoWebClientId =
  import.meta.env.VITE_COGNITO_WEB_CLIENT_ID ||
  import.meta.env.VITE_COGNITO_WEB_CLIENT ||
  "dshos5iou44tuach7ta3ici5m";
export const cognitoDomain =
  import.meta.env.VITE_COGNITO_DOMAIN ||
  "us-east-2-fyhltohiy.auth.us-east-2.amazoncognito.com";

// S3 Configuration
export const s3Bucket =
  import.meta.env.VITE_S3_BUCKET || "projectplace-dv-2025-x9a7b";
export const s3Region = import.meta.env.VITE_S3_REGION || awsRegion;

// CloudFront Configuration
export const cloudfrontUrl =
  import.meta.env.VITE_CLOUDFRONT_URL || "https://d7t9x3j66yd8k.cloudfront.net";
export const cloudfrontDistributionId =
  import.meta.env.VITE_CLOUDFRONT_DISTRIBUTION_ID || "EPQU7PVDLQXUA";
export const appDomain =
  import.meta.env.VITE_APP_DOMAIN || "d7t9x3j66yd8k.cloudfront.net";

// Application Configuration
export const appName = import.meta.env.VITE_APP_NAME || "Ikusi · Acta Platform";
// export const useMockApi = import.meta.env.VITE_USE_MOCK_API === "true";
export const useMockApi = false; // Disabled for production resilience
export const ffmpegPath = import.meta.env.FFMPEG_PATH || "./bin/ffmpeg";

// Monitoring
export const cloudwatchPolicyId =
  import.meta.env.CLOUDWATCH_POLICY_ID || "WDnzkPmx3dKaEAQgFKx2jj";

// Environment Flags
// Indicate production build
export const isProduction = true;
export const isDevelopment = import.meta.env.DEV;

// Debug logging for environment variables (only in development)
if (isDevelopment || authDebug) {
  console.log("🔧 Environment Configuration Loaded:");
  console.table({
    "API Base URL": apiBaseUrl,
    "CloudFront URL": cloudfrontUrl,
    "CloudFront Distribution ID": cloudfrontDistributionId,
    "S3 Bucket": s3Bucket,
    "Cognito Pool ID": cognitoPoolId,
    "Auth Debug": authDebug,
    "Skip Auth": skipAuth,
    "Is Demo": isDemo,
    "Is Production": isProduction,
  });
}
