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

export async function fetcherRaw(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
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
  // Important: do NOT send cookies/credentials on cross-origin requests.
  // If credentials are included, the browser requires a non-wildcard
  // Access-Control-Allow-Origin and Access-Control-Allow-Credentials: true.
  // Our API intentionally sets ACAO: * for simplicity, so we must omit
  // credentials to avoid a CORS "TypeError: Failed to fetch".
  credentials: 'omit',
  mode: 'cors',
  };

  console.log(`🌐 Fetching`, enhancedInit.method || 'GET', token ? 'with auth' : 'no auth');

  try {
    const res = await fetch(url, enhancedInit);
    console.log(`📡 Response: ${res.status} ${res.statusText}`);
    return res;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('[ACTA CORS Debug]', { 
        attemptedUrl: url, 
        region: 'us-east-2', 
        errorType: 'TypeError', 
        timestamp: new Date().toISOString() 
      });
      throw new Error('Network error: Unable to connect to API. Please check your connection and try again.');
    }
    throw error;
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
  // Important: do NOT send cookies/credentials on cross-origin requests.
  // If credentials are included, the browser requires a non-wildcard
  // Access-Control-Allow-Origin and Access-Control-Allow-Credentials: true.
  // Our API intentionally sets ACAO: * for simplicity, so we must omit
  // credentials to avoid a CORS "TypeError: Failed to fetch".
  credentials: 'omit',
  mode: 'cors',
  };

  console.log(`🌐 Fetching`, enhancedInit.method || 'GET', token ? 'with auth' : 'no auth');

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
      console.error('[ACTA CORS Debug]', { 
        attemptedUrl: url, 
        region: 'us-east-2', 
        errorType: 'TypeError', 
        timestamp: new Date().toISOString() 
      });
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

/**
 * Fire-and-forget style POST for long-running backends behind API Gateway.
 * - Adds Authorization header (Amplify ID token)
 * - Uses credentials: 'omit' and mode: 'cors'
 * - Uses keepalive to allow the browser to send during unload
 * - Optional client-side timeout; treats AbortError as accepted
 * - Treats API Gateway 504 (Endpoint request timed out) as "accepted"
 */
export async function postFireAndForget(
  url: string,
  body?: unknown,
  options?: { timeoutMs?: number },
): Promise<{ accepted: boolean; timeout?: boolean; status?: number }> {
  const token = await getAuthToken();
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? 5000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
      credentials: 'omit',
      mode: 'cors',
      keepalive: true,
      signal: controller.signal,
    });

    // Consider 2xx and 202 as accepted
    if (res.ok || res.status === 202) {
      return { accepted: true, status: res.status };
    }
    // Treat API Gateway timeout as accepted (Lambda likely still running)
    if (res.status === 504) {
      return { accepted: true, status: res.status };
    }

    // Surface other errors
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${res.statusText}${text ? ` - ${text}` : ''}`);
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { accepted: true, timeout: true };
    }
    // Some browsers wrap network timeouts differently
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return { accepted: true, timeout: true };
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

