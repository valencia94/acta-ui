// src/utils/fetchWrapper.ts
import { fetchAuthSession } from '@aws-amplify/auth';
import { skipAuth } from '@/env.variables';

/**
 * Get the current authentication token
 */
export async function getAuthToken(): Promise<string | null> {
  // Use static import for skipAuth
  // In skip auth mode, don't try to get real tokens
  if (skipAuth) {
    console.log('🔓 Skip auth mode: Using mock token');
    return 'mock-auth-token-skip-mode';
  }

  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.warn('No authentication session found:', error);
    return null;
  }
}

/**
 * Core fetch wrapper that throws on non-OK and parses JSON.
 * Automatically includes authentication headers when available.
 * @param input  URL or RequestInfo
 * @param init   Fetch options
 * @returns      Parsed JSON of type T
 */
export async function fetcher<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const url = typeof input === 'string' ? input : input.url;
  
  // Get authentication token
  const token = await getAuthToken();

  // Prepare headers
  const headers = new Headers(init?.headers);

  // Add authentication header if token is available
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Add default headers
  if (!headers.has('Content-Type') && init?.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const enhancedInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include', // Include cookies for session management
  };

  console.log(`🌐 Fetching: ${input}`, {
    method: enhancedInit.method || 'GET',
    hasAuth: !!token,
    headers: Object.fromEntries(headers.entries()),
  });

  const res = await fetch(input, enhancedInit);

  console.log(`📡 Response: ${res.status} ${res.statusText}`);

  if (!res.ok) {
    // Enhanced error handling with more context
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`;

    try {
      const errorText = await res.text();
      if (errorText) {
        errorMessage += ` - ${errorText}`;
      }
    } catch (e) {
      // If we can't read the error text, just use the status
    }

    // Add context for common error scenarios
    if (res.status === 403) {
      errorMessage += ' (Authentication required or insufficient permissions)';
    } else if (res.status === 502) {
      errorMessage +=
        ' (Backend Lambda function error - check CloudWatch logs)';
    } else if (res.status === 404) {
      errorMessage += ' (Endpoint not found - check API Gateway routes)';
    }
    console.error('❌ Fetch error:', errorMessage);
    throw new Error(errorMessage);
  }

  // Parse JSON response
  try {
    const data = await res.json();
    console.log('✅ Response data:', data);
    return data as T;
  } catch (error) {
    console.error('❌ Failed to parse JSON response:', error);
    throw new Error('Invalid JSON response from server');
  }
}

/**
 * Shorthand for GET requests.
 */
export function get<T>(url: string): Promise<T> {
  return fetcher<T>(url, {
    credentials: 'include',
  });
}

/**
 * Shorthand for POST requests with JSON body.
 */
export function post<T>(url: string, body?: unknown): Promise<T> {
  return fetcher<T>(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
