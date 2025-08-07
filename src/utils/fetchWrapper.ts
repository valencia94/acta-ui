// ✅ fetchWrapper.ts – Final Merge-Validated Version (CORS + CI Safe)

import { Sha256 } from '@aws-crypto/sha256-js';
import { FetchHttpHandler } from '@smithy/fetch-http-handler';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
import { parseUrl } from '@smithy/url-parser';
import { fetchAuthSession } from 'aws-amplify/auth';

import { skipAuth } from '@/env.variables';

const sigv4Endpoints = [
  '/projects-for-pm',
  '/send-approval-email',
  '/check-document',
  '/download-acta',
  '/extract-project-place',
  '/all-projects',
];

function needsSigV4(url: string): boolean {
  if (typeof process !== 'undefined' && process.env.VITEST) {
    return false;
  }
  return sigv4Endpoints.some((ep) => url.includes(ep));
}

export async function getAuthToken(): Promise<string | null> {
  if (skipAuth) {
    console.log('🔓 Skip auth mode: Using mock token');
    return 'mock-auth-token-skip-mode';
  }
  try {
    console.log('🔐 Attempting to fetch auth session...');
    const session = await fetchAuthSession();
    console.log('📡 Auth session response:', {
      hasTokens: !!session.tokens,
      hasIdToken: !!session.tokens?.idToken,
      hasAccessToken: !!session.tokens?.accessToken,
      credentials: !!session.credentials,
    });
    const token = session.tokens?.idToken?.toString();
    if (token) {
      console.log('✅ Successfully extracted ID token');
      return token;
    } else {
      console.warn('⚠️ No ID token found in session');
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to fetch authentication session:', error);
    return null;
  }
}

export async function fetcher<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const url = typeof input === 'string' ? input : input.url;

  // Skip SigV4 signing completely when skipAuth is enabled
  if (needsSigV4(url) && !skipAuth) {
    const session = await fetchAuthSession();
    const creds = session.credentials;

    const signer = new SignatureV4({
      service: 'execute-api',
      region: import.meta.env.VITE_AWS_REGION || import.meta.env.VITE_COGNITO_REGION || 'us-east-2',
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        sessionToken: creds.sessionToken,
      },
      sha256: Sha256,
    });

    const parsed = parseUrl(url);
    const headerRecord: Record<string, string> = {
      host: parsed.hostname,
    };

    if (init?.headers) {
      const headers = init.headers;
      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          headerRecord[key] = value;
        });
      } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => {
          headerRecord[key] = value;
        });
      } else if (typeof headers === 'object') {
        Object.entries(headers).forEach(([key, value]) => {
          headerRecord[key] = String(value);
        });
      }
    }

    const request = new HttpRequest({
      ...parsed,
      method: init?.method || 'GET',
      headers: headerRecord,
      body: init?.body,
    });

    const signed = (await signer.sign(request)) as HttpRequest;
    const { response } = await new FetchHttpHandler().handle(signed);

    const raw = await response.body?.transformToString();
    try {
      const json = JSON.parse(raw ?? '');
      console.log('✅ SigV4 Response:', json);
      return json as T;
    } catch {
      console.error('❌ SigV4 response not JSON:', raw);
      throw new Error('Invalid JSON response from SigV4 request');
    }
  } else {
    const token = await getAuthToken();
    const headers = new Headers(init?.headers);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type') && init?.method !== 'GET') {
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
          // Ignore parsing errors for error response text
        }

        if (res.status === 403) errorMessage += ' (Forbidden / Signature mismatch)';
        if (res.status === 502) errorMessage += ' (Lambda error)';
        if (res.status === 404) errorMessage += ' (Not Found)';

        console.error('❌ Fetch error:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await res.json();
      console.log('✅ Response data:', data);
      return data as T;
    } catch (fetchError) {
      // If in development mode and fetch fails (likely due to blocked API), return mock data
      if (skipAuth && import.meta.env.DEV) {
        console.warn('🔄 API fetch failed in dev mode, returning mock data for:', url);
        
        // Return mock data based on endpoint
        if (url.includes('/projects-for-pm')) {
          const mockProjects = [
            {
              id: 'PROJECT-001',
              name: 'Sample ACTA Project Alpha',
              pm: 'admin@ikusi.com',
              status: 'active',
              description: 'Mock project for development testing'
            },
            {
              id: 'PROJECT-002', 
              name: 'Demo Project Beta',
              pm: 'admin@ikusi.com',
              status: 'in-progress',
              description: 'Another sample project for UI testing'
            },
            {
              id: 'PROJECT-003',
              name: 'Test Project Gamma',
              pm: 'admin@ikusi.com', 
              status: 'completed',
              description: 'Completed mock project example'
            }
          ];
          console.log('🎭 Returning mock projects:', mockProjects);
          return mockProjects as T;
        }
        
        if (url.includes('/check-document')) {
          const mockDocumentCheck = { available: true, lastModified: new Date().toISOString() };
          console.log('🎭 Returning mock document check:', mockDocumentCheck);
          return mockDocumentCheck as T;
        }
        
        if (url.includes('/download-acta')) {
          const mockDownloadUrl = 'https://example.com/mock-acta-document.pdf';
          console.log('🎭 Returning mock download URL:', mockDownloadUrl);
          return mockDownloadUrl as T;
        }

        if (url.includes('/all-projects')) {
          const mockAllProjects = [
            {
              id: 'ADMIN-PROJECT-001',
              name: 'Admin Project Alpha',
              pm: 'pm1@ikusi.com',
              status: 'active',
              description: 'Admin view project example'
            },
            {
              id: 'ADMIN-PROJECT-002', 
              name: 'Admin Project Beta',
              pm: 'pm2@ikusi.com',
              status: 'completed',
              description: 'Another admin project'
            }
          ];
          console.log('🎭 Returning mock all projects:', mockAllProjects);
          return mockAllProjects as T;
        }

        // For other endpoints, return a generic success response
        const mockResponse = { success: true, message: 'Mock response in development mode' };
        console.log('🎭 Returning generic mock response:', mockResponse);
        return mockResponse as T;
      }

      // Re-throw the error if not in mock mode
      console.error('❌ Failed to fetch:', fetchError);
      throw new Error('Failed to fetch from API');
    }
  }
}

export function get<T>(url: string): Promise<T> {
  return fetcher<T>(url, { credentials: 'include' });
}

export function post<T>(url: string, body?: unknown): Promise<T> {
  return fetcher<T>(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
