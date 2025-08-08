// Lightweight fetch wrapper that attaches the current Cognito ID token
// as a Bearer token and surfaces useful error messages. This version
// intentionally avoids SigV4 signing – all requests rely solely on the
// JWT provided by Amplify.

import { fetchAuthSession } from 'aws-amplify/auth';

import { skipAuth } from '@/env.variables';

export async function getAuthToken(): Promise<string | null> {
  if (skipAuth) {
    console.log('🔓 Skip auth mode: Using mock token');
    return 'mock-auth-token-skip-mode';
  }

  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) {
      return token;
    }
    console.warn('⚠️ No ID token found in session');
    return null;
  } catch (error) {
    console.error('❌ Failed to fetch authentication session:', error);
    return null;
  }
}

export async function fetcher<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
  const url = typeof input === 'string' ? input : input.url;
  const token = await getAuthToken();

  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const enhancedInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
  };

  console.log(`🌐 Fetching: ${url}`, {
    method: enhancedInit.method || 'GET',
    hasAuth: !!token,
    headers: Object.fromEntries(headers.entries()),
  });

  try {
    const res = await fetch(url, enhancedInit);

    console.log(`📡 Response: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorText = await res.text();
        if (errorText) errorMessage += ` - ${errorText}`;
      } catch {
        // ignore
      }
      console.error('❌ Fetch error:', errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const data = await res.json();
      console.log('✅ Response data:', data);
      return data as T;
    } catch (error) {
      console.error('❌ Failed to parse JSON response:', error);
      throw new Error('Invalid JSON response from server');
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('❌ Network error (CORS or connectivity):', error);
      throw new Error('Network error: Unable to connect to API. Please check your connection and try again.');
    }
    throw error;
  }
}

export function get<T>(url: string): Promise<T> {
  return fetcher<T>(url, { method: 'GET' });
}

export function post<T>(url: string, body?: unknown): Promise<T> {
  return fetcher<T>(url, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });
}

