// src/utils/fetchWrapper.ts

/**
 * Core fetch wrapper that throws on non-OK and parses JSON.
 * @param input  URL or RequestInfo
 * @param init   Fetch options
 * @returns      Parsed JSON of type T
 */
export async function fetcher<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    // Try to extract error message, fall back to status text
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Fetch error: ${res.status}`);
  }
  return (await res.json()) as T;
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
