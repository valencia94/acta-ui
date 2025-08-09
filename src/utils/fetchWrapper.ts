// Lightweight fetch wrapper that attaches the current Cognito ID token
// via Authorization: Bearer <idToken>. Returns either a raw Response
// (fetcher) or parsed JSON (get/post). No cookies; CORS-friendly.

import { fetchAuthSession } from 'aws-amplify/auth';

/** Acquire the Cognito ID token (throws if missing) */
export async function getAuthToken(): Promise<string> {
  const { tokens } = await fetchAuthSession();
  const token = tokens?.idToken?.toString();
  if (!token) throw new Error('No ID token');
  return token;
}

/** Low-level: returns a Response (what lib/api.ts expects) */
export async function fetcher(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const url = typeof input === 'string' ? input : (input as Request).url ?? String(input);
  const token = await getAuthToken();

  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.method && init.method !== 'GET' && init.body && typeof init.body === 'object' && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...init,
    headers,
    mode: 'cors',
    credentials: 'omit',
    redirect: init.redirect ?? 'follow',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${res.statusText}${body ? `\n${body}` : ''}`);
  }
  return res;
}

/** Alias kept for callers that were using `fetcherRaw` */
export const fetcherRaw = fetcher;

/** Convenience helpers that return parsed JSON */
export async function get<T>(url: string): Promise<T> {
  const res = await fetcher(url, { method: 'GET' });
  return res.json();
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method: 'POST',
    body: body && typeof body === 'object' && !(body instanceof FormData) ? JSON.stringify(body) : (body as BodyInit | undefined),
  };
  const res = await fetcher(url, init);
  return res.json();
}

/**
 * Fire-and-forget POST: good for kicking off long-running Lambdas.
 * Treats 2xx/202 as accepted; surfaces other statuses as errors.
 */
export async function postFireAndForget(
  url: string,
  body?: unknown,
  options?: { timeoutMs?: number }
): Promise<{ accepted: boolean; timeout?: boolean; status?: number }> {
  const token = await getAuthToken();
  const headers = new Headers({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? 5000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      body: body && typeof body === 'object' && !(body instanceof FormData) ? JSON.stringify(body) : (body as BodyInit | undefined),
      headers,
      mode: 'cors',
      credentials: 'omit',
      keepalive: true,
      signal: controller.signal,
    });

    if (res.ok || res.status === 202) {
      return { accepted: true, status: res.status };
    }
    if (res.status === 504) {
      // API Gateway timeout: backend likely still running
      return { accepted: true, status: res.status };
    }
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${res.statusText}${text ? ` - ${text}` : ''}`);
  } catch (err: any) {
    if (err?.name === 'AbortError') return { accepted: true, timeout: true };
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('timeout') || msg.includes('timed out')) return { accepted: true, timeout: true };
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
