export const counterDefaultValue = import.meta.env.VITE_COUNTER
  ? +import.meta.env.VITE_COUNTER
  : 0;

// Set API base URL with better debugging
// Prefer environment variable, then aws-exports.js, finally localhost
export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined'
    ? (window as any).awsmobile?.API?.REST?.ActaAPI?.endpoint
    : undefined) ||
  'http://localhost:9999';

export const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
