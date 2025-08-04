// import { Auth } from 'aws-amplify';rc/lib/api-amplify.ts
// Enhanced API client with AWS Amplify authentication integration

import { fetchAuthSession } from 'aws-amplify/auth';

import { apiBaseUrl, skipAuth } from '@/env.variables';

/**
 * Enhanced API call with AWS Amplify authentication
 * This provides JWT token-based authentication for all API calls
 */
export const apiCall = async (
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  payload?: any,
  options?: {
    timeout?: number;
    headers?: Record<string, string>;
    skipAuth?: boolean;
  }
) => {
  const { timeout = 30000, headers = {}, skipAuth: skipAuthOption = false } = options || {};

  try {
    // Prepare headers
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add authentication if not skipped
    if (!skipAuthOption && !skipAuth) {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (token) {
          requestHeaders['Authorization'] = `Bearer ${token}`;
          console.log('🔐 Authentication token added to request');
        }
      } catch (authError) {
        console.warn('⚠️ Authentication failed, proceeding without token:', authError);
      }
    }

    // Build full URL
    const fullUrl = path.startsWith('http')
      ? path
      : `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    console.log('🌐 API Request:', {
      method,
      url: fullUrl,
      hasAuth: !!requestHeaders['Authorization'],
      payload: method !== 'GET' ? payload : undefined,
    });

    // Create request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: method !== 'GET' ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    // Handle different response types
    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else if (contentType?.includes('text/')) {
      return await response.text();
    } else {
      return response;
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`API request timeout after ${timeout}ms`);
    }

    console.error('❌ API call failed:', {
      path,
      method,
      error: error instanceof Error ? error.message : error,
    });

    throw error;
  }
};

/**
 * Authenticated GET request
 */
export const apiGet = async <T = any>(
  path: string,
  options?: { timeout?: number; headers?: Record<string, string> }
): Promise<T> => {
  return apiCall(path, 'GET', undefined, options);
};

/**
 * Authenticated POST request
 */
export const apiPost = async <T = any>(
  path: string,
  payload?: any,
  options?: { timeout?: number; headers?: Record<string, string> }
): Promise<T> => {
  return apiCall(path, 'POST', payload, options);
};

/**
 * Authenticated PUT request
 */
export const apiPut = async <T = any>(
  path: string,
  payload?: any,
  options?: { timeout?: number; headers?: Record<string, string> }
): Promise<T> => {
  return apiCall(path, 'PUT', payload, options);
};

/**
 * Authenticated DELETE request
 */
export const apiDelete = async <T = any>(
  path: string,
  options?: { timeout?: number; headers?: Record<string, string> }
): Promise<T> => {
  return apiCall(path, 'DELETE', undefined, options);
};

/**
 * Check API health with authentication
 */
export const checkApiHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  region?: string;
}> => {
  try {
    const response = await apiGet('/health', { timeout: 5000 });
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      ...response,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Get current user info from JWT token
 */
export const getCurrentUser = async () => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken;

    if (!token) {
      return null;
    }

    return {
      username: token.payload['cognito:username'],
      email: token.payload.email,
      groups: token.payload['cognito:groups'] || [],
      sub: token.payload.sub,
      exp: token.payload.exp,
      iat: token.payload.iat,
    };
  } catch (error) {
    console.warn('Failed to get current user info:', error);
    return null;
  }
};

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  call: apiCall,
  checkHealth: checkApiHealth,
  getCurrentUser,
};
