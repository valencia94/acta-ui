export const counterDefaultValue = import.meta.env.VITE_COUNTER
  ? +import.meta.env.VITE_COUNTER
  : 0;

// Set API base URL with better debugging
export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:9999'; // Fallback to localhost for now

export const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
