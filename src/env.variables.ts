export const counterDefaultValue = import.meta.env.VITE_COUNTER
  ? +import.meta.env.VITE_COUNTER
  : 0;

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';
